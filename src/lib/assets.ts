/**
 * Resolves a `public/` asset path against the deploy base so URLs stay correct
 * when the app is served from a subpath (e.g. GitHub Pages project sites).
 */
export function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`
}
