import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLibraryResource } from '../mocks/store'
import {
  LIBRARY_KIND_LABELS,
  LIBRARY_TOPIC_LABELS,
  libraryEmbedUrl,
} from '../types'
import { Button, ButtonLink } from '../components/Button'
import { ReadingBookmarkBar } from '../components/ReadingBookmarkBar'

export function LibraryReaderPage() {
  const { id } = useParams()
  const resource = id ? getLibraryResource(id) : undefined
  const [pageIndex, setPageIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'1up' | '2up'>('2up')

  useEffect(() => {
    setPageIndex(0)
    if (resource?.pdf?.mode) setViewMode(resource.pdf.mode)
  }, [id, resource?.pdf?.mode])

  if (!resource) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">Material not found</p>
        <ButtonLink to="/library" variant="secondary" className="mt-4">
          Back to Read
        </ButtonLink>
      </div>
    )
  }

  if (resource.format === 'pdf' && resource.pdf) {
    const pdf = { ...resource.pdf, mode: viewMode }
    const embedUrl = libraryEmbedUrl(pdf)
    const sourceUrl =
      pdf.sourceUrl ??
      (pdf.archiveId
        ? `https://archive.org/details/${pdf.archiveId}${pdf.archiveFile ? `/${pdf.archiveFile}` : ''}`
        : undefined)

    return (
      <div className="flex min-h-[calc(100dvh-8rem)] flex-col gap-4 animate-rise">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to="/library"
              className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
            >
              ← All reading
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
              {resource.title}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {resource.author} · {resource.language} · PDF book
              {pdf.pageProgression === 'rtl' ? ' · RTL' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-line bg-canvas p-1">
              <button
                type="button"
                onClick={() => setViewMode('1up')}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  viewMode === '1up'
                    ? 'bg-brand-700 text-white'
                    : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                1 page
              </button>
              <button
                type="button"
                onClick={() => setViewMode('2up')}
                className={[
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  viewMode === '2up'
                    ? 'bg-brand-700 text-white'
                    : 'text-muted hover:text-ink',
                ].join(' ')}
              >
                2 pages
              </button>
            </div>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 transition hover:bg-brand-100"
              >
                Open on Archive.org
              </a>
            ) : null}
          </div>
        </div>

        <ReadingBookmarkBar resourceId={resource.id} />

        <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-line bg-brand-800 shadow-sm">
          {embedUrl ? (
            <iframe
              key={`${resource.id}-${viewMode}`}
              title={resource.title}
              src={embedUrl}
              className="h-[min(78dvh,900px)] w-full border-0 bg-black"
              allowFullScreen
            />
          ) : (
            <div className="grid h-[50vh] place-items-center p-8 text-center text-brand-100">
              <p>PDF source is missing for this book.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const pages = resource.pages ?? []
  const page = pages[pageIndex]
  const total = pages.length

  if (!page) {
    return (
      <div className="panel p-8 text-center">
        <p className="font-semibold">No pages in this material</p>
        <ButtonLink to="/library" variant="secondary" className="mt-4">
          Back to Read
        </ButtonLink>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-rise">
      <Link
        to="/library"
        className="text-sm font-medium text-brand-700 transition hover:text-brand-800"
      >
        ← All reading
      </Link>

      <header className="panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          {LIBRARY_KIND_LABELS[resource.kind]} · {LIBRARY_TOPIC_LABELS[resource.topic]} · Short
          read
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
          {resource.title}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {resource.author} · {resource.readingMinutes} min · {resource.language}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{resource.summary}</p>
      </header>

      <ReadingBookmarkBar resourceId={resource.id} />

      <article className="panel px-6 py-8 md:px-10 md:py-10">
        {page.heading ? (
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">{page.heading}</h2>
        ) : null}
        <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink">
          {page.body.split('\n\n').map((para, index) => (
            <p key={`${pageIndex}-${index}`}>{para}</p>
          ))}
        </div>
      </article>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Section {pageIndex + 1} of {total}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pageIndex === total - 1}
            onClick={() => setPageIndex((i) => Math.min(total - 1, i + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
