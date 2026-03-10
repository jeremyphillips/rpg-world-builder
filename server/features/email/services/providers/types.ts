export interface EmailMessage {
  to: string
  subject: string
  text: string
  html?: string
}

export interface EmailResult {
  /** Ethereal preview URL (development only) */
  previewUrl?: string | false
}

export interface EmailProvider {
  sendEmail(message: EmailMessage): Promise<EmailResult>
}
