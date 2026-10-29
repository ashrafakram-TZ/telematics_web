import type { BadgeTone } from '@/components/ui/badge'
import { config } from '@/config/env'
import type { Device } from './api'

export type DeviceStatus = 'online' | 'offline' | 'never' | 'inactive'

export function getDeviceStatus(
  device: Pick<Device, 'is_active' | 'last_seen_at'>,
  now = Date.now()
): DeviceStatus {
  if (!device.is_active) return 'inactive'
  if (!device.last_seen_at) return 'never'
  return now - new Date(device.last_seen_at).getTime() <= config.onlineWindowMs
    ? 'online'
    : 'offline'
}

export const DEVICE_STATUS: Record<
  DeviceStatus,
  { label: string; tone: BadgeTone; color: string }
> = {
  online: { label: 'Online', tone: 'success', color: '#22b46b' },
  offline: { label: 'Offline', tone: 'warning', color: '#e9a23b' },
  never: { label: 'No data yet', tone: 'neutral', color: '#8b9d94' },
  inactive: { label: 'Inactive', tone: 'danger', color: '#f0544a' },
}
