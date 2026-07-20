import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { SentMessageInfo, Transporter } from 'nodemailer';

export interface SendWelcomeEmailInput {
  userId: string;
  email: string;
  name: string;
  deliveryKey: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = Number(this.configService.getOrThrow<string>('SMTP_PORT'));
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const username = this.configService.get<string>('SMTP_USER');
    const password =
      this.configService.get<string>('SMTP_PASSWORD') ??
      this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        username && password ? { user: username, pass: password } : undefined,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
  }

  async onModuleInit(): Promise<void> {
    const environment = this.configService.get<string>('NODE_ENV');
    if (environment === 'test') {
      return;
    }
    await this.transporter.verify();
    this.logger.log('SMTP connection verified');
  }

  async sendWelcomeEmail(
    input: SendWelcomeEmailInput,
  ): Promise<SentMessageInfo> {
    const safeName = escapeHtml(input.name);
    const subject = 'Aramıza hoş geldin!';
    const text = `Merhaba ${input.name},\n\nHesabın başarıyla oluşturuldu.`;
    const html = `<!doctype html><html lang="tr"><body style="padding:32px;font-family:Arial,sans-serif;background:#f5f5f5"><main style="max-width:600px;margin:auto;padding:32px;background:white;border-radius:12px"><h1>Hoş geldin, ${safeName}!</h1><p>Hesabın başarıyla oluşturuldu.</p></main></body></html>`;
    return this.transporter.sendMail({
      from: {
        name: this.configService.getOrThrow<string>('MAIL_FROM_NAME'),
        address: this.configService.getOrThrow<string>('MAIL_FROM_ADDRESS'),
      },
      to: input.email,
      subject,
      text,
      html,
      messageId: `<${input.deliveryKey}@${
        this.configService.getOrThrow<string>('MAIL_FROM_ADDRESS').split('@')[1]
      }>`,
      headers: {
        'X-User-ID': input.userId,
        'X-Delivery-Key': input.deliveryKey,
      },
    });
  }
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, (character) => replacements[character]);
}
