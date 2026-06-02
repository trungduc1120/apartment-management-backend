// mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,      // email Gmail
        pass: process.env.GMAIL_APP_PASS,  // App Password
      },
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: `"Your App" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return info;
  }
}
