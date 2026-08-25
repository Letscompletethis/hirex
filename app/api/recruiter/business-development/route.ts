import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { requireOwner } from "../../../../lib/business-development-auth";

const entities = ["companies", "contacts", "opportunities", "activities", "requirements", "audiences", "templates", "campaigns", "recipients", "campaign_events"] as const;
type Entity = (typeof entities)[number];
const tables: Record<Entity, string> = { companies: "bd_companies", contacts: "bd_contacts", opportunities: "bd_opportunities", activities: "bd_activities", requirements: "bd_job_requirements", audiences: "bd_audiences", templates: "bd_campaign_templates", campaigns: "bd_campaigns", recipients: "bd_campaign_recipients", campaign_events: "bd_campaign_events" };
const csvFields: Record<Entity, string[]> = {
  companies: ["name", "industry", "website", "location", "address", "country", "linkedin_url", "employee_count", "revenue_range", "status", "notes"],
  contacts: ["company_id", "name", "title", "email", "phone", "department", "linkedin_url", "status", "notes"],
  opportunities: ["company_id", "contact_id", "title", "value", "stage", "probability", "next_follow_up", "notes"],
  activities: ["company_id", "contact_id", "opportunity_id", "type", "subject", "notes", "due_at", "completed_at"],
  requirements: ["job_id", "company_id", "title", "description", "experience", "skills"],
  audiences: ["name", "description", "filters", "created_by"],
  templates: ["name", "subject", "body", "merge_fields", "created_by"],
  campaigns: ["name", "audience_id", "template_id", "status", "provider", "provider_status", "provider_message", "scheduled_at", "created_by"],
  recipients: ["campaign_id", "contact_id", "email", "name", "status", "provider_message_id", "provider_status", "error", "rendered_subject", "sent_at"],
  campaign_events: ["campaign_id", "recipient_id", "event_type", "metadata", "created_at"],
};

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unable to process request.";
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}

function entityFrom(request: NextRequest): Entity | null {
  const entity = request.nextUrl.searchParams.get("entity") as Entity | null;
  return entity && entities.includes(entity) ? entity : null;
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === '"' && input[index + 1] === '"' && quoted) { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { row.push(value); value = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) { if (character === "\r" && input[index + 1] === "\n") index += 1; row.push(value); if (row.some((cell) => cell.trim())) rows.push(row); row = []; value = ""; }
    else value += character;
  }
  row.push(value); if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function csvEscape(value: unknown) { const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value); return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }

export async function GET(request: NextRequest) {
  try {
    const { admin } = await requireOwner(request);
    const action = request.nextUrl.searchParams.get("action");
    if (action === "export") {
      const exportEntity = request.nextUrl.searchParams.get("entity") as Entity;
      if (!csvFields[exportEntity]) return NextResponse.json({ error: "A valid BD export entity is required." }, { status: 400 });
      const { data, error } = await admin.from(tables[exportEntity]).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const fields = [...csvFields[exportEntity], "custom_fields"];
      const body = (data || []).map((record) => fields.map((field) => record[field]).map(csvEscape).join(","));
      return new NextResponse([fields.join(","), ...body].join("\r\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename=bd-${exportEntity}.csv` } });
    }
    if (action === "jobs") {
      const { data, error } = await admin.from("jobs").select("id,job_id,title,company,description,experience,qualifications").order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ jobs: data || [] });
    }
    if (action === "outreach") {
      const outreachEntities = ["audiences", "templates", "campaigns", "recipients", "campaign_events"] as const;
      const results = await Promise.all(outreachEntities.map(async (name) => {
        const { data, error } = await admin.from(tables[name]).select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return [name, data || []] as const;
      }));
      return NextResponse.json(Object.fromEntries(results));
    }
    const entity = entityFrom(request);
    if (entity) {
      const { data, error } = await admin.from(tables[entity]).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ [entity]: data || [] });
    }
    const results = await Promise.all(entities.map(async (name) => {
      const { data, error } = await admin.from(tables[name]).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return [name, data || []] as const;
    }));
    return NextResponse.json(Object.fromEntries(results));
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, user } = await requireOwner(request);
    if (request.nextUrl.searchParams.get("action") === "import-workbook") {
      const entity = request.nextUrl.searchParams.get("entity") as "companies" | "contacts";
      if (!csvFields[entity]) return NextResponse.json({ error: "Workbook import supports companies or contacts." }, { status: 400 });
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "A workbook file is required." }, { status: 400 });
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = String(formData.get("sheet") || workbook.SheetNames[0] || "");
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return NextResponse.json({ error: "The selected sheet was not found." }, { status: 400 });
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
      if (rows.length < 2) return NextResponse.json({ error: "The selected sheet must include headers and at least one row." }, { status: 400 });
      const headers = rows[0].map((header) => String(header).trim());
      const records = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => {
        const record: Record<string, unknown> = {}, customFields: Record<string, string> = {};
        headers.forEach((header, index) => { const cell = String(row[index] ?? "").trim(); if (csvFields[entity].includes(header)) record[header] = cell || null; else if (header) customFields[header] = cell; });
        record.custom_fields = customFields;
        if (entity === "companies") record.created_by = user.id;
        return record;
      });
      const { data, error } = await admin.from(tables[entity]).insert(records).select("id");
      if (error) throw error;
      return NextResponse.json({ imported: data?.length || 0, sheet: sheetName, sheets: workbook.SheetNames }, { status: 201 });
    }
    const body = await request.json();
    if (body.action === "add-member") {
      if (!body.audience_id || !body.contact_id) return NextResponse.json({ error: "An audience and contact are required." }, { status: 400 });
      const { data, error } = await admin.from("bd_audience_contacts").upsert({ audience_id: body.audience_id, contact_id: body.contact_id, added_by: user.id }, { onConflict: "audience_id,contact_id" }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    if (body.action === "preview") {
      if (!body.template_id || !body.contact_id) return NextResponse.json({ error: "A template and contact are required." }, { status: 400 });
      const [{ data: template, error: templateError }, { data: contact, error: contactError }] = await Promise.all([
        admin.from("bd_campaign_templates").select("subject,body").eq("id", body.template_id).single(),
        admin.from("bd_contacts").select("name,email,title,company_id").eq("id", body.contact_id).single(),
      ]);
      if (templateError) throw templateError;
      if (contactError) throw contactError;
      const { data: company } = await admin.from("bd_companies").select("name,website,industry,location").eq("id", contact.company_id).maybeSingle();
      const parts = String(contact.name || "").trim().split(/\s+/);
      const fields: Record<string, string> = { contact_name: contact.name || "", first_name: parts[0] || "", last_name: parts.slice(1).join(" "), title: contact.title || "", email: contact.email || "", company_name: company?.name || "", company_website: company?.website || "", company_industry: company?.industry || "", company_location: company?.location || "" };
      const render = (value: string) => value.replace(/{{\s*([a-z_]+)\s*}}/gi, (_match, key: string) => fields[key.toLowerCase()] ?? "");
      return NextResponse.json({ subject: render(template.subject), body: render(template.body), fields });
    }
    if (body.action === "prepare-campaign") {
      if (!body.campaign_id) return NextResponse.json({ error: "A campaign id is required." }, { status: 400 });
      const { data: campaign, error: campaignError } = await admin.from("bd_campaigns").select("id,audience_id,template_id").eq("id", body.campaign_id).single();
      if (campaignError) throw campaignError;
      if (!campaign.audience_id || !campaign.template_id) return NextResponse.json({ error: "Campaign needs an audience and template before preparation." }, { status: 400 });
      const { data: members, error: memberError } = await admin.from("bd_audience_contacts").select("contact_id,bd_contacts(id,name,email)").eq("audience_id", campaign.audience_id);
      if (memberError) throw memberError;
      const recipients = (members || []).map((member) => {
        const contact = Array.isArray(member.bd_contacts) ? member.bd_contacts[0] : member.bd_contacts;
        return contact?.email ? { campaign_id: campaign.id, contact_id: member.contact_id, email: contact.email, name: contact.name, status: "ready" } : null;
      }).filter((recipient): recipient is { campaign_id: string; contact_id: string; email: string; name: string; status: string } => Boolean(recipient));
      const { error: recipientError } = recipients.length ? await admin.from("bd_campaign_recipients").upsert(recipients, { onConflict: "campaign_id,contact_id" }) : { error: null };
      if (recipientError) throw recipientError;
      const { data, error } = await admin.from("bd_campaigns").update({ status: "ready", provider_status: "not_configured", provider_message: "Recipients prepared. Configure an email provider before sending." }).eq("id", campaign.id).select().single();
      if (error) throw error;
      return NextResponse.json({ campaign: data, prepared: recipients.length, sendable: false });
    }
    if (body.action === "import") {
      const importEntity = body.entity as "companies" | "contacts";
      if (!csvFields[importEntity] || typeof body.csv !== "string") return NextResponse.json({ error: "A companies or contacts CSV is required." }, { status: 400 });
      const rows = parseCsv(body.csv);
      if (rows.length < 2) return NextResponse.json({ error: "The CSV must include a header and at least one row." }, { status: 400 });
      const headers = rows[0].map((header) => header.trim());
      const records = rows.slice(1).map((cells) => {
        const record: Record<string, unknown> = {}, customFields: Record<string, string> = {};
        headers.forEach((header, index) => { const cell = cells[index]?.trim() || ""; if (csvFields[importEntity].includes(header)) record[header] = header === "employee_count" ? (cell ? Number(cell) : null) : cell || null; else if (header && header !== "custom_fields") customFields[header] = cell; });
        record.custom_fields = customFields;
        return record;
      });
      const { data, error } = await admin.from(tables[importEntity]).insert(records).select();
      if (error) throw error;
      return NextResponse.json({ imported: data?.length || 0 }, { status: 201 });
    }
    if (body.action === "convert-job") {
      if (!body.job_id) return NextResponse.json({ error: "A job id is required." }, { status: 400 });
      const { data: job, error: jobError } = await admin.from("jobs").select("id,title,description,experience,qualifications").eq("id", body.job_id).single();
      if (jobError) throw jobError;
      const { data, error } = await admin.from("bd_job_requirements").upsert({ job_id: job.id, title: job.title, description: job.description, experience: job.experience, skills: job.qualifications || [], created_by: user.id }, { onConflict: "job_id" }).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data }, { status: 201 });
    }
    const entity = entityFrom(request);
    if (!entity) return NextResponse.json({ error: "A valid entity is required." }, { status: 400 });
    const { data, error } = await admin.from(tables[entity]).insert(body).select().single();
    if (error) throw error;
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin } = await requireOwner(request);
    const entity = entityFrom(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!entity || !id) return NextResponse.json({ error: "A valid entity and id are required." }, { status: 400 });
    const { data, error } = await admin.from(tables[entity]).update(await request.json()).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin } = await requireOwner(request);
    const entity = entityFrom(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!entity || !id) return NextResponse.json({ error: "A valid entity and id are required." }, { status: 400 });
    const { error } = await admin.from(tables[entity]).delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}