import type { EmailProvider, EmailMessage, EmailResult } from './types'

// TODO: Configure with real SMTP credentials (e.g. Resend, SendGrid, AWS SES)
// Read host/port/auth from env vars when ready.

export const smtpProvider: EmailProvider = {
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    console.warn(
      '[email] SMTP provider not configured. Email not sent:',
      { to: message.to, subject: message.subject },
    )
    return {}
  },
}
