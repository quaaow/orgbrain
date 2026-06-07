import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/session-provider';
import { Shell } from '@/components/shell';

export const metadata: Metadata = {
  title: 'OrgBrain',
  description: 'Organisational memory: knowledge, decisions and lessons.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Shell>{children}</Shell>
        </SessionProvider>
      </body>
    </html>
  );
}
