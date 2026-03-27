import { Helmet } from 'react-helmet-async';

const DEFAULTS = {
  siteName: 'tabakat.io',
  description: 'İslam ilim geleneğinin interaktif ansiklopedisi — 22.000+ âlim, silsile ağları, tabakat kitapları ve haritalar.',
  url: 'https://tabakat.io',
  image: 'https://tabakat.io/og-image.png',
  type: 'website',
};

export default function SEO({ title, description, path = '', type, jsonLd }) {
  const pageTitle = title ? `${title} — ${DEFAULTS.siteName}` : DEFAULTS.siteName;
  const pageDesc = description || DEFAULTS.description;
  const canonicalUrl = `${DEFAULTS.url}${path}`;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OG */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:type" content={type || DEFAULTS.type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={DEFAULTS.image} />
      <meta property="og:site_name" content={DEFAULTS.siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image" content={DEFAULTS.image} />

      {/* JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
