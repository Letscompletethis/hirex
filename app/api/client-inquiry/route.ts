import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "../../../lib/integration-auth";
import { buildClientInquiryEmail, sendTransactionalEmail } from "../../../lib/email";

const REQUIRED_FIELDS = ["fullName", "companyName", "companyEmail", "contactNumber", "message"] as const;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const payload = {
      fullName: String(body.fullName || "").trim(),
      companyName: String(body.companyName || "").trim(),
      companyEmail: String(body.companyEmail || "").trim(),
      contactNumber: String(body.contactNumber || "").trim(),
      message: String(body.message || "").trim(),
    };

    const missing = REQUIRED_FIELDS.filter((field) => !payload[field]);
    if (missing.length > 0) {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(payload.companyEmail)) {
      return NextResponse.json({ error: "Please enter a valid company email." }, { status: 400 });
    }

    const admin = getServiceRoleClient();
    const insert = await admin.from("client_inquiries").insert({
      full_name: payload.fullName,
      company_name: payload.companyName,
      company_email: payload.companyEmail,
      contact_number: payload.contactNumber,
      message: payload.message,
      source: "Talk to HireX",
      status: "new",
    }).select("id").single();

    if (insert.error) {
      throw new Error(insert.error.message);
    }

    const recipientEmail = process.env.HIREX_CLIENT_INQUIRY_EMAIL || "queries@hirexstaffing.com";
    const email = buildClientInquiryEmail({
      name: payload.fullName,
      companyName: payload.companyName,
      email: payload.companyEmail,
      phone: payload.contactNumber,
      message: payload.message,
      source: "Talk to HireX",
      sentAt: new Date().toISOString(),
    });

    const result = await sendTransactionalEmail({
      to: [{ email: recipientEmail }],
      subject: email.subject,
      text: email.text,
      html: email.html,
    });

    if (!result.ok) {
      console.error("[client-inquiry] email failed", result.error);
    }

    return NextResponse.json({
      message: "Thank you for contacting HireX. Our team will get in touch with you shortly.",
      inquiryId: insert.data?.id || null,
      emailStatus: result.ok ? "sent" : "logged",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit your inquiry.";
    console.error("[client-inquiry]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
