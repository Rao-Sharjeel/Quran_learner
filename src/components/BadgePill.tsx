import { BADGE_LABELS, type BadgeId } from '../types'

const styles: Record<BadgeId, string> = {
  interviewed: 'bg-brand-50 text-brand-800 ring-brand-100',
  ijazah: 'bg-brass-soft text-brand-800 ring-brass/30',
  institution: 'bg-slate-50 text-slate-700 ring-slate-200',
  forum_scholar: 'bg-brand-800 text-white ring-brand-800',
}

export function BadgePill({ id }: { id: BadgeId }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${styles[id]}`}
      title={BADGE_LABELS[id]}
    >
      {BADGE_LABELS[id]}
    </span>
  )
}
