import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

interface NotificationChannel {
  send(notification: NotificationPayload & { user: any }): Promise<void>;
}

/**
 * Notification service — abstracted behind an interface.
 * Adding new channels (WhatsApp, Push) requires only implementing
 * NotificationChannel and registering it in this service.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private channels: NotificationChannel[];
  private resend: Resend | null;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    const resendKey = config.get('RESEND_API_KEY');
    this.resend = resendKey ? new Resend(resendKey) : null;

    // Register channels
    this.channels = [
      new InAppChannel(prisma),
      new EmailChannel(this.resend, config, this.logger),
      new SmsChannel(config, this.logger),
    ];
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, phone: true, firstName: true, fcmToken: true },
    });

    if (!user) {
      this.logger.warn(`User ${payload.userId} not found for notification`);
      return;
    }

    // Fire all channels concurrently
    await Promise.allSettled(
      this.channels.map((ch) => ch.send({ ...payload, user })),
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}

// ─── In-App Channel ─────────────────────────────────────────────────────────
class InAppChannel implements NotificationChannel {
  constructor(private prisma: PrismaService) { }

  async send(n: NotificationPayload & { user: any }) {
    await this.prisma.notification.create({
      data: {
        userId: n.userId,
        type: n.type as any,
        channel: 'IN_APP',
        title: n.title,
        body: n.body,
        payload: n.payload as any,
        sentAt: new Date(),
      },
    });
  }
}

// ─── Email Channel (Nodemailer SMTP / Resend) ─────────────────────────────────
class EmailChannel implements NotificationChannel {
  private smtpTransporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor(
    private resendClient: Resend | null,
    private config: ConfigService,
    private logger: Logger,
  ) {
    this.resend = resendClient;
    const smtpHost = this.config.get('SMTP_HOST');
    const smtpPort = Number(this.config.get('SMTP_PORT', 587));
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');
    const smtpSecure = this.config.get('SMTP_SECURE') === 'true' || smtpPort === 465;

    if (smtpHost && smtpUser && smtpPass) {
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });
      this.logger.log(`EmailChannel configured with SMTP: ${smtpHost}:${smtpPort}`);
    } else if (this.resend) {
      this.logger.log('EmailChannel configured with Resend API');
    } else {
      this.logger.warn('No SMTP or Resend credentials found — emails will be logged in console.');
    }
  }

  async send(n: NotificationPayload & { user: any }) {
    if (!n.user.email) return;

    const fromAddress = this.config.get('EMAIL_FROM', 'Ziva Housing <zivahousing@gmail.com>');
    const htmlContent = this.buildEmailHtml(n);

    // Resolve local logo file for CID inline embedding
    const possibleLogoPaths = [
      path.resolve(process.cwd(), '../web/public/logo.png'),
      path.resolve(process.cwd(), 'public/logo.png'),
      path.resolve(__dirname, '../../../../apps/web/public/logo.png'),
    ];
    let logoFilePath: string | null = null;
    for (const p of possibleLogoPaths) {
      if (fs.existsSync(p)) {
        logoFilePath = p;
        break;
      }
    }

    const attachments = logoFilePath
      ? [{ filename: 'logo.png', path: logoFilePath, cid: 'zivaLogo' }]
      : [];

    // 1. Try SMTP if configured
    if (this.smtpTransporter) {
      try {
        await this.smtpTransporter.sendMail({
          from: fromAddress,
          to: n.user.email,
          subject: n.title,
          html: htmlContent,
          attachments,
        });
        this.logger.log(`SMTP email sent successfully to ${n.user.email}`);
        return;
      } catch (err) {
        this.logger.error(`SMTP email failed for ${n.user.email}:`, err);
      }
    }

    // 2. Fallback to Resend API if configured
    if (this.resend) {
      try {
        await this.resend.emails.send({
          from: fromAddress,
          to: n.user.email,
          subject: n.title,
          html: htmlContent,
        });
        this.logger.log(`Resend email sent successfully to ${n.user.email}`);
        return;
      } catch (err) {
        this.logger.error(`Resend email failed for ${n.user.email}:`, err);
      }
    }

    // 3. Fallback for Development: Log email content
    this.logger.debug(`[DEV EMAIL] To: ${n.user.email} | Subject: ${n.title}\n${n.body}`);
  }

  private buildEmailHtml(n: NotificationPayload & { user: any }): string {
    const appUrl = this.config.get('APP_URL', 'http://localhost:3000');
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${n.title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f5f8; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f8; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eceef0;">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f0c1b 0%, #2a1b4e 50%, #4500b4 100%); padding: 32px 28px; text-align: center;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                      <tr>
                        <td style="vertical-align: middle;">
                          <img src="cid:zivaLogo" alt="Ziva Housing Logo" style="height: 44px; width: auto; display: block; max-height: 44px;" />
                        </td>
                        <td style="vertical-align: middle; padding-left: 14px;">
                          <span style="color: #ffffff; font-size: 24px; font-weight: 800; font-family: 'Segoe UI', sans-serif; letter-spacing: -0.5px;">Ziva Housing</span>
                        </td>
                      </tr>
                    </table>
                    <p style="color: #cfbfff; font-size: 11px; margin: 8px 0 0 0; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">VERIFIED REAL ESTATE MARKETPLACE &amp; SERVICES</p>
                  </td>
                </tr>

                <!-- Main Body -->
                <tr>
                  <td style="padding: 36px 32px; background-color: #ffffff;">
                    <p style="color: #191c1e; font-size: 15px; font-weight: 700; margin-top: 0;">Hi ${n.user.firstName || 'Valued User'},</p>
                    <h2 style="color: #5e23dc; font-size: 18px; font-weight: 700; margin: 12px 0;">${n.title}</h2>
                    <p style="color: #494455; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0;">${n.body}</p>
                    
                    <div style="text-align: center; margin: 28px 0;">
                      <a href="${appUrl}/auth/login" 
                         style="display: inline-block; background: linear-gradient(135deg, #5e23dc 0%, #4500b4 100%); color: #ffffff; font-weight: 700; font-size: 13px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(94, 35, 220, 0.35);">
                        Access Your Ziva Account →
                      </a>
                    </div>

                    <div style="border-top: 1px solid #eceef0; padding-top: 16px; margin-top: 28px;">
                      <p style="color: #7a7487; font-size: 11px; margin: 0; text-align: center; line-height: 1.5;">
                        This is an automated notification from Ziva Housing platform. If you did not request this, please contact support.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fb; padding: 20px 28px; text-align: center; border-top: 1px solid #eceef0;">
                    <p style="color: #a09ab5; font-size: 10px; margin: 0; font-weight: 500;">
                      &copy; 2026 Ziva Housing Technologies Pvt. Ltd. | All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

// ─── SMS Channel (MSG91) ────────────────────────────────────────────────────
class SmsChannel implements NotificationChannel {
  constructor(
    private config: ConfigService,
    private logger: Logger,
  ) { }

  async send(n: NotificationPayload & { user: any }) {
    if (!n.user.phone) return;
    const authKey = this.config.get('MSG91_AUTH_KEY');
    if (!authKey || this.config.get('NODE_ENV') === 'development') {
      this.logger.debug(`[DEV SMS] To: ${n.user.phone} | ${n.title}: ${n.body}`);
      return;
    }

    try {
      await fetch('https://api.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authkey: authKey },
        body: JSON.stringify({
          template_id: this.config.get('MSG91_NOTIF_TEMPLATE_ID'),
          recipients: [{ mobiles: `91${n.user.phone}`, message: n.body }],
        }),
      });
    } catch (err) {
      this.logger.error(`SMS send failed:`, err);
    }
  }
}
