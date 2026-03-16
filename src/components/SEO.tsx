import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  canonicalUrl?: string
  ogImage?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  noindex?: boolean
  nofollow?: boolean
}

const SITE_NAME = 'ShinyHunt'
const DEFAULT_DESCRIPTION = 'Track your Pokémon shiny hunts, reset counters, and build your shiny Pokédex. The ultimate shiny hunting tracker for Pokémon games.'
const DEFAULT_OG_IMAGE = '/og-image.png'
// Canonical domain: use www.shinyhunt.app as primary production domain
const CANONICAL_DOMAIN = 'https://www.shinyhunt.app'

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `Shiny Hunt Tracker | Pokémon Shiny Hunting Tracker | ${SITE_NAME}`
  
  // Build canonical URL: use canonical domain + current path
  let url: string
  if (canonicalUrl) {
    url = canonicalUrl
  } else if (typeof window !== 'undefined') {
    // Replace current origin with canonical domain for SEO
    const currentPath = window.location.pathname + window.location.search + window.location.hash
    url = CANONICAL_DOMAIN + currentPath
  } else {
    url = CANONICAL_DOMAIN
  }
  
  const imageUrl = ogImage.startsWith('http') ? ogImage : `${CANONICAL_DOMAIN}${ogImage}`

  const robotsContent = []
  if (noindex) robotsContent.push('noindex')
  if (nofollow) robotsContent.push('nofollow')
  if (robotsContent.length === 0) robotsContent.push('index', 'follow')
  
  // Add JSON-LD structured data for homepage
  const isHomepage = url === CANONICAL_DOMAIN || url === `${CANONICAL_DOMAIN}/`

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent.join(', ')} />
      <link rel="canonical" href={url} />

      {/* Favicons - Ensure consistent favicon across all pages */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
      <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64x64.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Additional SEO */}
      <meta name="keywords" content="pokemon shiny hunt tracker, shiny counter, shiny hunting tracker, pokemon reset counter, track shiny pokemon, shiny dex, pokemon shiny tracker, shiny pokemon tracker" />
      <meta name="theme-color" content="#FFD700" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Google Search Console Verification */}
      <meta name="google-site-verification" content="mIVHQe5sWLG72_3Z9Kw1X9-DkyO9nioEK5sL0dbeTLE" />
      
      {/* JSON-LD Structured Data for homepage */}
      {isHomepage && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ShinyHunt",
            "url": CANONICAL_DOMAIN,
            "description": "Track your Pokémon shiny hunts, reset counters, and build your shiny Pokédex. The ultimate shiny hunting tracker for Pokémon games.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${CANONICAL_DOMAIN}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          })
        }} />
      )}
    </Helmet>
  )
}
