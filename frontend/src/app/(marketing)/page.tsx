'use client';

import Link from 'next/link';
import { useSession } from '@/components/session-provider';
import { motion } from 'framer-motion';
import { FloatingMockups } from './mockups';

const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
    title: 'Semantic search',
    desc: 'Find anything by meaning, not keywords. Ask the way you think and get the context you actually need.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    title: 'Decision log',
    desc: 'Capture not just what you decided, but why — with the trade-offs and context that future-you will thank you for.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
      </svg>
    ),
    title: 'Lessons learned',
    desc: 'Turn post-mortems and hard-won insights into reusable knowledge instead of forgotten Slack threads.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    title: 'AI Reflection',
    desc: 'Paste raw notes, docs or transcripts — OrgBrain extracts structured facts, decisions and lessons for review.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>
    ),
    title: 'Knowledge graph',
    desc: 'See how facts, decisions and lessons connect, supersede and relate across your organisation.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
    title: 'Multi-tenant & secure',
    desc: 'Per-organisation isolation, role-based access, row-level security and API keys for programmatic access.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Capture',
    desc: 'Add knowledge, decisions and lessons — or drop in raw text and let AI Reflection structure it.',
  },
  {
    n: '2',
    title: 'Connect',
    desc: 'Everything is embedded and linked, building a living graph of your team’s context.',
  },
  {
    n: '3',
    title: 'Retrieve',
    desc: 'Search by meaning and get answers grounded in your organisation’s real history.',
  },
];

function SectionFade({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { session } = useSession();
  const ctaHref = session ? '/dashboard' : '/login';
  const ctaLabel = session ? 'Open app' : 'Get started — free';

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.18),transparent_70%)]"
        />
        <div className="mx-auto max-w-6xl px-5 pt-24 text-center sm:pt-32">
          <motion.div
            className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Organisational memory, powered by AI
          </motion.div>

          <motion.h1
            className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Your organisation’s memory,
            <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
              {' '}
              searchable by meaning
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/60"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Capture knowledge, decisions and lessons. OrgBrain turns scattered
            context into a structured, AI-reflected memory your whole team can
            actually find and reuse.
          </motion.p>

          <motion.div
            className="mt-9 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href={ctaHref}
              className="rounded-xl bg-white px-6 py-3 font-medium text-black transition-all hover:opacity-90 active:scale-[0.97]"
            >
              {ctaLabel}
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/15 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/5"
            >
              See features
            </a>
          </motion.div>

          <motion.p
            className="mt-4 text-xs text-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            No credit card required · Open source
          </motion.p>

          <FloatingMockups />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <SectionFade>
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Everything your team forgets, in one place
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-white/50">
            Built for the knowledge that lives in people’s heads and dies in chat
            history.
          </p>
        </SectionFade>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <SectionFade key={f.title} delay={i * 0.08}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all duration-200 hover:border-indigo-400/40 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-indigo-300 transition-colors group-hover:border-indigo-400/30 group-hover:bg-indigo-500/10">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-medium">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {f.desc}
                </p>
              </div>
            </SectionFade>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <SectionFade>
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            How it works
          </h2>
        </SectionFade>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <SectionFade key={s.n} delay={i * 0.12}>
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10 text-lg font-semibold text-indigo-300 transition-transform hover:scale-110">
                  {s.n}
                </div>
                <h3 className="mt-4 font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {s.desc}
                </p>
              </div>
            </SectionFade>
          ))}
        </div>
      </section>

      {/* Social proof placeholder */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <SectionFade>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center">
            <p className="text-lg font-medium text-white/80">
              “We were losing context every time someone left. OrgBrain is the first tool that actually structures what we know.”
            </p>
            <p className="mt-3 text-sm text-white/40">
              Early team feedback
            </p>
          </div>
        </SectionFade>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20">
        <SectionFade>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-10 text-center sm:p-16">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Start building your team’s memory
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Spin up an organisation in seconds and capture your first decision
              today.
            </p>
            <Link
              href={ctaHref}
              className="mt-8 inline-block rounded-xl bg-white px-6 py-3 font-medium text-black transition-all hover:opacity-90 active:scale-[0.97]"
            >
              {ctaLabel}
            </Link>
          </div>
        </SectionFade>
      </section>
    </div>
  );
}
