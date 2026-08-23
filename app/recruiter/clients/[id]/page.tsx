"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Mail, MapPin, Phone, Globe, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Client = {
  id: string;
  client_id: string | null;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  industry: string | null;
  location: string | null;
  website: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Job = {
  id: string;
  job_id: string | null;
  title: string;
  company: string | null;
  status: string | null;
  client_id: string | null;
  created_at: string | null;
};

export default function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [client, setClient] = useState<Client | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const resolved = await params;

        if (!active) return;

        const [{ data: clientData, error: clientError }, { data: jobsData, error: jobsError }] =
          await Promise.all([
            supabase
              .from("clients")
              .select(
                "id,client_id,company_name,contact_name,contact_email,contact_phone,industry,location,website,status,notes,created_at,updated_at"
              )
              .eq("id", resolved.id)
              .maybeSingle(),
            supabase
              .from("jobs")
              .select("id,job_id,title,company,status,client_id,created_at")
              .eq("client_id", resolved.id)
              .order("created_at", { ascending: false }),
          ]);

        if (clientError) {
          throw new Error(clientError.message);
        }

        if (jobsError) {
          throw new Error(jobsError.message);
        }

        if (!clientData) {
          throw new Error("Client not found.");
        }

        if (!active) return;

        setClient(clientData);
        setJobs(jobsData ?? []);
      } catch (err) {
        if (!active) return;

        setError(err instanceof Error ? err.message : "Unable to load client.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [params]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
            Loading client...
          </div>
        </div>
      </main>
    );
  }

  if (error || !client) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <Link
            href="/recruiter/clients"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error ?? "Client not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <Link
            href="/recruiter/clients"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>

          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Building2 className="h-7 w-7" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {client.company_name}
                  </h1>

                  <div className="mt-1 text-sm text-gray-500">
                    {client.client_id ?? client.id}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {client.status && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                        {client.status}
                      </span>
                    )}

                    {client.industry && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        {client.industry}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                href="/recruiter/jobs"
                className="inline-flex items-center justify-center rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                View Jobs
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-base font-semibold text-gray-900">Contact Details</h2>

            <div className="mt-5 space-y-4 text-sm">
              {client.contact_name && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-400">
                    Contact
                  </div>
                  <div className="mt-1 text-gray-900">{client.contact_name}</div>
                </div>
              )}

              {client.contact_email && (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-gray-500" />
                  <a
                    href={`mailto:${client.contact_email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {client.contact_email}
                  </a>
                </div>
              )}

              {client.contact_phone && (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-gray-500" />
                  <a
                    href={`tel:${client.contact_phone}`}
                    className="text-gray-900 hover:underline"
                  >
                    {client.contact_phone}
                  </a>
                </div>
              )}

              {client.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">{client.location}</span>
                </div>
              )}

              {client.website && (
                <div className="flex items-start gap-3">
                  <Globe className="mt-0.5 h-4 w-4 text-gray-500" />
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all text-blue-600 hover:underline"
                  >
                    {client.website}
                  </a>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Jobs</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Jobs associated with this client.
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                {jobs.length}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-black/10">
              {jobs.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">
                  No jobs are currently associated with this client.
                </div>
              ) : (
                <div className="divide-y divide-black/10">
                  {jobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/recruiter/jobs?job=${job.id}`}
                      className="block p-4 transition hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-gray-900">
                            {job.title}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                            {job.job_id && <span>{job.job_id}</span>}
                            {job.company && <span>{job.company}</span>}
                            {job.created_at && (
                              <span>
                                {new Date(job.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {job.status && (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                              {job.status}
                            </span>
                          )}

                          <Briefcase className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {client.notes && (
          <section className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Notes</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {client.notes}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}