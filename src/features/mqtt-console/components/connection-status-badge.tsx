import { Badge, type BadgeTone } from '@/components/ui/badge'
import type { ConnectionStatus } from '../use-mqtt-client'

const STATUS: Record<ConnectionStatus, { label: string; tone: BadgeTone }> = {
  connected: { label: 'Connected', tone: 'success' },
  connecting: { label: 'Connecting', tone: 'info' },
  reconnecting: { label: 'Reconnecting', tone: 'warning' },
  disconnected: { label: 'Disconnected', tone: 'neutral' },
}

export function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const meta = STATUS[status]
  return (
    <Badge tone={meta.tone} dot pulse={status !== 'disconnected'}>
      {meta.label}
    </Badge>
  )
}
