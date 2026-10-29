import { Fragment } from 'react'
import { SHORTCUTS, type ShortcutId } from '@/config/shortcuts'
import { comboKeys } from '@/lib/shortcuts'
import { cn } from '@/lib/utils'

interface KbdProps {
  id?: ShortcutId
  combo?: string
  className?: string
  inverted?: boolean
}

export function Kbd({ id, combo, className, inverted }: KbdProps) {
  const value = combo ?? (id ? SHORTCUTS[id].combo : '')
  if (!value) return null
  const steps = comboKeys(value)

  return (
    <span className={cn('hidden items-center gap-1 sm:inline-flex', className)} aria-hidden>
      {steps.map((keys, stepIndex) => (
        <Fragment key={stepIndex}>
          {stepIndex > 0 && <span className='text-[10px] opacity-60'>then</span>}
          {keys.map((key) => (
            <kbd
              key={key}
              className={cn(
                'inline-flex h-5 min-w-5 items-center justify-center rounded border px-1 font-mono text-[10px] leading-none font-medium',
                inverted
                  ? 'border-white/25 bg-white/10 text-current'
                  : 'border-border bg-muted text-muted-foreground'
              )}
            >
              {key}
            </kbd>
          ))}
        </Fragment>
      ))}
    </span>
  )
}
