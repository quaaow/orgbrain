import Script from 'next/script';

/**
 * Privacy-friendly, cookieless analytics (Plausible). Renders nothing unless
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set, so dev/self-host builds stay clean.
 * Point NEXT_PUBLIC_PLAUSIBLE_SRC at a self-hosted script if needed.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;

  const src =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? 'https://plausible.io/js/script.js';

  return (
    <Script
      defer
      data-domain={domain}
      src={src}
      strategy="afterInteractive"
    />
  );
}
