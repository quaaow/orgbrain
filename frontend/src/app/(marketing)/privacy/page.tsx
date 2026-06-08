import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How OrgBrain collects, uses and protects your data.',
};

const UPDATED = 'June 8, 2026';

const SUBPROCESSORS = [
  ['Supabase', 'Authentication & primary database (Postgres)'],
  ['Qdrant', 'Vector storage for semantic search embeddings'],
  ['OpenRouter', 'LLM gateway that processes submitted text for reflection'],
  ['Sentry', 'Error monitoring (no request bodies or content are sent)'],
  ['Railway', 'Backend application hosting'],
  ['Vercel', 'Frontend hosting & content delivery'],
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-white/40">Last updated: {UPDATED}</p>

      <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200/80">
        This is a good-faith template, not legal advice. Have a qualified lawyer
        review and adapt it for your jurisdiction (including GDPR/CCPA
        obligations) before relying on it.
      </div>

      <div className="mt-10 space-y-8 text-white/70">
        <section>
          <h2 className="text-lg font-medium text-white">1. What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
            <li>
              <strong className="text-white/90">Account data</strong> — your
              email address and authentication metadata, via Supabase.
            </li>
            <li>
              <strong className="text-white/90">Content you submit</strong> —
              knowledge, decisions, lessons and any text you send for AI
              reflection, scoped to your organisation.
            </li>
            <li>
              <strong className="text-white/90">Technical data</strong> — basic
              logs and error reports needed to operate and secure the Service.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">2. How we use it</h2>
          <p className="mt-2 leading-relaxed">
            We use your data to provide the Service: storing your content,
            generating embeddings for semantic search, producing AI reflections,
            authenticating you, and keeping the Service secure and reliable. We
            do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">3. AI processing</h2>
          <p className="mt-2 leading-relaxed">
            When you use search or AI Reflection, the relevant text is sent to
            our LLM provider (OpenRouter) to generate embeddings and structured
            output. Do not submit content you are not permitted to share with a
            third-party AI processor.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">4. Subprocessors</h2>
          <p className="mt-2 leading-relaxed">
            We rely on the following providers to deliver the Service:
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10">
            {SUBPROCESSORS.map(([name, role], i) => (
              <div
                key={name}
                className={`flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 ${
                  i % 2 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <div className="w-32 shrink-0 font-medium text-white/90">
                  {name}
                </div>
                <div className="text-sm text-white/55">{role}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">
            5. Cookies &amp; analytics
          </h2>
          <p className="mt-2 leading-relaxed">
            We use only the cookies/local storage required to keep you signed in
            and remember your active organisation. If product analytics are
            enabled, we use a privacy-friendly, cookieless analytics provider
            that does not track you across sites.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">6. Data retention</h2>
          <p className="mt-2 leading-relaxed">
            We retain your content for as long as your account/organisation is
            active. You can delete content at any time; deleting your
            organisation removes its associated data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">7. Security</h2>
          <p className="mt-2 leading-relaxed">
            Data is encrypted in transit. Access is isolated per organisation
            using role-based access control and database row-level security. No
            system is perfectly secure, but we take reasonable measures to
            protect your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">8. Your rights</h2>
          <p className="mt-2 leading-relaxed">
            Depending on your jurisdiction, you may have rights to access,
            correct, export or delete your personal data. To exercise them,
            contact us using the details below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">9. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about privacy? Open an issue on our{' '}
            <a
              href="https://github.com/quaaow/orgbrain"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-300 hover:underline"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  );
}
