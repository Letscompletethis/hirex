"use client";

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Globe2,
  Handshake,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

import AnimatedBackground from "../AnimatedBackground";
import ThemeToggle from "../ThemeToggle";

export default function EmployersPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#03040a] text-white">
      {/* =====================================================
          ANIMATED BACKGROUND
      ===================================================== */}

      <AnimatedBackground />

      {/* =====================================================
          READABILITY OVERLAY
      ===================================================== */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[1]
          bg-[radial-gradient(circle_at_center,transparent_8%,rgba(0,0,0,0.10)_50%,rgba(0,0,0,0.48)_100%)]
        "
      />

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="relative z-10">

        {/* ===================================================
            NAVIGATION
        =================================================== */}

        <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6">
          <div
            className="
              mx-auto
              flex
              max-w-7xl
              items-center
              justify-between
              rounded-2xl
              border
              border-white/10
              bg-[#05060b]/80
              px-4
              py-3
              shadow-2xl
              backdrop-blur-2xl
              sm:px-6
            "
          >
            <a
              href="/"
              className="text-xl font-semibold tracking-[-0.04em] text-white"
            >
              Hire<span className="text-white/70">X</span>
            </a>

            <nav className="hidden items-center gap-7 text-sm text-white/60 lg:flex">
              <a
                href="/"
                className="transition hover:text-white"
              >
                Home
              </a>

              <a
                href="/employers"
                className="text-white"
              >
                Employers
              </a>

              <a
                href="/#candidates"
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

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <a
                href="#contact"
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
              </a>
            </div>
          </div>
        </header>


        {/* ===================================================
            HERO
        =================================================== */}

        <section
          className="
            flex
            min-h-[92vh]
            items-center
            px-5
            pb-20
            pt-32
            sm:px-6
          "
        >
          <div className="mx-auto w-full max-w-7xl">

            <a
              href="/"
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-white/10
                bg-black/55
                px-4
                py-2
                text-xs
                text-white/60
                backdrop-blur-xl
                transition
                hover:text-white
              "
            >
              <ArrowLeft size={14} />
              Back to HireX
            </a>


            <div className="mt-12 max-w-5xl">

              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-cyan-300/15
                  bg-cyan-300/[0.05]
                  px-4
                  py-2
                  text-xs
                  font-medium
                  uppercase
                  tracking-[0.18em]
                  text-cyan-200/80
                "
              >
                <Building2Icon />
                Employer Solutions
              </div>


              <h1
                className="
                  mt-7
                  text-5xl
                  font-semibold
                  leading-[0.95]
                  tracking-[-0.055em]
                  text-white
                  drop-shadow-[0_5px_35px_rgba(0,0,0,0.8)]
                  sm:text-7xl
                  lg:text-8xl
                "
              >
                Build your team.
                <span
                  className="
                    block
                    bg-gradient-to-r
                    from-white
                    via-white
                    to-white/45
                    bg-clip-text
                    text-transparent
                  "
                >
                  Without building everything yourself.
                </span>
              </h1>


              <p
                className="
                  mt-8
                  max-w-3xl
                  text-lg
                  leading-8
                  text-white/70
                  sm:text-xl
                "
              >
                HireX gives employers flexible recruiting capacity,
                experienced recruiters and managed delivery without
                forcing you to build a large internal recruiting
                operation before you need one.
              </p>


              <div className="mt-10 flex flex-col gap-3 sm:flex-row">

                <a
                  href="#solutions"
                  className="
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
                    shadow-2xl
                    transition
                    hover:-translate-y-0.5
                    hover:bg-white/90
                  "
                >
                  Explore Solutions
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#contact"
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
                    backdrop-blur-xl
                    transition
                    hover:-translate-y-0.5
                    hover:bg-black/75
                  "
                >
                  Talk to HireX
                </a>

              </div>

            </div>


            {/* =================================================
                HERO STATS
            ================================================= */}

            <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {[
                {
                  icon: Users,
                  title: "Recruiting Capacity",
                  text: "Add experienced recruiting support when demand increases.",
                },
                {
                  icon: Clock3,
                  title: "Flexible Delivery",
                  text: "Scale support around your hiring volume instead of fixed overhead.",
                },
                {
                  icon: Globe2,
                  title: "Global Capability",
                  text: "Access recruiting talent across multiple markets.",
                },
                {
                  icon: BarChart3,
                  title: "Measured Delivery",
                  text: "Track activity, pipeline and recruiting performance.",
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
                      bg-[#05060b]/70
                      p-5
                      backdrop-blur-xl
                    "
                  >
                    <Icon
                      size={22}
                      className="text-cyan-200"
                    />

                    <h3 className="mt-4 font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-white/50">
                      {item.text}
                    </p>
                  </div>
                );
              })}

            </div>

          </div>
        </section>


        {/* ===================================================
            THE PROBLEM
        =================================================== */}

        <section className="px-5 py-24 sm:px-6">

          <div className="mx-auto max-w-7xl">

            <div className="max-w-3xl">

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
                The Hiring Challenge
              </p>

              <h2
                className="
                  mt-5
                  text-4xl
                  font-semibold
                  tracking-[-0.04em]
                  sm:text-6xl
                "
              >
                Hiring demand doesn't stay constant.
              </h2>

              <p className="mt-6 text-lg leading-8 text-white/60">
                Some companies need one recruiter. Others suddenly
                need five, ten or more people working on a hiring
                surge. Building permanent infrastructure for every
                hiring cycle can create unnecessary cost and
                complexity.
              </p>

            </div>


            <div className="mt-14 grid gap-5 md:grid-cols-3">

              {[
                {
                  icon: Target,
                  title: "Too many open roles",
                  text: "Your internal team may not have enough capacity to source, screen and coordinate every position.",
                },
                {
                  icon: Zap,
                  title: "Hiring spikes",
                  text: "Growth, expansion or new projects can create recruiting demand faster than your team can scale.",
                },
                {
                  icon: Layers3,
                  title: "Operational overload",
                  text: "Recruiters can spend too much time managing workflow instead of focusing on candidates and hiring managers.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="
                      rounded-3xl
                      border
                      border-white/10
                      bg-[#05060b]/75
                      p-7
                      shadow-xl
                      backdrop-blur-xl
                    "
                  >
                    <div
                      className="
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-xl
                        bg-white/[0.05]
                        text-purple-200
                      "
                    >
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-6 text-xl font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 leading-7 text-white/55">
                      {item.text}
                    </p>
                  </div>
                );
              })}

            </div>

          </div>

        </section>


        {/* ===================================================
            SOLUTIONS
        =================================================== */}

        <section
          id="solutions"
          className="px-5 py-28 sm:px-6"
        >

          <div className="mx-auto max-w-7xl">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Solutions
              </p>

              <h2
                className="
                  mt-5
                  text-4xl
                  font-semibold
                  tracking-[-0.04em]
                  sm:text-6xl
                "
              >
                Choose the level of support you need.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/55">
                Start with targeted recruiting help or build a
                broader managed recruiting operation around your
                business.
              </p>

            </div>


            <div className="mt-14 grid gap-5 lg:grid-cols-3">


              {/* DIRECT STAFFING */}

              <div
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

                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-cyan-300/10
                    text-cyan-200
                  "
                >
                  <BriefcaseBusiness size={27} />
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  Direct Staffing
                </h3>

                <p className="mt-4 leading-7 text-white/60">
                  Need help filling specific positions? HireX can
                  support individual searches and targeted hiring
                  requirements.
                </p>

                <div className="mt-7 space-y-3">

                  {[
                    "Candidate sourcing",
                    "Resume screening",
                    "Candidate qualification",
                    "Interview coordination",
                    "Hiring support",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/65"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-cyan-300"
                      />
                      {item}
                    </div>
                  ))}

                </div>

              </div>


              {/* RPO */}

              <div
                className="
                  rounded-3xl
                  border
                  border-cyan-300/20
                  bg-cyan-300/[0.035]
                  p-7
                  shadow-2xl
                  backdrop-blur-2xl
                "
              >

                <div className="flex items-start justify-between">

                  <div
                    className="
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-purple-300/10
                      text-purple-200
                    "
                  >
                    <Users size={27} />
                  </div>

                  <span
                    className="
                      rounded-full
                      border
                      border-purple-300/15
                      bg-purple-300/[0.06]
                      px-3
                      py-1
                      text-[10px]
                      font-semibold
                      uppercase
                      tracking-wider
                      text-purple-200/80
                    "
                  >
                    Popular
                  </span>

                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  RPO
                </h3>

                <p className="mt-4 leading-7 text-white/60">
                  Extend your recruiting organization with a
                  dedicated HireX team working alongside your
                  internal operation.
                </p>

                <div className="mt-7 space-y-3">

                  {[
                    "Dedicated recruiters",
                    "Recruiting coordination",
                    "Pipeline management",
                    "Reporting and visibility",
                    "Scalable recruiting capacity",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/65"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-purple-300"
                      />
                      {item}
                    </div>
                  ))}

                </div>

              </div>


              {/* RECRUITING TEAM */}

              <div
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

                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-pink-300/10
                    text-pink-200
                  "
                >
                  <Handshake size={27} />
                </div>

                <h3 className="mt-7 text-2xl font-semibold">
                  Recruiting Capacity
                </h3>

                <p className="mt-4 leading-7 text-white/60">
                  Add recruiting professionals to your existing
                  operation when your hiring volume requires
                  additional capacity.
                </p>

                <div className="mt-7 space-y-3">

                  {[
                    "Flexible team capacity",
                    "Recruiter and sourcer support",
                    "Multiple requisition support",
                    "Process coordination",
                    "Scale up or down as needed",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-white/65"
                    >
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-pink-300"
                      />
                      {item}
                    </div>
                  ))}

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            HOW IT WORKS
        =================================================== */}

        <section className="px-5 py-24 sm:px-6">

          <div className="mx-auto max-w-7xl">

            <div className="grid gap-14 lg:grid-cols-2 lg:items-center">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
                  How It Works
                </p>

                <h2
                  className="
                    mt-5
                    text-4xl
                    font-semibold
                    tracking-[-0.04em]
                    sm:text-6xl
                  "
                >
                  Simple on your side.
                  <span className="block text-white/45">
                    Structured behind the scenes.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl leading-8 text-white/60">
                  We begin by understanding your roles, workflow,
                  hiring goals and existing process. Then we build
                  the recruiting support around what your team
                  actually needs.
                </p>

              </div>


              <div className="space-y-4">

                {[
                  {
                    number: "01",
                    title: "Understand",
                    text: "We learn your roles, hiring goals, process and expectations.",
                  },
                  {
                    number: "02",
                    title: "Build",
                    text: "We establish the recruiting workflow and assign the appropriate capacity.",
                  },
                  {
                    number: "03",
                    title: "Recruit",
                    text: "Our team sources, screens and advances qualified candidates.",
                  },
                  {
                    number: "04",
                    title: "Measure",
                    text: "Activity and pipeline performance are monitored so you can see what is happening.",
                  },
                ].map((item) => (
                  <div
                    key={item.number}
                    className="
                      flex
                      gap-5
                      rounded-2xl
                      border
                      border-white/10
                      bg-[#05060b]/70
                      p-5
                      backdrop-blur-xl
                    "
                  >

                    <div
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        text-xs
                        font-semibold
                        text-cyan-200
                      "
                    >
                      {item.number}
                    </div>

                    <div>

                      <h3 className="font-semibold">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-white/50">
                        {item.text}
                      </p>

                    </div>

                  </div>
                ))}

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            WHY HIREX FOR EMPLOYERS
        =================================================== */}

        <section className="px-5 py-28 sm:px-6">

          <div className="mx-auto max-w-7xl">

            <div className="max-w-3xl">

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
                Why Employers Choose HireX
              </p>

              <h2
                className="
                  mt-5
                  text-4xl
                  font-semibold
                  tracking-[-0.04em]
                  sm:text-6xl
                "
              >
                Recruiting capacity without unnecessary complexity.
              </h2>

            </div>


            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {[
                {
                  icon: ShieldCheck,
                  title: "Quality Focus",
                  text: "A structured recruiting process designed around candidate quality and hiring outcomes.",
                },
                {
                  icon: Clock3,
                  title: "Faster Capacity",
                  text: "Add recruiting support without waiting to build an entirely new internal team.",
                },
                {
                  icon: BarChart3,
                  title: "Visibility",
                  text: "Maintain visibility into recruiting activity, pipeline movement and progress.",
                },
                {
                  icon: Globe2,
                  title: "Global Talent",
                  text: "Access recruiting capability across multiple markets and talent pools.",
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
                      bg-[#05060b]/75
                      p-6
                      shadow-xl
                      backdrop-blur-xl
                    "
                  >
                    <Icon
                      size={24}
                      className="text-cyan-200"
                    />

                    <h3 className="mt-5 font-semibold">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-white/50">
                      {item.text}
                    </p>
                  </div>
                );
              })}

            </div>

          </div>

        </section>


        {/* ===================================================
            MARKET PULSE
        =================================================== */}

        <section className="px-5 py-24 sm:px-6">

          <div className="mx-auto max-w-5xl">

            <div
              className="
                rounded-[2rem]
                border
                border-cyan-300/10
                bg-[#05060b]/80
                p-8
                shadow-2xl
                backdrop-blur-2xl
                sm:p-12
              "
            >

              <div className="flex flex-col gap-8 sm:flex-row sm:items-start">

                <div
                  className="
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-cyan-300/10
                    text-cyan-200
                  "
                >
                  <BarChart3 size={27} />
                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
                    Employer Market Pulse
                  </p>

                  <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                    Your hiring strategy should follow the market.
                  </h2>

                  <p className="mt-5 leading-7 text-white/55">
                    Hiring conditions change by industry, occupation,
                    geography and time. HireX can use relevant market
                    information to help employers understand demand,
                    recruiting conditions and workforce trends.
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-3">

                    {[
                      "Hiring Demand",
                      "Talent Availability",
                      "Workforce Trends",
                    ].map((item) => (
                      <div
                        key={item}
                        className="
                          rounded-xl
                          border
                          border-white/10
                          bg-white/[0.025]
                          px-4
                          py-4
                          text-sm
                          text-white/60
                        "
                      >
                        {item}
                      </div>
                    ))}

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            RPO TRIAL
        =================================================== */}

        <section className="px-5 py-28 sm:px-6">

          <div className="mx-auto max-w-5xl">

            <div
              className="
                overflow-hidden
                rounded-[2rem]
                border
                border-white/10
                bg-[#05060b]/85
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
                <Sparkles size={29} />
              </div>

              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
                Start Small
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
                Test the model before going all in.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl leading-7 text-white/55">
                Start with a two-week RPO trial and evaluate the
                recruiting team, communication, workflow and
                delivery before making a longer-term commitment.
              </p>

              <a
                href="#contact"
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
                  hover:bg-white/90
                "
              >
                Discuss an RPO Trial
                <ArrowRight size={18} />
              </a>

            </div>

          </div>

        </section>


        {/* ===================================================
            CONTACT
        =================================================== */}

        <section
          id="contact"
          className="px-5 pb-28 pt-20 sm:px-6"
        >

          <div className="mx-auto max-w-4xl text-center">

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
              Let's Build Your Recruiting Operation
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
              Ready to scale?
              <span className="block text-white/45">
                Let's talk.
              </span>
            </h2>

            <p className="mx-auto mt-7 max-w-xl leading-7 text-white/55">
              Tell us what you're hiring, where you're hiring and
              how much recruiting capacity you need. We'll help
              determine the right model for your organization.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">

              <a
                href="mailto:info@hirex.com"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-white
                  px-8
                  py-4
                  font-semibold
                  text-black
                  transition
                  hover:-translate-y-0.5
                "
              >
                Talk to HireX
                <ArrowRight size={18} />
              </a>

              <a
                href="/"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-white/15
                  bg-black/60
                  px-8
                  py-4
                  font-semibold
                  text-white
                  backdrop-blur-xl
                  transition
                  hover:bg-black/75
                "
              >
                <ArrowLeft size={18} />
                Back Home
              </a>

            </div>

          </div>

        </section>


        {/* ===================================================
            FOOTER
        =================================================== */}

        <footer className="border-t border-white/10 px-5 py-10 sm:px-6">

          <div
            className="
              mx-auto
              flex
              max-w-7xl
              flex-col
              gap-6
              text-sm
              text-white/40
              md:flex-row
              md:items-end
              md:justify-between
            "
          >

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


/* ==========================================================
   SMALL ICON HELPER
========================================================== */

function Building2Icon() {
  return (
    <span className="flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
  );
}