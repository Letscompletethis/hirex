"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Mail, X } from "lucide-react";

const emptyForm = {
  fullName: "",
  companyName: "",
  companyEmail: "",
  contactNumber: "",
  message: "",
};

export function TalkToHirexModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setError(null);
    setSuccess(null);
    setForm(emptyForm);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeydown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [closeModal, open]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmed = {
      fullName: form.fullName.trim(),
      companyName: form.companyName.trim(),
      companyEmail: form.companyEmail.trim(),
      contactNumber: form.contactNumber.trim(),
      message: form.message.trim(),
    };

    if (!trimmed.fullName || !trimmed.companyName || !trimmed.companyEmail || !trimmed.contactNumber || !trimmed.message) {
      setError("Please complete all required fields.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed.companyEmail)) {
      setError("Please enter a valid company email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/client-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmed),
      });

      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        throw new Error(result.error || "Unable to send your inquiry.");
      }

      setSuccess(result.message || "Thank you for contacting HireX. Our team will get in touch with you shortly.");
      setForm(emptyForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send your inquiry.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Talk to HireX form">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-[#090b12] p-6 shadow-2xl sm:p-8">
        <button type="button" onClick={closeModal} className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/50 hover:text-white" aria-label="Close form">
          <X size={16} />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-purple-400/15 p-3 text-purple-200">
            <Mail size={18} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70">Talk to HireX</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Let&apos;s discuss your hiring needs</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-white/70">
              Full name
              <input value={form.fullName} onChange={(event) => setForm((previous) => ({ ...previous, fullName: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-300/40" placeholder="Jane Smith" required />
            </label>

            <label className="block text-sm text-white/70">
              Company name
              <input value={form.companyName} onChange={(event) => setForm((previous) => ({ ...previous, companyName: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-300/40" placeholder="Acme Inc." required />
            </label>

            <label className="block text-sm text-white/70">
              Company email
              <input type="email" value={form.companyEmail} onChange={(event) => setForm((previous) => ({ ...previous, companyEmail: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-300/40" placeholder="hello@company.com" required />
            </label>

            <label className="block text-sm text-white/70">
              Contact number
              <input value={form.contactNumber} onChange={(event) => setForm((previous) => ({ ...previous, contactNumber: event.target.value }))} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-300/40" placeholder="+1 (555) 123-4567" required />
            </label>
          </div>

          <label className="block text-sm text-white/70">
            What are you looking for?
            <textarea value={form.message} onChange={(event) => setForm((previous) => ({ ...previous, message: event.target.value }))} rows={5} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-300/40" placeholder="Tell us about the roles, hiring volume, or recruiting support you need." required />
          </label>

          {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{error}</div>}
          {success && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{success}</div>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10" disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-70">
              {isSubmitting ? <><Loader2 size={15} className="animate-spin" />Sending...</> : "Send inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
