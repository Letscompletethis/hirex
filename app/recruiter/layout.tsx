"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  FileText,
  CalendarDays,
  CheckCircle2,
  XCircle,
  UserRound,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Building2,
  ShieldCheck,
  Handshake,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { isPrivilegedRole, normalizeRole } from "../../lib/roles";
import ThemeToggle from "../ThemeToggle";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const mainNavigation: NavItem[] = [
  {
    label: "Dashboard",
    href: "/recruiter",
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: "Jobs",
    href: "/recruiter/jobs",
    icon: <BriefcaseBusiness size={18} />,
  },
  {
    label: "Candidates Pool",
    href: "/recruiter/candidates",
    icon: <Users size={18} />,
  },
  {
    label: "Applications",
    href: "/recruiter/applications",
    icon: <FileText size={18} />,
  },
  {
    label: "Submissions",
    href: "/recruiter/submissions",
    icon: <FileText size={18} />,
  },
  {
    label: "Interviews",
    href: "/recruiter/interviews",
    icon: <CalendarDays size={18} />,
  },
  {
    label: "Offers",
    href: "/recruiter/offers",
    icon: <FileText size={18} />,
  },
  {
    label: "Starts",
    href: "/recruiter/starts",
    icon: <CheckCircle2 size={18} />,
  },
  {
    label: "Rejected",
    href: "/recruiter/rejected",
    icon: <XCircle size={18} />,
  },
];

const ownerNavigation: NavItem[] = [
  {
    label: "Business Development",
    href: "/recruiter/business-development",
    icon: <Handshake size={18} />,
  },
  {
    label: "Recruiters",
    href: "/recruiter/recruiters",
    icon: <UserRound size={18} />,
  },
  {
    label: "Clients",
    href: "/recruiter/clients",
    icon: <Building2 size={18} />,
  },
  {
    label: "User Management",
    href: "/recruiter/users",
    icon: <ShieldCheck size={18} />,
  },
];

export default function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("Recruiter");
  const [userRole, setUserRole] = useState("Recruiter");
  const [profileUnavailable, setProfileUnavailable] = useState(false);

  const isPublicAuthPage =
    pathname === "/recruiter/login" ||
    pathname === "/recruiter/reset-password";

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Unable to get current user:", authError);
          return;
        }

        if (!user) {
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Session unavailable");
        const response = await fetch("/api/recruiter/me", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const account = await response.json() as { role?: string; user?: { email?: string; fullName?: string }; error?: string };

        if (cancelled) {
          return;
        }

        const profileRole = normalizeRole(account.role);
        if (!response.ok || !profileRole) {
          console.error("Recruiter profile is unavailable or unauthorized:", account.error);
          setProfileUnavailable(true);
          return;
        }

        const email = account.user?.email || user.email || "";
        const fullName = account.user?.fullName || user.user_metadata?.full_name || user.user_metadata?.name || "";

        const owner = isPrivilegedRole(profileRole);

        setUserEmail(email);

        if (fullName) {
          setUserName(fullName);
        } else if (email) {
          setUserName(email.split("@")[0]);
        }

        setIsOwner(owner);

        if (profileRole === "owner") {
          setUserRole("Owner");
        } else if (
          profileRole === "admin" ||
          profileRole === "super_admin"
        ) {
          setUserRole("Admin");
        } else {
          setUserRole("Recruiter");
        }
      } catch (error) {
        console.error("Load recruiter user error:", error);
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMenuOpen(false);
      setAccountOpen(false);
    });
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();

      setMenuOpen(false);
      setAccountOpen(false);

      router.push("/recruiter/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  function isActive(href: string) {
    if (href === "/recruiter") {
      return pathname === "/recruiter";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  if (isPublicAuthPage) {
    return <>{children}</>;
  }

  if (profileUnavailable) {
    return <main className="flex min-h-screen items-center justify-center bg-[#03040a] px-5 text-center text-white"><div><h1 className="text-xl font-semibold">Profile unavailable</h1><p className="mt-2 text-sm text-white/55">Your HireX profile could not be verified. Please contact an administrator.</p></div></main>;
  }

  return (
    <div className="min-h-screen bg-[#03040a] text-white">

      <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-white/10 bg-[#03040a]">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Menu size={21} />
            </button>

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                <span className="text-xs font-bold text-purple-200">
                  HX
                </span>
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold tracking-tight">
                  HireX
                </p>

                <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-white/30">
                  Recruiter ATS
                </p>
              </div>

            </div>
          </div>

          <div className="relative">

            <div className="absolute right-full top-1/2 mr-2 -translate-y-1/2">
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => setAccountOpen(!accountOpen)}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/[0.05]"
            >

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-400/10 text-sm font-semibold text-purple-200">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="hidden text-left sm:block">
                <p className="max-w-[180px] truncate text-xs font-semibold text-white/85">
                  {userName}
                </p>

                <p className="max-w-[180px] truncate text-[10px] text-white/30">
                  {userRole}
                </p>
              </div>

              <UserCircle
                size={17}
                className="hidden text-white/30 sm:block"
              />

            </button>

            {accountOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close account menu"
                  onClick={() => setAccountOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-white/10 bg-[#080910] p-3 shadow-2xl">

                  <div className="mb-2 border-b border-white/10 px-3 pb-3">

                    <p className="truncate text-sm font-semibold text-white/90">
                      {userName}
                    </p>

                    <p className="mt-1 truncate text-xs text-white/35">
                      {userEmail || "Recruiter account"}
                    </p>

                    <p className="mt-2 text-[10px] uppercase tracking-wider text-purple-300/60">
                      {userRole}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/55 transition hover:bg-red-400/[0.07] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <LogOut size={17} />

                    <span>
                      {loggingOut
                        ? "Signing out..."
                        : "Log out"}
                    </span>

                  </button>

                </div>
              </>
            )}

          </div>

        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50">

          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/55"
          />

          <aside className="relative flex h-full w-[300px] max-w-[88vw] flex-col border-r border-white/10 bg-[#05060d] shadow-2xl">

            <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                  <span className="text-xs font-bold text-purple-200">
                    HX
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    HireX
                  </p>

                  <p className="text-[9px] uppercase tracking-[0.22em] text-white/30">
                    Recruiter ATS
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={19} />
              </button>

            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-5">

              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                Workspace
              </p>

              <div className="space-y-1">

                {mainNavigation.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={closeMenu}
                      className={
                        "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition " +
                        (
                          active
                            ? "border border-purple-400/15 bg-purple-400/10 text-purple-100"
                            : "border border-transparent text-white/45 hover:bg-white/[0.05] hover:text-white"
                        )
                      }
                    >

                      <span
                        className={
                          active
                            ? "text-purple-200"
                            : "text-white/35 group-hover:text-white/70"
                        }
                      >
                        {item.icon}
                      </span>

                      <span className="flex-1">
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="text-purple-200/50"
                        />
                      )}

                    </a>
                  );
                })}

              </div>

              {!isOwner && (
                <div className="mt-7">

                  <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                    My Performance
                  </p>

                  <Link
                    href="/recruiter/recruiters"
                    onClick={closeMenu}
                    className={
                      "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition " +
                      (
                        isActive("/recruiter/recruiters")
                          ? "border border-purple-400/15 bg-purple-400/10 text-purple-100"
                          : "border border-transparent text-white/45 hover:bg-white/[0.05] hover:text-white"
                      )
                    }
                  >

                    <span className="text-white/35 group-hover:text-purple-200">
                      <UserRound size={18} />
                    </span>

                    <span className="flex-1">
                      My Performance
                    </span>

                    {isActive("/recruiter/recruiters") && (
                      <ChevronRight
                        size={15}
                        className="text-purple-200/50"
                      />
                    )}

                  </Link>

                </div>
              )}

              {isOwner && (
                <div className="mt-7">

                  <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-300/50">
                    Management
                  </p>

                  <div className="space-y-1">

                    {ownerNavigation.filter((item) => item.label !== "Business Development" || userRole === "Owner").map((item) => {
                      const active = isActive(item.href);

                      return (
                        <a
                          key={item.label}
                          href={item.href}
                          onClick={closeMenu}
                          className={
                            "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition " +
                            (
                              active
                                ? "border border-purple-400/15 bg-purple-400/10 text-purple-100"
                                : "border border-transparent text-white/45 hover:bg-white/[0.05] hover:text-white"
                            )
                          }
                        >

                          <span
                            className={
                              active
                                ? "text-purple-200"
                                : "text-white/35 group-hover:text-purple-200"
                            }
                          >
                            {item.icon}
                          </span>

                          <span className="flex-1">
                            {item.label}
                          </span>

                          {active && (
                            <ChevronRight
                              size={15}
                              className="text-purple-200/50"
                            />
                          )}

                        </a>
                      );
                    })}

                  </div>

                </div>
              )}

            </nav>

            <div className="shrink-0 border-t border-white/10 p-4">

              <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-400/10 text-sm font-semibold text-purple-200">
                  {userName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">

                  <p className="truncate text-xs font-semibold text-white/80">
                    {userName}
                  </p>

                  <p className="mt-1 truncate text-[10px] text-purple-300/50">
                    {userRole}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/45 transition hover:bg-red-400/[0.06] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <LogOut size={18} />

                <span>
                  {loggingOut
                    ? "Signing out..."
                    : "Log out"}
                </span>

              </button>

            </div>

          </aside>

        </div>
      )}

      <main className="min-h-screen pt-16">
        {children}
      </main>

    </div>
  );
}
