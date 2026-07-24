import type { LibraryResource } from '../types'
import { LIBRARY_KIND_LABELS } from '../types'

type CoverResource = Pick<
  LibraryResource,
  'title' | 'author' | 'kind' | 'coverColor' | 'coverImage' | 'format'
>

/**
 * Real cover image when `coverImage` is set; otherwise a CSS book cover.
 * Do not generate placeholder images — CSS is the intentional fallback.
 */
export function BookCover({
  resource,
  className = '',
  labelClassName = 'text-[8px] font-bold uppercase text-white/90',
}: {
  resource: CoverResource
  className?: string
  labelClassName?: string
}) {
  if (resource.coverImage) {
    return (
      <span className={`relative isolate block overflow-hidden bg-brand-800 ${className}`}>
        <img
          src={resource.coverImage}
          alt=""
          className="block h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <span
          className={`pointer-events-none absolute bottom-1 end-1 z-10 rounded bg-black/45 px-1 py-0.5 ${labelClassName}`}
        >
          {resource.format === 'pdf' ? 'PDF' : 'Read'}
        </span>
        <span className="sr-only">{resource.title}</span>
      </span>
    )
  }

  const shortTitle =
    resource.title.length > 42 ? `${resource.title.slice(0, 40)}…` : resource.title

  return (
    <span
      className={`relative isolate flex min-h-[4rem] w-full flex-col overflow-hidden text-white ${className}`}
      style={{
        background: `linear-gradient(155deg, color-mix(in srgb, ${resource.coverColor} 88%, white), ${resource.coverColor} 55%, color-mix(in srgb, ${resource.coverColor} 75%, black))`,
      }}
    >
      {/* Spine edge */}
      <span
        className="pointer-events-none absolute inset-y-0 start-0 w-2.5 border-e border-black/20"
        style={{
          background:
            'linear-gradient(90deg, rgb(0 0 0 / 0.28), rgb(255 255 255 / 0.12) 45%, rgb(0 0 0 / 0.18))',
        }}
        aria-hidden
      />
      {/* Lattice texture */}
      <span
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'36\' height=\'36\' viewBox=\'0 0 36 36\'%3E%3Cpath fill=\'none\' stroke=\'%23ffffff\' stroke-opacity=\'0.55\' stroke-width=\'0.8\' d=\'M0 18h36M18 0v36M0 0l36 36M36 0L0 36\'/%3E%3C/svg%3E")',
          backgroundSize: '36px 36px',
        }}
        aria-hidden
      />
      <span className="relative z-10 flex min-h-0 flex-1 flex-col justify-between gap-1 p-2 ps-3.5">
        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/70">
          {LIBRARY_KIND_LABELS[resource.kind]}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-3 block text-[11px] font-extrabold leading-snug tracking-tight">
            {shortTitle}
          </span>
          <span className="mt-1 line-clamp-1 block text-[9px] font-medium text-white/75">
            {resource.author}
          </span>
        </span>
        <span
          className={`self-end rounded bg-black/35 px-1 py-0.5 ${labelClassName}`}
        >
          {resource.format === 'pdf' ? 'PDF' : 'Read'}
        </span>
      </span>
      <span className="sr-only">{resource.title}</span>
    </span>
  )
}
