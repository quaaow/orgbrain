import Link from 'next/link';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0b]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            OrgBrain
          </Link>
          <nav className="flex items-center gap-3 text-sm sm:gap-5">
            <a href="#features" className="hidden text-white/60 hover:text-white sm:inline">
              Features
            </a>
            <a href="#how" className="hidden text-white/60 hover:text-white sm:inline">
              How it works
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-white px-4 py-1.5 font-medium text-black transition-all hover:opacity-90 active:scale-[0.97]"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-white/40 sm:flex-row">
          <div>© {new Date().getFullYear()} OrgBrain</div>
          <nav className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <a
              href="https://github.com/quaaow/orgbrain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
