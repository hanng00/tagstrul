import { Helmet } from "react-helmet-async"

interface SEOProps {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  ogType?: "website" | "article"
  noindex?: boolean
}

const SITE_NAME = "Tågstrul"
const DEFAULT_TITLE = "Tågstrul — Få ersättning när tåget är försenat"
const DEFAULT_DESCRIPTION =
  "Sluta missa ersättningar. Vi bevakar dina Mälartåg-resor och hjälper dig kräva tillbaka pengar vid förseningar. Movingo-kort ger 50 kr redan vid 20 min försening."
const SITE_URL = "https://tagstrul.se"
const OG_IMAGE = `${SITE_URL}/og-image.png`

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  ogImage = OG_IMAGE,
  ogType = "website",
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:site_name" content={SITE_NAME} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  )
}

export { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION }
