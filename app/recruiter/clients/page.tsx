
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

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
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Job = {
  id: string;
  job_id: string | null;
  title: string;
  company: string;
  status: string;
  client_id: string | null;
  created_at: string;
};

type NewClient = {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  industry: string;
  location: string;
  website: string;
  notes: string;
};

function normalizeJobStatus(status: string | null) {
  const value = (status || "").toLowerCase().trim();

  if (
    value === "published" ||
    value === "open" ||
    value === "active"
  ) {
    return "active";
  }

  if (
    value === "hold" ||
    value === "on hold" ||
    value === "paused"
  ) {
    return "hold";
  }

  if (
    value === "closed" ||
    value === "close"
  ) {
    return "closed";
  }

  if (
    value === "filled" ||
    value === "hired"
  ) {
    return "filled";
  }

  return value || "draft";
}

function createClientId(existingClients: Client[]) {
  const existingClientIds = new Set(
    existingClients.map((client) => client.client_id)
  );

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const randomNumber = crypto.getRandomValues(
      new Uint32Array(1)
    )[0] % 1000;
    const clientId = `HX-CLIENT-${String(
      randomNumber
    ).padStart(3, "0")}`;

    if (!existingClientIds.has(clientId)) {
      return clientId;
    }
  }

  throw new Error("Unable to allocate a client number.");
}

export default function ClientsPage() {
  const [clients, setClients] =
    useState<Client[]>([]);

  const [jobs, setJobs] =
    useState<Job[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showAddClient, setShowAddClient] =
    useState(false);

  const [newClient, setNewClient] =
    useState<NewClient>({
      company_name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      industry: "",
      location: "",
      website: "",
      notes: "",
    });

  async function loadClients() {
    setLoading(true);
    setError("");

    try {
      const clientsRequest =
        await supabase
          .from("clients")
          .select(
            "id,client_id,company_name,contact_name,contact_email,contact_phone,industry,location,website,status,notes,created_at,updated_at"
          )
          .order("created_at", {
            ascending: false,
          });

      if (clientsRequest.error) {
        throw new Error(
          clientsRequest.error.message
        );
      }

      const jobsRequest =
        await supabase
          .from("jobs")
          .select(
            "id,job_id,title,company,status,client_id,created_at"
          )
          .order("created_at", {
            ascending: false,
          });

      if (jobsRequest.error) {
        throw new Error(
          jobsRequest.error.message
        );
      }

      setClients(
        (clientsRequest.data as Client[]) ||
          []
      );

      setJobs(
        (jobsRequest.data as Job[]) || []
      );
    } catch (err) {
      console.error(
        "Clients page error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load clients."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        client.company_name
          .toLowerCase()
          .includes(query) ||
        client.contact_name
          ?.toLowerCase()
          .includes(query) ||
        client.contact_email
          ?.toLowerCase()
          .includes(query) ||
        client.client_id
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        client.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    clients,
    search,
    statusFilter,
  ]);

  const activeClients = clients.filter(
    (client) =>
      client.status === "active"
  ).length;

  const totalJobs = jobs.length;

  const assignedJobs = jobs.filter(
    (job) => Boolean(job.client_id)
  ).length;

  async function handleAddClient(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !newClient.company_name.trim()
    ) {
      setError(
        "Company name is required."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const clientId =
        createClientId(clients);

      const { error: insertError } =
        await supabase
          .from("clients")
          .insert({
            client_id: clientId,
            company_name:
              newClient.company_name.trim(),
            contact_name:
              newClient.contact_name.trim() ||
              null,
            contact_email:
              newClient.contact_email.trim() ||
              null,
            contact_phone:
              newClient.contact_phone.trim() ||
              null,
            industry:
              newClient.industry.trim() ||
              null,
            location:
              newClient.location.trim() ||
              null,
            website:
              newClient.website.trim() ||
              null,
            notes:
              newClient.notes.trim() ||
              null,
            status: "active",
          });

      if (insertError) {
        throw new Error(
          insertError.message
        );
      }

      setNewClient({
        company_name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        industry: "",
        location: "",
        website: "",
        notes: "",
      });

      setShowAddClient(false);

      await loadClients();
    } catch (err) {
      console.error(
        "Create client error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not create client."
      );
    } finally {
      setSaving(false);
    }
  }

  function getClientJobs(
    clientId: string
  ) {
    return jobs.filter(
      (job) =>
        job.client_id === clientId
    );
  }

  function getJobCounts(
    clientId: string
  ) {
    const clientJobs =
      getClientJobs(clientId);

    return {
      total: clientJobs.length,

      active: clientJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "active"
      ).length,

      hold: clientJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "hold"
      ).length,

      closed: clientJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "closed"
      ).length,

      filled: clientJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "filled"
      ).length,
    };
  }

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">

        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
              HireX ATS
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Clients
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Manage client accounts, jobs,
              recruiting activity and future
              client reporting.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadClients}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setShowAddClient(true)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400"
            >
              <Plus size={17} />
              Add Client
            </button>
          </div>
        </header>

        {error && (
          <section className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
            <p className="font-semibold text-red-200">
              Something went wrong
            </p>

            <p className="mt-1 text-sm text-red-200/60">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="mt-3 text-xs text-red-200 underline"
            >
              Dismiss
            </button>
          </section>
        )}

        <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Clients"
            value={clients.length}
            icon={
              <Building2 size={20} />
            }
          />

          <SummaryCard
            label="Active Clients"
            value={activeClients}
            icon={
              <Users size={20} />
            }
            accent="green"
          />

          <SummaryCard
            label="Total Jobs"
            value={totalJobs}
            icon={
              <BriefcaseBusiness
                size={20}
              />
            }
            accent="blue"
          />

          <SummaryCard
            label="Jobs Assigned to Clients"
            value={assignedJobs}
            icon={
              <BriefcaseBusiness
                size={20}
              />
            }
            accent="purple"
          />
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search clients, contacts or client ID..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/40"
              />
            </div>

            <div className="flex gap-2">
              {[
                ["all", "All"],
                ["active", "Active"],
                ["inactive", "Inactive"],
              ].map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(
                        value
                      )
                    }
                    className={
                      "rounded-lg border px-4 py-2.5 text-xs font-medium transition " +
                      (statusFilter ===
                      value
                        ? "border-purple-400/30 bg-purple-400/10 text-purple-200"
                        : "border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.07] hover:text-white")
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/40">
            <Loader2
              size={20}
              className="mr-3 animate-spin"
            />
            Loading clients...
          </div>
        ) : filteredClients.length ===
          0 ? (
          <EmptyClients
            hasSearch={
              Boolean(search) ||
              statusFilter !== "all"
            }
            onAdd={() =>
              setShowAddClient(true)
            }
          />
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClients.map(
              (client) => {
                const counts =
                  getJobCounts(
                    client.id
                  );

                return (
                  <a
                    key={client.id}
                    href={`/recruiter/clients/${client.id}`}
                    className="group rounded-3xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-purple-400/20 hover:bg-white/[0.045]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-400/10 text-purple-200">
                          <Building2
                            size={21}
                          />
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold">
                            {
                              client.company_name
                            }
                          </h2>

                          <p className="mt-1 text-[11px] text-white/30">
                            {client.client_id ||
                              "No Client ID"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={
                          "rounded-full border px-2.5 py-1 text-[10px] font-medium " +
                          (client.status ===
                          "active"
                            ? "border-green-400/20 bg-green-400/10 text-green-300"
                            : "border-white/10 bg-white/[0.04] text-white/40")
                        }
                      >
                        {client.status}
                      </span>
                    </div>

                    <div className="mt-5 space-y-2">
                      {client.contact_name && (
                        <div className="flex items-center gap-2 text-xs text-white/45">
                          <Users
                            size={14}
                            className="text-white/25"
                          />
                          {
                            client.contact_name
                          }
                        </div>
                      )}

                      {client.contact_email && (
                        <div className="flex min-w-0 items-center gap-2 text-xs text-white/45">
                          <Mail
                            size={14}
                            className="shrink-0 text-white/25"
                          />
                          <span className="truncate">
                            {
                              client.contact_email
                            }
                          </span>
                        </div>
                      )}

                      {client.location && (
                        <div className="flex items-center gap-2 text-xs text-white/45">
                          <MapPin
                            size={14}
                            className="text-white/25"
                          />
                          {
                            client.location
                          }
                        </div>
                      )}

                      {client.contact_phone && (
                        <div className="flex items-center gap-2 text-xs text-white/45">
                          <Phone
                            size={14}
                            className="text-white/25"
                          />
                          {
                            client.contact_phone
                          }
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border-t border-white/[0.06] pt-5">
                      <div className="grid grid-cols-3 gap-2">
                        <ClientMetric
                          label="Jobs"
                          value={
                            counts.total
                          }
                        />

                        <ClientMetric
                          label="Active"
                          value={
                            counts.active
                          }
                        />

                        <ClientMetric
                          label="Filled"
                          value={
                            counts.filled
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-between text-xs">
                      <span className="text-white/30">
                        View client
                      </span>

                      <ArrowRight
                        size={15}
                        className="text-white/20 transition group-hover:translate-x-1 group-hover:text-purple-200"
                      />
                    </div>
                  </a>
                );
              }
            )}
          </section>
        )}
      </div>

      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0c13] shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-[#0b0c13] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold">
                  Add Client
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Create a client account for
                  managing jobs and recruiting
                  activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddClient(false)
                }
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleAddClient}
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Company Name"
                  required
                  value={
                    newClient.company_name
                  }
                  onChange={(value) =>
                    setNewClient(
                      (current) => ({
                        ...current,
                        company_name:
                          value,
                      })
                    )
                  }
                  placeholder="e.g. Acme Corporation"
                />

                <FormField
                  label="Contact Name"
                  value={
                    newClient.contact_name
                  }
                  onChange={(value) =>
                    setNewClient(
                      (current) => ({
                        ...current,
                        contact_name:
                          value,
                      })
                    )
                  }
                  placeholder="e.g. Sarah Johnson"
                />

                <FormField
                  label="Contact Email"
                  type="email"
                  value={
                    newClient.contact_email
                  }
                  onChange={(value) =>
                    setNewClient(
                      (current) => ({
                        ...current,
                        contact_email:
                          value,
                      })
                    )
                  }
                  placeholder="contact@company.com"
                />

                <FormField
                  label="Contact Phone"
                  value={
                    newClient.contact_phone
                  }
                  onChange={(value) =>
                    setNewClient(
                      (current) => ({
                        ...current,
                        contact_phone:
                          value,
                      })
                    )
                  }
                  placeholder="+1 555 123 4567"
                />

                <FormField
                  label="Industry"
                  value={
                    newClient.industry
                  }
                  onChange={(value) =>
                    setNewClient(
                      (current) => ({
                        ...current,
                        industry: value,
                      })
                    )
                  }
                  placeholder="Technology"
                />

                <FormField
                  label="Location"
                  value={
                    newClient.location
                  }
                  onChange={(value) =>
                    setNewClient(
                      (current) => ({
                        ...current,
                        location: value,
                      })
                    )
                  }
                  placeholder="New York, NY"
                />

                <div className="sm:col-span-2">
                  <FormField
                    label="Website"
                    value={
                      newClient.website
                    }
                    onChange={(value) =>
                      setNewClient(
                        (current) => ({
                          ...current,
                          website: value,
                        })
                      )
                    }
                    placeholder="https://company.com"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-white/55">
                    Notes
                  </label>

                  <textarea
                    value={newClient.notes}
                    onChange={(event) =>
                      setNewClient(
                        (current) => ({
                          ...current,
                          notes:
                            event.target
                              .value,
                        })
                      )
                    }
                    rows={4}
                    placeholder="Client notes..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/40"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/[0.06] pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowAddClient(false)
                  }
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/[0.07] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
                >
                  {saving && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Creating..."
                    : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  accent = "default",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}) {
  const accents: Record<
    string,
    string
  > = {
    default:
      "bg-white/[0.05] text-white/60",
    green:
      "bg-green-400/10 text-green-300",
    blue:
      "bg-blue-400/10 text-blue-300",
    purple:
      "bg-purple-400/10 text-purple-200",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/40">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={
            "rounded-xl p-2.5 " +
            (accents[accent] ||
              accents.default)
          }
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ClientMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
      <p className="text-lg font-semibold">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-white/30">
        {label}
      </p>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-white/55">
        {label}
        {required && (
          <span className="ml-1 text-purple-300">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/40"
      />
    </div>
  );
}

function EmptyClients({
  hasSearch,
  onAdd,
}: {
  hasSearch: boolean;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-20 text-center">
      <Building2
        size={34}
        className="mx-auto text-white/15"
      />

      <h2 className="mt-5 text-lg font-semibold">
        {hasSearch
          ? "No clients found"
          : "No clients yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/35">
        {hasSearch
          ? "Try changing your search or status filter."
          : "Create your first client to start managing client jobs and recruiting activity."}
      </p>

      {!hasSearch && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400"
        >
          <Plus size={16} />
          Add Client
        </button>
      )}
    </section>
  );
}