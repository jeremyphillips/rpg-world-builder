import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { EmailProvider, EmailMessage, EmailResult } from './types'

const FROM = '"D&D Character Builder" <no-reply@dnd-character-builder.dev>'

let transporter: Transporter | null = null

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter

  const testAccount = await nodemailer.createTestAccount()
  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  })

  console.log('[email] Ethereal test account created:', testAccount.user)
  return transporter
}

export const etherealProvider: EmailProvider = {
  async sendEmail(message: EmailMessage): Promise<EmailResult> {
    const t = await getTransporter()

    const info = await t.sendMail({
      from: FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    console.log('[email] Ethereal preview:', previewUrl)

    return { previewUrl }
  },
}
