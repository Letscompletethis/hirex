"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Download, Eye, Plus, RefreshCw } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Contact = { id: string; name: string; email: string | null };
type Audience = { id: string; name: string; description: string | null };
type Template = { id: string; name: string; subject: string; body: string };
type Campaign = { id: string; name: string; audience_id: string | null; template_id: string | null; status: string; provider_status: string; provider_message: string | null };

const inputClass = "w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-purple-400/40";
const exportEntities = ["audiences", "templates", "campaigns", "recipients", "campaign_events"] as const;

export default function OutreachPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audienceName, setAudienceName] = useState("");
  const [template, setTemplate] = useState({ name: "", subject: "", body: "" });
  const [campaign, setCampaign] = useState({ name: "", audience_id: "", template_id: "" });
  const [member, setMember] = useState({ audience_id: "", contact_id: "" });
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [message, setMessage] = useState("");

  async function api(path: string, init?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(`/api/recruiter/business-development${path}`, { ...init, headers: { Authorization: `Bearer ${session?.access_token || ""}`, "Content-Type": "application/json", ...(init?.headers || {}) } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Outreach request failed.");
    return data;
  }

  const load = useCallback(async () => {
    const [outreach, contactData] = await Promise.all([api("?action=outreach"), api("?entity=contacts")]);
    setAudiences(outreach.audiences || []); setTemplates(outreach.templates || []); setCampaigns(outreach.campaigns || []); setContacts(contactData.contacts || []);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load().catch((error) => setMessage(error.message)); }, 0); return () => window.clearTimeout(timer); }, [load]);

  async function submit(event: FormEvent, entity: "audiences" | "templates" | "campaigns", body: Record<string, unknown>, reset: () => void) {
    event.preventDefault(); setMessage("");
    try { await api(`?entity=${entity}`, { method: "POST", body: JSON.stringify(body) }); reset(); await load(); setMessage("Saved."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
  }
  async function addMember(event: FormEvent) {
    event.preventDefault(); try { await api("", { method: "POST", body: JSON.stringify({ action: "add-member", ...member }) }); setMessage("Contact added to audience."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to add contact."); }
  }
  async function prepare(id: string) {
    try { const result = await api("", { method: "POST", body: JSON.stringify({ action: "prepare-campaign", campaign_id: id }) }); setMessage(`${result.prepared} recipient records prepared. Sending is unavailable until a provider is configured.`); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to prepare campaign."); }
  }
  async function showPreview() {
    if (!campaign.template_id || !member.contact_id) return;
    try { setPreview(await api("", { method: "POST", body: JSON.stringify({ action: "preview", template_id: campaign.template_id, contact_id: member.contact_id }) })); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to preview template."); }
  }
  async function exportData(entity: string) {
    try { const { data: { session } } = await supabase.auth.getSession(); const response = await fetch(`/api/recruiter/business-development?action=export&entity=${entity}`, { headers: { Authorization: `Bearer ${session?.access_token || ""}` } }); if (!response.ok) throw new Error("Unable to export outreach data."); const blob = await response.blob(); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `bd-${entity}.csv`; link.click(); URL.revokeObjectURL(link.href); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to export."); }
  }

  return <section className="mt-8 rounded-2xl border border-purple-400/20 bg-purple-400/[0.04] p-5">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/70">Owner outreach</p><h2 className="mt-2 text-xl font-semibold">Audiences, campaigns, and history</h2><p className="mt-1 text-xs text-white/40">Provider status is recorded; no email is sent from this workspace.</p></div><div className="flex flex-wrap gap-2">{exportEntities.map((entity) => <button key={entity} type="button" onClick={() => void exportData(entity)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[11px] capitalize text-white/55 hover:bg-white/[0.06]"><Download size={12} />{entity.replace("_", " ")}</button>)}<button type="button" onClick={() => void load()} aria-label="Refresh outreach data" className="rounded-lg border border-white/10 p-1.5 text-white/55 hover:bg-white/[0.06]"><RefreshCw size={13} /></button></div></div>
    {message && <p className="mb-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/65">{message}</p>}
    <div className="grid gap-4 lg:grid-cols-3">
      <form onSubmit={(event) => void submit(event, "audiences", { name: audienceName }, () => setAudienceName(""))} className="space-y-2 rounded-xl border border-white/[0.08] p-4"><h3 className="text-sm font-medium">New audience</h3><label className="block text-xs text-white/45">Name<input required value={audienceName} onChange={(event) => setAudienceName(event.target.value)} className={inputClass} /></label><button className="inline-flex items-center gap-1 rounded-lg bg-purple-500 px-3 py-2 text-xs font-semibold"><Plus size={13} /> Create</button></form>
      <form onSubmit={(event) => void submit(event, "templates", template, () => setTemplate({ name: "", subject: "", body: "" }))} className="space-y-2 rounded-xl border border-white/[0.08] p-4"><h3 className="text-sm font-medium">Template</h3><input required aria-label="Template name" placeholder="Name" value={template.name} onChange={(event) => setTemplate({ ...template, name: event.target.value })} className={inputClass} /><input required aria-label="Email subject" placeholder="Subject, e.g. Hello {{first_name}}" value={template.subject} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} className={inputClass} /><textarea required aria-label="Email body" placeholder="Body, e.g. {{company_name}}" value={template.body} onChange={(event) => setTemplate({ ...template, body: event.target.value })} className={`${inputClass} min-h-20`} /><button className="rounded-lg bg-purple-500 px-3 py-2 text-xs font-semibold">Save template</button></form>
      <form onSubmit={(event) => void submit(event, "campaigns", campaign, () => setCampaign({ name: "", audience_id: "", template_id: "" }))} className="space-y-2 rounded-xl border border-white/[0.08] p-4"><h3 className="text-sm font-medium">Campaign</h3><input required aria-label="Campaign name" placeholder="Campaign name" value={campaign.name} onChange={(event) => setCampaign({ ...campaign, name: event.target.value })} className={inputClass} /><select required aria-label="Audience" value={campaign.audience_id} onChange={(event) => setCampaign({ ...campaign, audience_id: event.target.value })} className={inputClass}><option value="">Select audience</option>{audiences.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select required aria-label="Template" value={campaign.template_id} onChange={(event) => setCampaign({ ...campaign, template_id: event.target.value })} className={inputClass}><option value="">Select template</option>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="rounded-lg bg-purple-500 px-3 py-2 text-xs font-semibold">Create campaign</button></form>
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-2"><form onSubmit={(event) => void addMember(event)} className="flex flex-wrap items-end gap-2 rounded-xl border border-white/[0.08] p-4"><label className="min-w-40 flex-1 text-xs text-white/45">Audience<select required value={member.audience_id} onChange={(event) => setMember({ ...member, audience_id: event.target.value })} className={inputClass}><option value="">Select</option>{audiences.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="min-w-40 flex-1 text-xs text-white/45">Contact<select required value={member.contact_id} onChange={(event) => setMember({ ...member, contact_id: event.target.value })} className={inputClass}><option value="">Select</option>{contacts.map((item) => <option key={item.id} value={item.id}>{item.name}{item.email ? ` - ${item.email}` : ""}</option>)}</select></label><button className="rounded-lg border border-white/10 px-3 py-2 text-xs">Add contact</button></form><div className="rounded-xl border border-white/[0.08] p-4"><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-medium">Merge preview</h3><button type="button" onClick={() => void showPreview()} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs"><Eye size={13} /> Preview</button></div>{preview ? <><p className="text-sm font-medium">{preview.subject}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/55">{preview.body}</p></> : <p className="text-xs text-white/35">Choose a template and contact.</p>}</div></div>
    <div className="mt-4 space-y-2">{campaigns.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] p-3"><div><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-white/40">{item.status} · provider: {item.provider_status}</p>{item.provider_message && <p className="mt-1 text-xs text-amber-200/70">{item.provider_message}</p>}</div><button type="button" onClick={() => void prepare(item.id)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">Prepare recipients</button></div>)}</div>
  </section>;
}
