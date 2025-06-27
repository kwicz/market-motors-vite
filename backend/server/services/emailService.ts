import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendPasswordResetEmail(
    email: string,
    token: string
  ): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autogalleria.com',
        to: email,
        subject: 'Password Reset - Auto Galleria Express',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password for Auto Galleria Express.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent by Auto Galleria Express. Please do not reply to this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);

      logger.logServiceOperation(
        'EmailService',
        'sendPasswordResetEmail',
        true,
        {
          recipient: email,
          tokenLength: token.length,
        }
      );

      return true;
    } catch (error) {
      logger.logServiceOperation(
        'EmailService',
        'sendPasswordResetEmail',
        false,
        {
          recipient: email,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      if (error instanceof Error) {
        logger.error('Failed to send password reset email', error, {
          recipient: email,
          service: 'EmailService',
        });
      }

      return false;
    }
  }

  static async sendEmailVerification(
    email: string,
    token: string
  ): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@autogalleria.com',
        to: email,
        subject: 'Verify Your Email - Auto Galleria Express',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with Auto Galleria Express!</p>
            <p>Please click the button below to verify your email address:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This email was sent by Auto Galleria Express. Please do not reply to this email.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);

      logger.logServiceOperation(
        'EmailService',
        'sendEmailVerification',
        true,
        {
          recipient: email,
          tokenLength: token.length,
        }
      );

      return true;
    } catch (error) {
      logger.logServiceOperation(
        'EmailService',
        'sendEmailVerification',
        false,
        {
          recipient: email,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );

      if (error instanceof Error) {
        logger.error('Failed to send email verification', error, {
          recipient: email,
          service: 'EmailService',
        });
      }

      return false;
    }
  }
}
