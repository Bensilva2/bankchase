/**
 * Get the site URL for the current environment
 * Handles local development, Vercel preview, and production deployments
 */
export const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Production site URL (set in Vercel env)
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Vercel preview/staging URL (auto-set)
    'http://localhost:3000/' // Local development fallback

  // Ensure we have https:// for non-localhost URLs
  url = url.startsWith('http') ? url : `https://${url}`

  // Ensure trailing slash
  url = url.endsWith('/') ? url : `${url}/`

  return url
}

/**
 * Get the site URL without trailing slash
 * Useful for constructing specific paths
 */
export const getSiteURLBase = () => {
  return getURL().replace(/\/$/, '')
}
