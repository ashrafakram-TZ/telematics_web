import { Badge } from '@/components/ui/badge'
import { DEVICE_STATUS, type DeviceStatus } from '../status'

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  const meta = DEVICE_STATUS[status]
  return (
    <Badge tone={meta.tone} dot pulse={status === 'online'}>
      {meta.label}
    </Badge>
  )
}
