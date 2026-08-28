export type EmailRecipient = { name?: string; email: string };

export type MailAttachment = {
  filename: string;
  content: string | Buffer;
  contentType?: string;
};

export type EmailPayload = {
  to: EmailRecipient[];
  from?: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
};

function normalizeRecipients(recipients: EmailRecipient[]) {
  return recipients.map((recipient) => (recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email));
}

export async function sendTransactionalEmail(payload: EmailPayload) {
  const to = normalizeRecipients(payload.to);
  const provider = process.env.EMAIL_PROVIDER || "resend";

  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: payload.from || process.env.EMAIL_FROM || "HireX <noreply@hirexstaffing.com>",
        to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html || undefined,
        attachments: (payload.attachments || []).map((attachment) => ({
          filename: attachment.filename,
          content: Buffer.isBuffer(attachment.content)
            ? attachment.content.toString("base64")
            : Buffer.from(attachment.content).toString("base64"),
          content_type: attachment.contentType || "application/octet-stream",
        })),
      }),
    });

    if (response.ok) {
      const body = await response.json() as { id?: string };
      return { ok: true, provider, id: body.id || null };
    }

    const errorText = await response.text();
    return { ok: false, provider, error: errorText || "Email delivery failed." };
  }

  const fallback = {
    provider,
    ok: false,
    error: "No email provider is configured. Set RESEND_API_KEY or SMTP_* environment variables.",
  };

  console.warn("[email]", fallback.error, {
    subject: payload.subject,
    to,
    source: payload.text.slice(0, 200),
  });

  return fallback;
}

export function buildClientInquiryEmail(body: {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  message: string;
  source: string;
  sentAt: string;
}) {
  const lines = [
    `Name: ${body.name}`,
    `Company Name: ${body.companyName}`,
    `Email: ${body.email}`,
    `Contact Number: ${body.phone}`,
    `Source: ${body.source}`,
    `Date/Time: ${body.sentAt}`,
    "",
    "What are you looking for?",
    body.message,
  ];

  return {
    subject: "New Client Inquiry - Talk to HireX",
    text: lines.join("\n"),
    html: `<h2>New Client Inquiry</h2><p>${lines.map((line) => `<div>${line}</div>`).join("")}</p>`,
  };
}

export function buildApplicationEmail(body: {
  candidateName: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  appliedAt: string;
  candidateId?: string | null;
  applicationId?: string | null;
}) {
  const lines = [
    `Candidate Name: ${body.candidateName}`,
    `Email: ${body.email}`,
    `Phone: ${body.phone}`,
    `Job ID: ${body.jobId}`,
    `Job Title: ${body.jobTitle}`,
    `Application Date/Time: ${body.appliedAt}`,
    body.candidateId ? `Candidate ID: ${body.candidateId}` : "",
    body.applicationId ? `Application ID: ${body.applicationId}` : "",
    "",
    "Application submitted through the HireX ATS.",
  ];

  return {
    subject: `Application - ${body.jobId}, ${body.jobTitle}`,
    text: lines.filter(Boolean).join("\n"),
    html: `<h2>New application</h2><p>${lines.filter(Boolean).map((line) => `<div>${line}</div>`).join("")}</p>`,
  };
}
