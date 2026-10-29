import { useRouterState } from '@tanstack/react-router'
import { Keyboard, Menu, Moon, PanelLeft, Sun } from 'lucide-react'
import { useShortcutHelp } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NAV_ITEMS } from '@/config/nav'
import { useTheme } from '@/providers/theme-context'
import { useSystemStatus } from './use-system-status'

interface AppHeaderProps {
  onToggleSidebar: () => void
  onOpenMobile: () => void
}

export function AppHeader({ onToggleSidebar, onOpenMobile }: AppHeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const { resolvedTheme, toggleTheme } = useTheme()
  const { setHelpOpen } = useShortcutHelp()
  const status = useSystemStatus()
  const current =
    NAV_ITEMS.find((item) => (item.to === '/' ? pathname === '/' : pathname.startsWith(item.to))) ??
    NAV_ITEMS[0]

  return (
    <header className='sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-6'>
      <Button
        variant='ghost'
        size='icon'
        onClick={onOpenMobile}
        className='md:hidden'
        aria-label='Open menu'
      >
        <Menu />
      </Button>
      <Button
        variant='ghost'
        size='icon'
        onClick={onToggleSidebar}
        className='hidden md:inline-flex'
        aria-label='Collapse or expand sidebar'
        title='Collapse or expand sidebar'
      >
        <PanelLeft />
      </Button>

      <div className='hidden min-w-0 items-center gap-2 text-sm sm:flex'>
        <span className='text-muted-foreground'>Telematics</span>
        <span className='text-muted-foreground/60'>/</span>
        <span className='truncate font-bold'>{current.label}</span>
      </div>

      <div className='ml-auto flex items-center gap-1.5'>
        <Badge
          tone={status.loading ? 'neutral' : status.allUp ? 'success' : 'danger'}
          dot
          pulse={status.allUp}
          className='mr-1 hidden sm:inline-flex'
        >
          {status.loading ? 'Checking' : status.allUp ? 'All systems up' : 'Service issue'}
        </Badge>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setHelpOpen(true)}
          aria-label='Keyboard shortcuts'
          className='gap-2'
        >
          <Keyboard />
          <Kbd id='app.help' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={toggleTheme}
          aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title='Switch theme (Alt+T)'
        >
          {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  )
}
