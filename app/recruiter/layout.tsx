"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  Users,
  UserRound,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

const navigation: NavItem[] = [
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
    label: "Applications",
    href: "/recruiter/applications",
    icon: <Users size={18} />,
  },
  {
    label: "Candidates",
    href: "/recruiter/candidates",
    icon: <UserRound size={18} />,
  },
];

export default function RecruiterLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isLoginPage = pathname === "/recruiter/login";

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
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

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#03040a] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#05060d] lg:flex lg:flex-col">
          <SidebarContent
            pathname={pathname}
            isActive={isActive}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={closeMobileMenu}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            <aside className="relative flex h-full w-[280px] flex-col border-r border-white/10 bg-[#05060d] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
                    <span className="text-sm font-bold text-purple-200">
                      HX
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-semibold">HireX</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                      ATS
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={19} />
                </button>
              </div>

              <SidebarNavigation
                pathname={pathname}
                isActive={isActive}
                onNavigate={closeMobileMenu}
              />

              <SidebarFooter
                onLogout={handleLogout}
                loggingOut={loggingOut}
              />
            </aside>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[#03040a]/90 backdrop-blur-xl lg:hidden">
            <div className="flex h-16 items-center justify-between px-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-white/60 hover:bg-white/[0.08] hover:text-white"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-purple-400/20 bg-purple-400/10">
                  <span className="text-xs font-bold text-purple-200">
                    HX
                  </span>
                </div>

                <span className="text-sm font-semibold">
                  HireX ATS
                </span>
              </div>

              <div className="w-10" />
            </div>
          </header>

          <main className="min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  isActive,
  onLogout,
  loggingOut,
}: {
  pathname: string;
  isActive: (href: string) => boolean;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/10">
          <span className="text-sm font-bold text-purple-200">
            HX
          </span>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-tight">
            HireX
          </p>

          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
            Recruiter ATS
          </p>
        </div>
      </div>

      <SidebarNavigation
        pathname={pathname}
        isActive={isActive}
      />

      <SidebarFooter
        onLogout={onLogout}
        loggingOut={loggingOut}
      />
    </>
  );
}

function SidebarNavigation({
  isActive,
  onNavigate,
}: {
  pathname: string;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-5">
      <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
        Workspace
      </p>

      <div className="space-y-1">
        {navigation.map((item) => {
          const active = isActive(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition " +
                (active
                  ? "border border-purple-400/15 bg-purple-400/10 text-purple-100"
                  : "border border-transparent text-white/45 hover:bg-white/[0.05] hover:text-white")
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

              <span className="flex-1">{item.label}</span>

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
    </nav>
  );
}

function SidebarFooter({
  onLogout,
  loggingOut,
}: {
  onLogout: () => void;
  loggingOut: boolean;
}) {
  return (
    <div className="border-t border-white/10 p-4">
      <div className="mb-3 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3">
        <p className="text-xs font-medium text-white/60">
          Recruiter
        </p>

        <p className="mt-1 text-[10px] text-white/25">
          HireX recruiting workspace
        </p>
      </div>

      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/40 transition hover:bg-red-400/[0.06] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut size={18} />

        <span>
          {loggingOut ? "Signing out..." : "Logout"}
        </span>
      </button>
    </div>
  );
}