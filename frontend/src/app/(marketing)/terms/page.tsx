import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern your use of OrgBrain.',
};

const UPDATED = 'June 8, 2026';

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-white/40">Last updated: {UPDATED}</p>

      <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200/80">
        This is a good-faith template, not legal advice. Have a qualified lawyer
        review and adapt it for your jurisdiction before relying on it.
      </div>

      <div className="mt-10 space-y-8 text-white/70">
        <section>
          <h2 className="text-lg font-medium text-white">1. Acceptance</h2>
          <p className="mt-2 leading-relaxed">
            By accessing or using OrgBrain (the “Service”) you agree to these
            Terms of Service. If you are using the Service on behalf of an
            organisation, you represent that you are authorised to bind that
            organisation to these terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">2. The Service</h2>
          <p className="mt-2 leading-relaxed">
            OrgBrain helps teams capture knowledge, decisions and lessons and
            retrieve them via semantic search and AI-assisted reflection. The
            Service is provided on an “as is” and “as available” basis and may
            change over time. OrgBrain is also available as open-source software
            under the MIT licence for self-hosting.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">
            3. Accounts &amp; eligibility
          </h2>
          <p className="mt-2 leading-relaxed">
            You are responsible for safeguarding your account credentials and
            for all activity under your account and any API keys you create. You
            must be old enough to form a binding contract in your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">4. Acceptable use</h2>
          <p className="mt-2 leading-relaxed">
            You agree not to misuse the Service, including by: submitting
            unlawful content; infringing others’ rights; attempting to breach
            security or access data that is not yours; overloading or disrupting
            the Service; or using it to build a competing dataset by scraping.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">
            5. Your content
          </h2>
          <p className="mt-2 leading-relaxed">
            You retain ownership of the content you submit. You grant OrgBrain a
            limited licence to process and store your content solely to operate
            and improve the Service for you, including sending text to AI
            providers to generate embeddings and reflections (see our{' '}
            <a href="/privacy" className="text-indigo-300 hover:underline">
              Privacy Policy
            </a>
            ). You are responsible for having the rights to submit your content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">6. AI features</h2>
          <p className="mt-2 leading-relaxed">
            AI-generated output (reflections, extractions, search ranking) may be
            inaccurate or incomplete. Always review AI output before relying on
            it. OrgBrain is not liable for decisions made based on AI output.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">
            7. Disclaimers &amp; liability
          </h2>
          <p className="mt-2 leading-relaxed">
            To the maximum extent permitted by law, the Service is provided
            without warranties of any kind, and OrgBrain shall not be liable for
            any indirect, incidental or consequential damages, or for loss of
            data, profits or revenue arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">8. Termination</h2>
          <p className="mt-2 leading-relaxed">
            You may stop using the Service at any time. We may suspend or
            terminate access if you violate these terms or to protect the
            Service or other users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">9. Changes</h2>
          <p className="mt-2 leading-relaxed">
            We may update these terms from time to time. Material changes will be
            reflected by updating the “Last updated” date above. Continued use
            after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">10. Contact</h2>
          <p className="mt-2 leading-relaxed">
            Questions about these terms? Open an issue on our{' '}
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
