import { LayoutDashboard, RadioTower, Truck, type LucideIcon } from 'lucide-react'
import type { ShortcutId } from './shortcuts'

export interface NavItem {
  to: '/' | '/devices' | '/console'
  label: string
  description: string
  icon: LucideIcon
  shortcut: ShortcutId
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Dashboard',
    description: 'Fleet overview',
    icon: LayoutDashboard,
    shortcut: 'nav.dashboard',
  },
  {
    to: '/devices',
    label: 'Devices',
    description: 'Registered trackers',
    icon: Truck,
    shortcut: 'nav.devices',
  },
  {
    to: '/console',
    label: 'MQTT console',
    description: 'Publish and watch messages',
    icon: RadioTower,
    shortcut: 'nav.console',
  },
]
