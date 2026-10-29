import { cn } from '@/lib/utils'
import { type ServiceState, useSystemStatus } from './use-system-status'

const dot: Record<ServiceState, string> = {
  up: 'bg-success',
  down: 'bg-destructive',
  disabled: 'bg-muted-foreground',
  unknown: 'bg-muted-foreground animate-pulse',
}

export function StatusDot({ state, className }: { state: ServiceState; className?: string }) {
  return <span className={cn('inline-block size-2 rounded-full', dot[state], className)} />
}

export function SystemStatus({ compact = false }: { compact?: boolean }) {
  const status = useSystemStatus()
  const items = [
    { label: 'API', state: status.api },
    { label: 'Database', state: status.db },
    { label: 'MQTT', state: status.mqtt },
  ]

  if (compact) {
    return (
      <div
        className='grid place-items-center py-2'
        title={items.map((item) => `${item.label}: ${item.state}`).join(' · ')}
      >
        <StatusDot state={status.allUp ? 'up' : status.loading ? 'unknown' : 'down'} />
      </div>
    )
  }

  return (
    <div className='grid gap-2 rounded-lg border border-sidebar-border bg-white/[0.03] p-3'>
      <div className='text-[10px] font-bold tracking-[0.14em] text-sidebar-muted uppercase'>
        System
      </div>
      {items.map((item) => (
        <div key={item.label} className='flex items-center justify-between text-xs'>
          <span>{item.label}</span>
          <span className='flex items-center gap-1.5 text-sidebar-muted capitalize'>
            <StatusDot state={item.state} />
            {item.state === 'unknown' ? 'checking' : item.state}
          </span>
        </div>
      ))}
    </div>
  )
}
