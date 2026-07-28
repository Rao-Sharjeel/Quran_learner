import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getGuardian, getLearners, useAskQuestions } from '../../mocks/store'
import { SUBJECT_LABELS, type SubjectId } from '../../types'
import { matchesAskSearch } from '../../lib/format'

export type AskHomeTab = 'featured' | 'recent'
export type AskListMode = 'home' | 'search' | 'topic'

export function useAskListController() {
  const [params, setParams] = useSearchParams()
  const guardian = getGuardian()
  const familyIds = new Set(getLearners().map((l) => l.id))
  const all = useAskQuestions()

  const qParam = params.get('q') ?? ''
  const topicParam = (params.get('topic') as SubjectId | null) ?? null
  const [draft, setDraft] = useState(qParam)
  const [homeTab, setHomeTab] = useState<AskHomeTab>('featured')

  const published = useMemo(
    () => all.filter((q) => q.status === 'published'),
    [all],
  )

  const familyUnderReview = all.filter(
    (q) => q.status === 'under_review' && familyIds.has(q.studentId),
  )

  const topicRows = useMemo(() => {
    const counts = {} as Record<SubjectId, number>
    for (const id of Object.keys(SUBJECT_LABELS) as SubjectId[]) counts[id] = 0
    for (const q of published) counts[q.topic] = (counts[q.topic] ?? 0) + 1

    return (Object.keys(SUBJECT_LABELS) as SubjectId[])
      .map((id) => ({
        id,
        label: SUBJECT_LABELS[id],
        count: counts[id] ?? 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.label.localeCompare(b.label)
      })
  }, [published])

  const featured = useMemo(
    () =>
      [...published]
        .sort((a, b) => (b.comments?.length ?? 0) - (a.comments?.length ?? 0))
        .slice(0, 5),
    [published],
  )

  const recent = useMemo(
    () =>
      [...published]
        .sort((a, b) =>
          (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
        )
        .slice(0, 6),
    [published],
  )

  const searchResults = useMemo(() => {
    if (!qParam.trim()) return []
    return published
      .filter((q) => matchesAskSearch(q, qParam, SUBJECT_LABELS))
      .sort((a, b) =>
        (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
      )
  }, [published, qParam])

  const topicResults = useMemo(() => {
    if (!topicParam || !(topicParam in SUBJECT_LABELS)) return []
    return published
      .filter((q) => q.topic === topicParam)
      .sort((a, b) =>
        (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
      )
  }, [published, topicParam])

  const mode: AskListMode = qParam.trim()
    ? 'search'
    : topicParam && topicParam in SUBJECT_LABELS
      ? 'topic'
      : 'home'

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const next = draft.trim()
    if (!next) {
      setParams({})
      return
    }
    setParams({ q: next })
  }

  function selectTopic(id: SubjectId | null) {
    setDraft('')
    if (!id) {
      setParams({})
      return
    }
    setParams({ topic: id })
  }

  function clearToHome() {
    setDraft('')
    setParams({})
  }

  const homeList = homeTab === 'featured' ? featured : recent

  const activeQuestions =
    mode === 'search' ? searchResults : mode === 'topic' ? topicResults : homeList

  return {
    guardian,
    published,
    familyUnderReview,
    topicRows,
    qParam,
    topicParam,
    draft,
    setDraft,
    homeTab,
    setHomeTab,
    mode,
    onSearch,
    selectTopic,
    clearToHome,
    homeList,
    searchResults,
    topicResults,
    activeQuestions,
  }
}
