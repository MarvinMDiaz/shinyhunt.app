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

const SITE_NAME = 'ShinyHunt.app'
const DEFAULT_DESCRIPTION = 'Free Pokémon shiny hunt tracker. Track shiny hunts, calculate odds, monitor progress, and build your shiny collection. The best shiny hunting tracker for all Pokémon generations.'
const DEFAULT_OG_IMAGE = '/logo.png'
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

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="robots" content={robotsContent.join(', ')} />
      <link rel="canonical" href={url} />

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
      <meta name="keywords" content="shiny hunt tracker, pokemon shiny hunting tracker, shiny odds tracker, track pokemon hunts, shiny collection tracker, pokemon shiny tracker, shiny pokemon tracker, pokemon hunt tracker" />
      <meta name="theme-color" content="#FFD700" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Helmet>
  )
}
