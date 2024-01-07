export interface Header {
  return_path: string
  received: string[]
  date: string
  from: string
  to: string
  message_id: string
  subject: string
  mime_version: string
  content_type: string
  x_google_dkim_signature: string
  x_gm_message_state: string
  x_received: string[]
  x_forwarded_to: string
  x_forwarded_for: string
  delivered_to: string
  x_google_smtp_source: string
  arc_seal: string
  arc_message_signature: string
  arc_authentication_results: string
  received_spf: string
  authentication_results: string
  dkim_signature: string[]
  feedback_id: string
  x_ses_outgoing: string
}

export interface Spf {
  result: string
  domain: string
}

export interface Envelope {
  to: string
  recipients: string[]
  from: string
  helo_domain: string
  remote_ip: string
  tls: boolean
  tls_cipher: string
  md5: string
  spf: Spf
}

export interface Notification {
  headers: Header
  envelope: Envelope
  plain: string
  html: string
  reply_plain?: any
  attachments: any[]
}
