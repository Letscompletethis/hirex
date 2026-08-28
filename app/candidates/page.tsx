"use client";

/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import AnimatedBackground from "../AnimatedBackground";
import ThemeToggle from "../ThemeToggle";
import { TalkToHirexModal } from "../components/TalkToHirexModal";

export default function CandidatesPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#03040a] text-white">
      {/* ANIMATED BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <AnimatedBackground />
      </div>

      {/* READABILITY OVERLAY */}
      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[1]
          bg-[radial-gradient(circle_at_center,transparent_8%,rgba(0,0,0,0.08)_55%,rgba(0,0,0,0.42)_100%)]
        "
      />

      <div className="relative z-10">
        <TalkToHirexModal open={contactOpen} onClose={() => setContactOpen(false)} />
        {/* NAVIGATION */}
        <header className="fixed left-0 right-0 top-0 z-50 pointer-events-none px-4 pt-4 sm:px-6">
          <div
            className="
              pointer-events-auto
              mx-auto
              flex
              max-w-7xl
              items-center
              justify-between
              rounded-2xl
              border
              border-white/10
              bg-[#05060b]/75
              px-4
              py-3
              shadow-2xl
              backdrop-blur-2xl
              sm:px-6
            "
          >
            <Link
              href="/"
              className="text-xl font-semibold tracking-[-0.04em] text-white"
            >
              Hire<span className="text-white/75">X</span>
            </Link>

            <nav className="hidden items-center gap-7 text-sm text-white/65 lg:flex">
              <Link
                href="/employers"
                className="transition hover:text-white"
              >
                Employers
              </Link>

              <Link
                href="/candidates"
                className="text-white"
              >
                Candidates
              </Link>

              <Link
                href="/partners"
                className="transition hover:text-white"
              >
                Partners
              </Link>

              <Link
                href="/#why-hirex"
                className="transition hover:text-white"
              >
                Why HireX
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="
                rounded-xl
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-black
                transition
                hover:bg-white/90
              "
              >
                Talk to HireX
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section
          id="top"
          className="
            flex
            min-h-screen
            items-center
            justify-center
            px-5
            pb-20
            pt-32
            sm:px-6
          "
        >
          <div className="mx-auto w-full max-w-5xl text-center">
            <div
              className="
                mx-auto
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/10
                bg-black/65
                px-4
                py-2
                text-xs
                font-medium
                tracking-wide
                text-white/75
                shadow-xl
                backdrop-blur-xl
                sm:text-sm
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-purple-300
                  shadow-[0_0_14px_rgba(216,180,254,0.9)]
                "
              />

              Your Next Opportunity Starts Here
            </div>

            <h1
              className="
                mx-auto
                mt-8
                max-w-4xl
                text-5xl
                font-semibold
                leading-[0.95]
                tracking-[-0.055em]
                text-white
                drop-shadow-[0_4px_30px_rgba(0,0,0,0.75)]
                sm:text-7xl
                lg:text-8xl
              "
            >
              Find Work That
              <span
                className="
                  block
                  bg-gradient-to-r
                  from-white
                  via-white
                  to-white/50
                  bg-clip-text
                  text-transparent
                "
              >
                Moves You Forward.
              </span>
            </h1>

            <p
              className="
                mx-auto
                mt-8
                max-w-2xl
                text-base
                leading-7
                text-white/80
                drop-shadow-[0_2px_15px_rgba(0,0,0,0.9)]
                sm:text-lg
                sm:leading-8
              "
            >
              Connect with employers looking for talented people
              and discover opportunities that match your skills,
              experience and career goals.
            </p>

            <div className="relative z-20 mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className="
                  group
                  relative
                  z-20
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-6
                  py-3.5
                  font-semibold
                  text-black
                  shadow-2xl
                  transition
                  hover:-translate-y-0.5
                  hover:bg-white/90
                "
              >
                Search Opportunities

                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <a
                href="#talent-network"
                className="
                  relative
                  z-20
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-black/65
                  px-6
                  py-3.5
                  font-semibold
                  text-white
                  shadow-xl
                  backdrop-blur-xl
                  transition
                  hover:-translate-y-0.5
                  hover:bg-black/75
                "
              >
                Join the Talent Network
              </a>
            </div>

            <p className="mt-7 text-xs text-white/45">
              Jobs · Talent Network · Career Opportunities
            </p>
          </div>
        </section>

        {/* SEARCH */}
        <section id="jobs" className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90">
                Find Your Next Role
              </p>

              <h2
                className="
                  mt-4
                  text-4xl
                  font-semibold
                  tracking-[-0.04em]
                  text-white
                  sm:text-5xl
                "
              >
                Search opportunities.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-white/65">
                Explore positions and connect with opportunities
                through the HireX talent network.
              </p>
            </div>

            <div
              className="
                mx-auto
                mt-12
                max-w-5xl
                rounded-3xl
                border
                border-white/10
                bg-[#05060b]/80
                p-5
                shadow-2xl
                backdrop-blur-2xl
                sm:p-7
              "
            >
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.035]
                    px-4
                    py-3.5
                  "
                >
                  <Search size={19} className="text-white/45" />

                  <input
                    type="text"
                    placeholder="Job title or keyword"
                    className="
                      w-full
                      bg-transparent
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/35
                    "
                  />
                </div>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-white/10
                    bg-white/[0.035]
                    px-4
                    py-3.5
                  "
                >
                  <Globe2 size={19} className="text-white/45" />

                  <input
                    type="text"
                    placeholder="Location"
                    className="
                      w-full
                      bg-transparent
                      text-sm
                      text-white
                      outline-none
                      placeholder:text-white/35
                    "
                  />
                </div>

                <Link
                  href="/jobs"
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-white
                    px-6
                    py-3.5
                    text-sm
                    font-semibold
                    text-black
                    transition
                    hover:bg-white/90
                  "
                >
                  Search
                  <ArrowRight size={17} />
                </Link>
              </div>

              <p className="mt-4 text-center text-xs text-white/40">
                Browse available HireX opportunities and discover
                roles that match your experience.
              </p>
            </div>
          </div>
        </section>

        {/* WHY HIREX */}
        <section className="px-5 py-28 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                  Why HireX
                </p>

                <h2
                  className="
                    mt-5
                    text-4xl
                    font-semibold
                    leading-tight
                    tracking-[-0.04em]
                    sm:text-6xl
                  "
                >
                  Your career is more than
                  <span className="block text-white/50">
                    another application.
                  </span>
                </h2>

                <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">
                  We want to connect people with opportunities
                  where their experience and goals can create
                  meaningful value for both the candidate and
                  the employer.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: Search,
                    title: "Relevant Opportunities",
                    text: "Discover roles based on your skills, experience and career direction.",
                  },
                  {
                    icon: Users,
                    title: "Human Connection",
                    text: "Recruitment is about people. Our team helps connect candidates and employers.",
                  },
                  {
                    icon: BriefcaseBusiness,
                    title: "Multiple Markets",
                    text: "Explore opportunities across the markets HireX serves.",
                  },
                  {
                    icon: Sparkles,
                    title: "Future Opportunities",
                    text: "Join our network even when the perfect role isn't available today.",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-[#05060b]/78
                        p-6
                        shadow-xl
                        backdrop-blur-xl
                      "
                    >
                      <Icon
                        size={24}
                        className="text-purple-200"
                      />

                      <h3 className="mt-5 font-semibold text-white">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-white/60">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-200/90">
                The Process
              </p>

              <h2
                className="
                  mt-4
                  text-4xl
                  font-semibold
                  tracking-[-0.04em]
                  sm:text-5xl
                "
              >
                Simple from start to finish.
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-white/65">
                Getting connected with an opportunity shouldn't
                feel complicated.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Create Your Profile",
                  text: "Share your experience, skills and the type of opportunity you're looking for.",
                },
                {
                  number: "02",
                  title: "Explore Opportunities",
                  text: "Our team can match your background with roles that align with your experience.",
                },
                {
                  number: "03",
                  title: "Connect & Interview",
                  text: "If there's a fit, you'll connect with the employer and move through their hiring process.",
                },
              ].map((step) => (
                <div
                  key={step.number}
                  className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-[#05060b]/78
                    p-7
                    shadow-2xl
                    backdrop-blur-2xl
                  "
                >
                  <div className="text-sm font-semibold text-purple-200">
                    {step.number}
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-white/60">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT CANDIDATES CAN EXPECT */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-[#05060b]/75
                p-8
                shadow-2xl
                backdrop-blur-2xl
                sm:p-12
              "
            >
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
                    What You Can Expect
                  </p>

                  <h2
                    className="
                      mt-5
                      text-4xl
                      font-semibold
                      tracking-[-0.04em]
                      sm:text-5xl
                    "
                  >
                    A better candidate
                    <span className="block text-white/50">
                      experience.
                    </span>
                  </h2>

                  <p className="mt-6 max-w-xl leading-7 text-white/65">
                    We believe candidates should understand where
                    they stand and what comes next.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    "Clear communication throughout the process",
                    "Opportunities aligned with your experience",
                    "Professional representation to employers",
                    "Access to future opportunities through our network",
                    "A straightforward recruitment experience",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0 text-cyan-200"
                      />

                      <span className="text-sm leading-6 text-white/70">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TALENT NETWORK */}
        <section
          id="talent-network"
          className="px-5 py-28 sm:px-6"
        >
          <div className="mx-auto max-w-5xl">
            <div
              className="
                rounded-[2rem]
                border
                border-white/10
                bg-[#05060b]/82
                p-8
                text-center
                shadow-2xl
                backdrop-blur-2xl
                sm:p-14
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-2xl
                  bg-purple-300/10
                  text-purple-200
                "
              >
                <Users size={29} />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90">
                Talent Network
              </p>

              <h2
                className="
                  mt-4
                  text-4xl
                  font-semibold
                  tracking-[-0.04em]
                  sm:text-5xl
                "
              >
                The right role may not be
                <span className="block text-white/50">
                  open today.
                </span>
              </h2>

              <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/65">
                Join the HireX talent network so your profile can
                be considered for future opportunities that match
                your background.
              </p>

              <a
                href="mailto:careers@hirex.com?subject=Join%20HireX%20Talent%20Network"
                className="
                  mt-8
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-7
                  py-3.5
                  font-semibold
                  text-black
                  transition
                  hover:-translate-y-0.5
                "
              >
                Join the Talent Network
                <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* GLOBAL OPPORTUNITIES */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div
              className="
                rounded-3xl
                border
                border-white/10
                bg-[#05060b]/72
                p-8
                shadow-2xl
                backdrop-blur-2xl
                sm:p-12
              "
            >
              <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/90">
                    Global Reach
                  </p>

                  <h2
                    className="
                      mt-5
                      text-4xl
                      font-semibold
                      tracking-[-0.04em]
                      sm:text-5xl
                    "
                  >
                    Opportunities can cross
                    <span className="block text-white/50">
                      borders.
                    </span>
                  </h2>

                  <p className="mt-6 max-w-xl leading-7 text-white/65">
                    HireX supports employers across multiple
                    markets, giving candidates the opportunity to
                    explore roles beyond their immediate location
                    when the position allows.
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
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white/[0.035]
                        px-4
                        py-5
                        text-center
                        text-sm
                        font-medium
                        text-white/75
                      "
                    >
                      {market}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-5 pb-28 pt-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/90">
              Your Next Move
            </p>

            <h2
              className="
                mt-5
                text-5xl
                font-semibold
                tracking-[-0.05em]
                sm:text-7xl
              "
            >
              Ready for what's next?
              <span className="block text-white/50">
                Let's find it.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-xl leading-7 text-white/65">
              Explore opportunities or join the HireX talent
              network and take the next step in your career.
            </p>

            <div className="relative z-20 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/jobs"
                className="
                  relative
                  z-20
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-7
                  py-4
                  font-semibold
                  text-black
                  transition
                  hover:-translate-y-0.5
                "
              >
                Search Opportunities
                <ArrowRight size={18} />
              </Link>

              <a
                href="mailto:careers@hirex.com"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-black/60
                  px-7
                  py-4
                  font-semibold
                  text-white
                  transition
                  hover:bg-black/75
                "
              >
                Contact HireX
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/10 px-5 py-10 sm:px-6">
          <div
            className="
              mx-auto
              flex
              max-w-7xl
              flex-col
              gap-6
              text-sm
              text-white/45
              md:flex-row
              md:items-end
              md:justify-between
            "
          >
            <div>
              <Link
                href="/"
                className="text-lg font-semibold text-white/80"
              >
                HireX
              </Link>

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