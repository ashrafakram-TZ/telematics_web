import { useState } from 'react'
import { Outlet, useNavigate } from '@tanstack/react-router'
import { useShortcut, useShortcutHelp } from '@/components/shortcuts/shortcut-context'
import { NAV_ITEMS } from '@/config/nav'
import { cn } from '@/lib/utils'
import { useTheme } from '@/providers/theme-context'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

const COLLAPSED_KEY = 'tz-sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function AppLayout() {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  const { setHelpOpen } = useShortcutHelp()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next))
    } catch {
      return
    }
  }

  const [dashboard, devices, consolePage] = NAV_ITEMS
  useShortcut(dashboard.shortcut, () => navigate({ to: dashboard.to }), { scope: 'global' })
  useShortcut(devices.shortcut, () => navigate({ to: devices.to }), { scope: 'global' })
  useShortcut(consolePage.shortcut, () => navigate({ to: consolePage.to }), { scope: 'global' })
  useShortcut('app.help', () => setHelpOpen(true), { scope: 'global' })
  useShortcut('app.theme', toggleTheme, { scope: 'global' })
  useShortcut('app.sidebar', toggleCollapsed, { scope: 'global' })

  return (
    <div className='min-h-dvh'>
      <a
        href='#content'
        className='sr-only z-[60] rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3'
      >
        Skip to content
      </a>
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding] duration-300 ease-out',
          collapsed ? 'md:pl-[76px]' : 'md:pl-64'
        )}
      >
        <AppHeader onToggleSidebar={toggleCollapsed} onOpenMobile={() => setMobileOpen(true)} />
        <Outlet />
      </div>
    </div>
  )
}
