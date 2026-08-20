"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  ShieldCheck,
  UserRound,
  UserX,
  X,
  Loader2,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type UserRole = "owner" | "admin" | "recruiter";

type HireXUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<HireXUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState("");
  const [removingUserId, setRemovingUserId] = useState("");

  const [showAddUser, setShowAddUser] = useState(false);

  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<
    UserRole | ""
  >("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("recruiter");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [createdUserEmail, setCreatedUserEmail] = useState("");
  const [copied, setCopied] = useState(false);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Your session has expired.");
      }

      setCurrentUserId(user.id);

      const {
        data: currentProfile,
        error: currentProfileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (currentProfileError) {
        throw currentProfileError;
      }

      setCurrentUserRole(
        (currentProfile?.role || "") as UserRole | ""
      );

      const {
        data,
        error: usersError,
      } = await supabase
        .from("profiles")
        .select(
          "id,email,full_name,role,status,created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (usersError) {
        throw usersError;
      }

      setUsers((data || []) as HireXUser[]);
    } catch (err) {
      console.error("Load users error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadUsers);
  }, []);

  function resetForm() {
    setFullName("");
    setEmail("");
    setRole("recruiter");
    setMessage("");
    setError("");
    setTemporaryPassword("");
    setCreatedUserEmail("");
    setCopied(false);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowAddUser(false);
    resetForm();
  }

  async function handleAddUser(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");
    setTemporaryPassword("");
    setCreatedUserEmail("");
    setCopied(false);

    if (!fullName.trim()) {
      setError("Please enter the user's full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter the user's email.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "/api/recruiter/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            role,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to create the user."
        );
      }

      setMessage(
        result?.message ||
          "User created successfully."
      );

      setTemporaryPassword(
        result?.temporaryPassword || ""
      );

      setCreatedUserEmail(
        result?.user?.email ||
          email.trim().toLowerCase()
      );

      setFullName("");
      setEmail("");
      setRole("recruiter");

      await loadUsers();
    } catch (err) {
      console.error("Add user error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the user."
      );
    } finally {
      setSaving(false);
    }
  }

  async function copyTemporaryPassword() {
    if (!temporaryPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        temporaryPassword
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError(
        "Unable to copy the password. Please copy it manually."
      );
    }
  }

  async function updateUserStatus(
    user: HireXUser,
    status: "active" | "inactive"
  ) {
    if (
      user.status === status ||
      updatingUserId ||
      removingUserId
    ) {
      return;
    }

    const action =
      status === "active"
        ? "activate"
        : "deactivate";

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${
          user.full_name || user.email
        }?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    setUpdatingUserId(user.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "/api/recruiter/users",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to update the user status."
        );
      }

      setMessage(
        result?.message ||
          "User status updated successfully."
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "Update user status error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the user status."
      );
    } finally {
      setUpdatingUserId("");
    }
  }

  async function removeUser(user: HireXUser) {
    if (
      removingUserId ||
      updatingUserId ||
      user.id === currentUserId
    ) {
      return;
    }

    const name =
      user.full_name || user.email;

    const confirmed = window.confirm(
      `Remove ${name} from HireX?\n\n` +
        "This permanently removes their HireX login and profile. " +
        "They will no longer be able to access the ATS.\n\n" +
        "This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");
    setRemovingUserId(user.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      const response = await fetch(
        "/api/recruiter/users",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to remove the user."
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) =>
            currentUser.id !== user.id
        )
      );

      setMessage(
        result?.message ||
          "User removed successfully."
      );
    } catch (err) {
      console.error(
        "Remove user error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove the user."
      );
    } finally {
      setRemovingUserId("");
    }
  }

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.status === "active"
  ).length;

  const ownerCount = users.filter(
    (user) => user.role === "owner"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const recruiterCount = users.filter(
    (user) => user.role === "recruiter"
  ).length;

  const isOwner =
    currentUserRole === "owner";

  const canCreateUsers =
    isOwner ||
    currentUserRole === "admin";

  return (
    <div className="min-h-screen bg-[#03040a] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-purple-300/60">
              HireX ATS
            </p>

            <h1 className="text-3xl font-semibold tracking-tight">
              Users & Accounts
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-white/40">
              Manage recruiter, admin, and owner
              accounts for your HireX ATS.
            </p>
          </div>

          {canCreateUsers && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddUser(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400"
            >
              <UserPlus size={17} />
              Add User
            </button>
          )}
        </div>

        {error && !showAddUser && (
          <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {message && !showAddUser && (
          <div className="mb-6 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 text-sm text-green-200">
            {message}
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Total Users"
            value={totalUsers}
            icon={<Users size={18} />}
          />

          <StatCard
            label="Active Users"
            value={activeUsers}
            icon={<ShieldCheck size={18} />}
          />

          <StatCard
            label="Recruiters"
            value={recruiterCount}
            icon={<UserRound size={18} />}
          />

          <StatCard
            label="Admins"
            value={adminCount}
            icon={<ShieldCheck size={18} />}
          />

          <StatCard
            label="Owners"
            value={ownerCount}
            icon={<UserX size={18} />}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="text-sm font-semibold">
              HireX Accounts
            </h2>

            <p className="mt-1 text-xs text-white/35">
              Users who have access to the internal
              recruiter workspace.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <Loader2
                size={24}
                className="animate-spin text-purple-300"
              />
            </div>
          ) : users.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                <Users
                  size={22}
                  className="text-white/40"
                />
              </div>

              <h3 className="text-sm font-medium">
                No users found
              </h3>

              <p className="mt-1 max-w-md text-xs text-white/35">
                Add your first recruiter or admin
                account to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-white/35">
                    <th className="px-5 py-4 font-medium">
                      User
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Role
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Created
                    </th>

                    {isOwner && (
                      <th className="px-5 py-4 font-medium">
                        Account Status
                      </th>
                    )}

                    {isOwner && (
                      <th className="px-5 py-4 font-medium">
                        Remove
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {user.full_name ||
                              "Unnamed User"}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {user.email}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge
                          role={user.role}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${
                            user.status ===
                            "active"
                              ? "border-green-400/20 bg-green-400/[0.08] text-green-200"
                              : "border-white/10 bg-white/[0.04] text-white/45"
                          }`}
                        >
                          {user.status ||
                            "pending"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-white/40">
                        {new Date(
                          user.created_at
                        ).toLocaleDateString()}
                      </td>

                      {isOwner && (
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={
                              user.id ===
                                currentUserId ||
                              updatingUserId ===
                                user.id ||
                              removingUserId ===
                                user.id
                            }
                            onClick={() =>
                              updateUserStatus(
                                user,
                                user.status ===
                                  "active"
                                  ? "inactive"
                                  : "active"
                              )
                            }
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {updatingUserId ===
                            user.id
                              ? "Saving..."
                              : user.id ===
                                  currentUserId
                                ? "Your account"
                                : user.status ===
                                    "active"
                                  ? "Deactivate"
                                  : "Activate"}
                          </button>
                        </td>
                      )}

                      {isOwner && (
                        <td className="px-5 py-4">
                          {user.id ===
                          currentUserId ? (
                            <span className="text-xs text-white/25">
                              Your account
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={
                                removingUserId ===
                                  user.id ||
                                updatingUserId ===
                                  user.id
                              }
                              onClick={() =>
                                removeUser(
                                  user
                                )
                              }
                              className="flex items-center gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {removingUserId ===
                              user.id ? (
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2
                                  size={14}
                                />
                              )}

                              {removingUserId ===
                              user.id
                                ? "Removing..."
                                : "Remove"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showAddUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0b12] shadow-2xl">

              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold">
                    Add HireX User
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    Create a new internal ATS account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  <X size={18} />
                </button>
              </div>

              {temporaryPassword ? (
                <div className="space-y-5 p-5">

                  <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.06] p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Check
                        size={18}
                        className="text-green-300"
                      />

                      <p className="text-sm font-semibold text-green-200">
                        User created successfully
                      </p>
                    </div>

                    <p className="text-xs leading-5 text-white/45">
                      Give the temporary password below
                      to the new user. They will use it
                      for their first login and then
                      choose their own password.
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-white/50">
                      Email
                    </p>

                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                      {createdUserEmail}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-white/50">
                      Temporary Password
                    </p>

                    <div className="flex gap-2">
                      <div className="flex-1 rounded-xl border border-purple-400/20 bg-purple-400/[0.06] px-4 py-3 font-mono text-sm tracking-wider text-purple-100">
                        {temporaryPassword}
                      </div>

                      <button
                        type="button"
                        onClick={
                          copyTemporaryPassword
                        }
                        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 text-xs font-medium text-white/70 transition hover:bg-white/[0.09]"
                      >
                        {copied ? (
                          <>
                            <Check size={15} />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy size={15} />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-yellow-400/15 bg-yellow-400/[0.04] px-4 py-3">
                    <p className="text-xs font-medium text-yellow-200/80">
                      Important
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      This is a temporary password.
                      The new user must change it to
                      their own password after their
                      first login.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleAddUser}
                  className="space-y-5 p-5"
                >
                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3 text-sm text-green-200">
                      {message}
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/55">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                      placeholder="John Smith"
                      disabled={saving}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/55">
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      placeholder="john@hirex.com"
                      disabled={saving}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-purple-400/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/55">
                      Role
                    </label>

                    <select
                      value={role}
                      onChange={(event) =>
                        setRole(
                          event.target
                            .value as UserRole
                        )
                      }
                      disabled={saving}
                      className="w-full rounded-xl border border-white/10 bg-[#0d0e16] px-4 py-3 text-sm text-white outline-none focus:border-purple-400/40"
                    >
                      <option value="recruiter">
                        Recruiter
                      </option>

                      <option value="admin">
                        Admin
                      </option>

                      {isOwner && (
                        <option value="owner">
                          Owner
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="rounded-xl border border-purple-400/10 bg-purple-400/[0.04] px-4 py-3">
                    <p className="text-xs font-medium text-purple-200/80">
                      Temporary password
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/35">
                      HireX will generate a temporary
                      password automatically. No
                      invitation email will be sent.
                      The user will change the password
                      after their first login.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      disabled={saving}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.07] disabled:opacity-40"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving && (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      )}

                      {saving
                        ? "Creating User..."
                        : "Create User"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/10 text-purple-200">
        {icon}
      </div>

      <p className="text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/35">
        {label}
      </p>
    </div>
  );
}

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  const styles =
    role === "owner"
      ? "border-purple-400/20 bg-purple-400/[0.08] text-purple-200"
      : role === "admin"
        ? "border-blue-400/20 bg-blue-400/[0.08] text-blue-200"
        : "border-white/10 bg-white/[0.04] text-white/55";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${styles}`}
    >
      {role}
    </span>
  );
}