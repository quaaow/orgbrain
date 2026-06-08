import type { Metadata } from 'next';
import './globals.css';
import { SessionProvider } from '@/components/session-provider';
import { ToastProvider } from '@/components/toast';
import { Analytics } from '@/components/analytics';
import { alt as previewImageAlt, size as previewImageSize } from '@/lib/preview-image';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://orgbrain.vercel.app';
const title = 'OrgBrain — your organisation’s memory';
const description =
  'Capture knowledge, decisions and lessons, then find anything by meaning. ' +
  'OrgBrain turns scattered context into a searchable, AI-reflected memory for your team.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · OrgBrain',
  },
  description,
  applicationName: 'OrgBrain',
  keywords: [
    'organisational memory',
    'knowledge base',
    'decision log',
    'semantic search',
    'team knowledge',
    'AI knowledge management',
  ],
  authors: [{ name: 'OrgBrain' }],
  openGraph: {
    type: 'website',
    siteName: 'OrgBrain',
    title,
    description,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: {
      url: '/opengraph-image',
      alt: previewImageAlt,
      width: previewImageSize.width,
      height: previewImageSize.height,
    },
  },
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
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
