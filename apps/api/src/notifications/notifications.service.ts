import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

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

// ─── Email Channel (SMTP + Resend) ──────────────────────────────────────────
class EmailChannel implements NotificationChannel {
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor(
    private resend: Resend | null,
    private config: ConfigService,
    private logger: Logger,
  ) {
    const smtpHost = this.config.get('SMTP_HOST');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      const smtpPort = Number(this.config.get('SMTP_PORT', 587));
      const smtpSecure = this.config.get('SMTP_SECURE') === 'true' || smtpPort === 465;

      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
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

    const fromAddress = this.config.get('EMAIL_FROM', 'Ziva Housing <noreply@zivahousing.com>');
    const htmlContent = this.buildEmailHtml(n);

    // 1. Try SMTP if configured
    if (this.smtpTransporter) {
      try {
        await this.smtpTransporter.sendMail({
          from: fromAddress,
          to: n.user.email,
          subject: n.title,
          html: htmlContent,
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
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fb;">
        <div style="background: #2d3133; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #37e09b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Ziva Housing</h1>
          <p style="color: #c9c7c6; font-size: 11px; margin: 4px 0 0 0;">Verified Marketplace &amp; Home Services</p>
        </div>
        <div style="background: #ffffff; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #eceef0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <p style="color: #191c1e; font-size: 14px; font-weight: 600; margin-top: 0;">Hi ${n.user.firstName || 'Valued User'},</p>
          <h2 style="color: #5e23dc; font-size: 18px; font-weight: 700; margin-top: 8px;">${n.title}</h2>
          <p style="color: #494455; font-size: 13px; line-height: 1.6;">${n.body}</p>
          
          <div style="text-align: center; margin: 28px 0;">
            <a href="${this.config.get('APP_URL', 'http://localhost:3000')}" 
               style="display: inline-block; background: #5e23dc; color: #ffffff; font-weight: bold; font-size: 13px; padding: 14px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 10px rgba(94, 35, 220, 0.25);">
              Access Your Ziva Account
            </a>
          </div>

          <div style="border-top: 1px solid #eceef0; padding-top: 16px; margin-top: 24px;">
            <p style="color: #7a7487; font-size: 11px; margin: 0; text-align: center;">
              This is an automated notification from Ziva Housing platform. If you did not request this, please contact support.
            </p>
          </div>
        </div>
        <p style="color: #7a7487; font-size: 11px; text-align: center; margin-top: 20px;">
          &copy; 2026 Ziva Housing Technologies Pvt. Ltd. | All rights reserved.
        </p>
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
