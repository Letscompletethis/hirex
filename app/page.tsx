"use client";

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Globe2,
  Handshake,
  Users,
} from "lucide-react";

import AnimatedBackground from "./AnimatedBackground";

export default function Home() {
  return (
    <main
      id="top"
      className="relative min-h-screen overflow-x-hidden bg-[#03040a] text-white"
    >
      <AnimatedBackground />

      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(circle_at_center,transparent_10%,rgba(0,0,0,0.08)_55%,rgba(0,0,0,0.38)_100%)]" />

      <div className="relative z-10">
        {/* NAVIGATION */}
        <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-[#05060b]/75 px-4 py-3 shadow-2xl backdrop-blur-2xl sm:px-6">
            <a
              href="/"
              className="text-xl font-semibold tracking-[-0.04em] text-white"
            >
              Hire<span className="text-white/75">X</span>
            </a>

            <nav className="hidden items-center gap-7 text-sm text-white/65 lg:flex">
              <a
                href="/employers"
                className="transition hover:text-white"
              >
                Employers
              </a>

              <a
                href="/candidates"
                className="transition hover:text-white"
              >
                Candidates
              </a>

              <a
                href="/#partners"
                className="transition hover:text-white"
              >
                Partners
              </a>

              <a
                href="/#why-hirex"
                className="transition hover:text-white"
              >
                Why HireX
              </a>
            </nav>

            {/* RECRUITER LOGIN */}
            <a
              href="/recruiter/login"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-medium text-white/75 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              Recruiter Login
            </a>
          </div>
        </header>

        {/* HERO */}
        <section className="flex min-h-screen items-center justify-center px-5 pb-20 pt-32 sm:px-6">
          <div className="mx-auto w-full max-w-5xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/65 px-4 py-2 text-xs font-medium tracking-wide text-white/75 shadow-xl backdrop-blur-xl sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />
              Global Talent & Workforce Solutions
            </div>

            <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.75)] sm:text-7xl lg:text-8xl">
              Scale Smarter.
              <span className="block bg-gradient-to-r from-white via-white to-white/55 bg-clip-text text-transparent">
                Spend Less.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-white/80 drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)] sm:text-lg sm:leading-8">
              Build high-performing teams, recruit exceptional talent and
              scale your workforce without compromising quality.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/employers"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-black shadow-2xl transition hover:-translate-y-0.5 hover:bg-white/90"
              >
                I'm Hiring

                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </a>

              <a
                href="/candidates"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/65 px-6 py-3.5 font-semibold text-white shadow-xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-black/75"
              >
                Find a Job

                <ArrowRight size={18} />
              </a>
            </div>

            <p className="mt-7 text-xs text-white/45">
              Direct Staffing · RPO · Recruiting Partnerships
            </p>
          </div>
        </section>

        {/* CHOOSE YOUR PATH */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/90">
                Choose your path
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                What brings you to HireX?
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-white/65">
                Whether you're hiring, looking for your next opportunity, or
                building a recruiting business, start here.
              </p>
            </div>

            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {/* EMPLOYER CARD */}
              <div className="group rounded-3xl border border-white/10 bg-[#05060b]/78 p-7 shadow-2xl backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/25">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                    <Building2 size={27} />
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-white/45">
                    Employer
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  I'm Hiring
                </h3>

                <p className="mt-4 leading-7 text-white/70">
                  Need one great hire or an entire recruiting operation?
                  HireX can help you recruit and scale.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Direct Staffing",
                    "RPO Services",
                    "Recruiters & Sourcers",
                    "Recruitment Coordination",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/70"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-cyan-300"
                      />
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="/employers"
                  className="mt-8 flex items-center gap-2 font-semibold text-white transition group-hover:text-cyan-200"
                >
                  Explore Employer Solutions
                  <ArrowRight size={18} />
                </a>
              </div>

              {/* CANDIDATE CARD */}
              <div className="group rounded-3xl border border-white/10 bg-[#05060b]/78 p-7 shadow-2xl backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:border-purple-300/25">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-300/10 text-purple-200">
                    <BriefcaseBusiness size={27} />
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-white/45">
                    Candidate
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  I'm Looking for a Job
                </h3>

                <p className="mt-4 leading-7 text-white/70">
                  Discover opportunities with employers across the markets
                  HireX serves.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Search Open Positions",
                    "Apply to Jobs",
                    "Join the Talent Network",
                    "Get Considered for Future Roles",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/70"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-purple-300"
                      />
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="/candidates"
                  className="mt-8 flex items-center gap-2 font-semibold text-white transition group-hover:text-purple-200"
                >
                  Find Opportunities
                  <ArrowRight size={18} />
                </a>
              </div>

              {/* PARTNER CARD */}
              <div
                id="partners"
                className="group rounded-3xl border border-white/10 bg-[#05060b]/78 p-7 shadow-2xl backdrop-blur-2xl transition duration-500 hover:-translate-y-1 hover:border-pink-300/25"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-300/10 text-pink-200">
                    <Handshake size={27} />
                  </div>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-white/45">
                    Partner
                  </span>
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  I'm a Recruiting Partner
                </h3>

                <p className="mt-4 leading-7 text-white/70">
                  Have clients but need more recruiting capacity? HireX can
                  become the delivery support behind your business.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Solo Recruiters",
                    "Independent Recruiters",
                    "1–10 Person Recruiting Firms",
                    "Boutique Staffing Companies",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/70"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-pink-300"
                      />
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="#contact"
                  className="mt-8 flex items-center gap-2 font-semibold text-white transition group-hover:text-pink-200"
                >
                  Explore Partner Program
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* WHY HIREX */}
        <section id="why-hirex" className="px-5 py-28 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90">
                Why HireX
              </p>

              <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
                Quality stays high.
                <span className="block text-white/55">
                  Your cost doesn't have to.
                </span>
              </h2>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">
                HireX combines experienced recruitment professionals, global
                talent and managed delivery to help businesses build capable
                teams with a smarter cost structure.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Users,
                  title: "Experienced Recruiters",
                  text: "Recruitment professionals with experience across roles, industries and markets.",
                },
                {
                  icon: Globe2,
                  title: "Global Delivery",
                  text: "Support for organizations across the US, Canada, Europe, Middle East and India.",
                },
                {
                  icon: BarChart3,
                  title: "Constant Analysis",
                  text: "Recruitment activity, pipeline and performance are continuously monitored.",
                },
                {
                  icon: BriefcaseBusiness,
                  title: "Flexible Capacity",
                  text: "Add recruiting capability when your business needs it without building everything internally.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-[#05060b]/78 p-6 shadow-xl backdrop-blur-xl"
                  >
                    <Icon size={24} className="text-cyan-200" />

                    <h3 className="mt-5 font-semibold text-white">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-white/65">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* RPO TEASER */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-white/10 bg-[#05060b]/82 p-8 text-center shadow-2xl backdrop-blur-2xl sm:p-14">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
                <BarChart3 size={29} />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                RPO Trial
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Don't just take our word for it.
                <span className="block text-white/55">Test HireX.</span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/65">
                Start with a two-week RPO trial and experience our recruitment
                team, communication, reporting and delivery before committing
                long term.
              </p>

              <a
                href="/employers#rpo"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-black transition hover:-translate-y-0.5"
              >
                Explore RPO
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* GLOBAL REACH */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-3xl border border-white/10 bg-[#05060b]/72 p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90">
                    Global Reach
                  </p>

                  <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                    Local hiring.
                    <span className="block text-white/55">
                      Global capability.
                    </span>
                  </h2>

                  <p className="mt-6 max-w-xl leading-7 text-white/65">
                    HireX works across the United States, Canada, Europe, the
                    Middle East and India.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    "United States",
                    "Canada",
                    "Europe",
                    "Middle East",
                    "India",
                  ].map((market) => (
                    <div
                      key={market}
                      className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-5 text-center text-sm font-medium text-white/75"
                    >
                      {market}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BIGGER VISION */}
        <section className="px-5 py-28 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-200/90">
              The Bigger Vision
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Start with recruitment.
              <span className="block text-white/50">
                Build the workforce of tomorrow.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-2xl leading-8 text-white/65">
              Our long-term vision is to help businesses combine their
              in-house teams with specialized HireX teams across functions.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {[
                "Recruitment",
                "Accounting",
                "Payroll",
                "IT Administration",
                "Operations",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/10 bg-black/60 px-5 py-2.5 text-sm text-white/65 backdrop-blur-xl"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="px-5 pb-28 pt-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
              Let's Talk
            </p>

            <h2 className="mt-5 text-5xl font-semibold tracking-[-0.05em] sm:text-7xl">
              Scale smarter.
              <span className="block text-white/50">
                Start with HireX.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-xl leading-7 text-white/65">
              Whether you need one great hire, a complete recruiting team or
              additional delivery capacity, let's talk.
            </p>

            <a
              href="mailto:info@hirex.com"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-black transition hover:-translate-y-0.5"
            >
              Talk to HireX
              <ArrowRight size={18} />
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 px-5 py-10 sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-white/45 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-lg font-semibold text-white/80">
                HireX
              </div>

              <p className="mt-2">
                Scale Smarter. Spend Less.
              </p>

              <p className="mt-4">
                © {new Date().getFullYear()} HireX. All rights reserved.
              </p>
            </div>

            <div className="md:text-right">
              <p>8318 Trophy Place Dr</p>
              <p>Humble, TX 77346</p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}