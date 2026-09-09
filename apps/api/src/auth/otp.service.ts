import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_COOLDOWN_SECONDS = 60;
  private readonly recentOtpRequests = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // Save/Ensure Website Logo in SystemSetting database table
  private async ensureSystemLogoSetting(): Promise<string> {
    const defaultLogoUrl = `${this.config.get('APP_URL', 'http://localhost:3000')}/logo.png`;
    try {
      const setting = await this.prisma.systemSetting.upsert({
        where: { key: 'app_logo_url' },
        update: {},
        create: {
          key: 'app_logo_url',
          value: defaultLogoUrl,
        },
      });
      return setting.value || defaultLogoUrl;
    } catch {
      return defaultLogoUrl;
    }
  }

  // Generate a 6-digit OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(phone: string, email?: string): Promise<void> {
    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : phone.trim();

    // Enforce 60-second cooldown to prevent OTP spamming / credit draining
    const lastSent = this.recentOtpRequests.get(cleanPhone);
    const now = Date.now();
    if (lastSent && now - lastSent < this.OTP_COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil((this.OTP_COOLDOWN_SECONDS * 1000 - (now - lastSent)) / 1000);
      throw new BadRequestException(`Please wait ${waitSeconds} seconds before requesting another OTP.`);
    }
    this.recentOtpRequests.set(cleanPhone, now);

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP (hashed) in DB
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    try {
      await this.prisma.user.upsert({
        where: { phone: cleanPhone },
        update: { otpCode: otpHash, otpExpiresAt },
        create: {
          phone: cleanPhone,
          firstName: 'Unknown',
          lastName: 'User',
          email: email || undefined,
          otpCode: otpHash,
          otpExpiresAt,
          status: 'PENDING_VERIFICATION',
        },
      });
    } catch (err) {
      this.logger.warn('User upsert during OTP failed, attempting update', err);
      try {
        await this.prisma.user.updateMany({
          where: { phone: cleanPhone },
          data: { otpCode: otpHash, otpExpiresAt },
        });
      } catch {}
    }

    // Determine email destination if available
    let targetEmail = email;
    if (!targetEmail) {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone },
            { phone: `+91${cleanPhone}` },
          ],
        },
        select: { email: true },
      });
      if (user?.email) {
        targetEmail = user.email;
      }
    }

    // 1. Send via Email (SMTP / Resend) if email is present
    if (targetEmail) {
      await this.sendViaEmail(targetEmail, otp);
    }

    // 2. Send via MSG91 SMS
    await this.sendViaMSG91(cleanPhone, otp);
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length >= 10 ? rawDigits.slice(-10) : phone.trim();

    // Dev mode universal testing OTP fallback — NEVER runs in production
    if (process.env.NODE_ENV !== 'production' && (otp === '123456' || otp === '000000')) {
      this.logger.warn(`[DEV ONLY] Universal OTP bypass used for phone: ${cleanPhone}`);
      return true;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone },
          { phone: `+91${cleanPhone}` },
        ],
      },
    });
    if (!user || !user.otpCode || !user.otpExpiresAt) return false;

    if (user.otpExpiresAt < new Date()) return false;

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    return user.otpCode === otpHash;
  }

  private async sendViaEmail(email: string, otp: string): Promise<void> {
    const smtpHost = this.config.get('SMTP_HOST');
    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');
    const fromAddress = this.config.get('EMAIL_FROM', 'Ziva Housing <zivahousing@gmail.com>');
    const appUrl = this.config.get('APP_URL', 'http://localhost:3000');

    // Ensure database setting for app logo URL
    await this.ensureSystemLogoSetting();

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

    const subject = `Your Ziva Housing Verification Code: ${otp}`;
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ziva Housing OTP Verification</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f5f8; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f5f8; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #eceef0;">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background: linear-gradient(135deg, #0f0c1b 0%, #2a1b4e 50%, #4500b4 100%); padding: 32px 28px; text-align: center;">
                    <table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center">
                      <tr>
                        <td style="vertical-align: middle;">
                          ${
                            logoFilePath
                              ? `<img src="cid:zivaLogo" alt="Ziva Housing Logo" style="height: 48px; width: auto; display: block; max-height: 48px;" />`
                              : `<div style="width: 44px; height: 44px; background: #5e23dc; border-radius: 12px; display: inline-block; color: #fff; font-weight: bold; line-height: 44px; font-size: 20px;">Z</div>`
                          }
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
                    <div style="text-align: center; margin-bottom: 24px;">
                      <span style="display: inline-block; background-color: #f5f3ff; color: #5e23dc; font-size: 11px; font-weight: 700; padding: 6px 14px; border-radius: 30px; border: 1px solid #e8ddff; text-transform: uppercase; letter-spacing: 1px;">
                        🔒 Security Verification
                      </span>
                      <h2 style="color: #191c1e; font-size: 20px; font-weight: 700; margin: 14px 0 6px 0;">One-Time Password (OTP)</h2>
                      <p style="color: #494455; font-size: 13px; margin: 0; line-height: 1.5;">
                        Please enter the 6-digit verification code below to authorize your Ziva Housing account action.
                      </p>
                    </div>

                    <!-- OTP Highlight Card -->
                    <div style="background: linear-gradient(135deg, #5e23dc 0%, #3b009e 100%); border-radius: 16px; padding: 28px 20px; text-align: center; margin: 24px 0; box-shadow: 0 8px 20px rgba(94, 35, 220, 0.25);">
                      <span style="color: #e8ddff; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
                        Your 6-Digit Code
                      </span>
                      <div style="color: #ffffff; font-size: 42px; font-weight: 900; letter-spacing: 14px; margin: 4px 0; font-family: 'Courier New', Courier, monospace; text-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                        ${otp}
                      </div>
                      <p style="color: #cfbfff; font-size: 11px; margin: 10px 0 0 0; font-weight: 500;">
                        ⏱️ Valid for 10 minutes | Do not share this code with anyone
                      </p>
                    </div>

                    <!-- Action Link -->
                    <div style="text-align: center; margin-top: 28px; margin-bottom: 20px;">
                      <a href="${appUrl}/auth/login" 
                         style="display: inline-block; background-color: #191c1e; color: #ffffff; font-weight: 700; font-size: 13px; padding: 13px 30px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                        Verify &amp; Log In to Ziva Housing →
                      </a>
                    </div>

                    <!-- Security Tips -->
                    <div style="background-color: #f8f9fb; border-left: 3px solid #5e23dc; padding: 14px 16px; border-radius: 0 10px 10px 0; margin-top: 24px;">
                      <p style="color: #494455; font-size: 11px; margin: 0; line-height: 1.5;">
                        <strong>🛡️ Security Tip:</strong> Ziva Housing team members will never call, email, or message you asking for your OTP code or password.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fb; padding: 20px 28px; text-align: center; border-top: 1px solid #eceef0;">
                    <p style="color: #7a7487; font-size: 11px; margin: 0; line-height: 1.5;">
                      This is an automated security email sent to <strong>${email}</strong>.
                      <br />If you did not request this OTP, please ignore this email or contact <a href="mailto:support@zivahousing.com" style="color: #5e23dc; text-decoration: none; font-weight: 600;">support@zivahousing.com</a>.
                    </p>
                    <p style="color: #a09ab5; font-size: 10px; margin: 12px 0 0 0; font-weight: 500;">
                      &copy; 2026 Ziva Housing Technologies Pvt. Ltd. | India's Trusted Real Estate Platform
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

    // 1. Try SMTP if credentials exist
    if (smtpHost && smtpUser && smtpPass) {
      try {
        const smtpPort = Number(this.config.get('SMTP_PORT', 587));
        const smtpSecure = this.config.get('SMTP_SECURE') === 'true' || smtpPort === 465;
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpSecure,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const attachments = logoFilePath
          ? [{ filename: 'logo.png', path: logoFilePath, cid: 'zivaLogo' }]
          : [];

        await transporter.sendMail({
          from: fromAddress,
          to: email,
          subject,
          html,
          attachments,
        });
        this.logger.log(`[OTP] Sent verification email with embedded logo via SMTP to: ${email}`);
        return;
      } catch (err) {
        this.logger.error(`[OTP] SMTP send failed for ${email}:`, err);
      }
    }

    // 2. Try Resend if API key exists
    const resendKey = this.config.get('RESEND_API_KEY');
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: fromAddress,
          to: email,
          subject,
          html,
        });
        this.logger.log(`[OTP] Sent verification email via Resend to: ${email}`);
        return;
      } catch (err) {
        this.logger.error(`[OTP] Resend send failed for ${email}:`, err);
      }
    }

    // 3. Fallback dev log
    this.logger.log(`[DEV OTP EMAIL] To: ${email} | OTP: ${otp}`);
  }

  private async sendViaMSG91(phone: string, otp: string): Promise<void> {
    const authKey = this.config.get('MSG91_AUTH_KEY');
    const templateId = this.config.get('MSG91_TEMPLATE_ID');

    // In dev mode or if authKey missing, just log the OTP
    if (!authKey || this.config.get('NODE_ENV') === 'development') {
      this.logger.log(`[DEV OTP] Phone: ${phone} | OTP: ${otp}`);
      return;
    }

    try {
      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: templateId,
          mobile: `91${phone}`,
          otp,
        }),
      });

      if (!response.ok) {
        this.logger.error(`MSG91 send failed: ${await response.text()}`);
      }
    } catch (err) {
      this.logger.error('OTP send failed', err);
    }
  }
}
