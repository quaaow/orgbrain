'use client';

import Link from 'next/link';
import { useSession } from '@/components/session-provider';

const FEATURES = [
  {
    title: 'Semantic search',
    desc: 'Find anything by meaning, not keywords. Ask the way you think and get the context you actually need.',
  },
  {
    title: 'Decision log',
    desc: 'Capture not just what you decided, but why — with the trade-offs and context that future-you will thank you for.',
  },
  {
    title: 'Lessons learned',
    desc: 'Turn post-mortems and hard-won insights into reusable knowledge instead of forgotten Slack threads.',
  },
  {
    title: 'AI Reflection',
    desc: 'Paste raw notes, docs or transcripts — OrgBrain extracts structured facts, decisions and lessons for review.',
  },
  {
    title: 'Knowledge graph',
    desc: 'See how facts, decisions and lessons connect, supersede and relate across your organisation.',
  },
  {
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
        <div className="mx-auto max-w-3xl px-5 py-24 text-center sm:py-32">
          <div className="mb-5 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60">
            Organisational memory, powered by AI
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Your organisation’s memory,
            <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
              {' '}
              searchable by meaning
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/60">
            Capture knowledge, decisions and lessons. OrgBrain turns scattered
            context into a structured, AI-reflected memory your whole team can
            actually find and reuse.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="rounded-xl bg-white px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
            >
              {ctaLabel}
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-white/15 px-6 py-3 font-medium text-white/80 transition-colors hover:bg-white/5"
            >
              See features
            </a>
          </div>
          <p className="mt-4 text-xs text-white/30">
            No credit card required · Open source
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          Everything your team forgets, in one place
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-white/50">
          Built for the knowledge that lives in people’s heads and dies in chat
          history.
        </p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-indigo-400/40 hover:bg-white/[0.04]"
            >
              <h3 className="font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10 text-lg font-semibold text-indigo-300">
                {s.n}
              </div>
              <h3 className="mt-4 font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-5 py-20">
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
            className="mt-8 inline-block rounded-xl bg-white px-6 py-3 font-medium text-black transition-opacity hover:opacity-90"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}
