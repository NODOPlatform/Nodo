import { REQUEST_STATUSES, PERSON_STATUSES, URGENCY_LEVELS } from '../../lib/constants'
import { Badge } from './Badge'

export function RequestStatusBadge({ status }: { status: string }) {
  const s = REQUEST_STATUSES.find((s) => s.value === status)
  if (!s) return <Badge>{status}</Badge>
  return <Badge color={s.color}>{s.emoji} {s.label}</Badge>
}

export function PersonStatusBadge({ status }: { status: string }) {
  const s = PERSON_STATUSES.find((s) => s.value === status)
  if (!s) return <Badge>{status}</Badge>
  return <Badge color={s.color}>{s.label}</Badge>
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const u = URGENCY_LEVELS.find((u) => u.value === urgency)
  if (!u) return <Badge>{urgency}</Badge>
  return <Badge color={u.color}>{u.label}</Badge>
}
