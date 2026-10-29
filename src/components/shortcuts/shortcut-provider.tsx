import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SHORTCUTS } from '@/config/shortcuts'
import {
  eventKey,
  isPlainStep,
  isStrongStep,
  isTypingTarget,
  matchesStep,
  parseCombo,
} from '@/lib/shortcuts'
import { ShortcutContext, type ShortcutEntry } from './shortcut-context'

const SEQUENCE_TIMEOUT_MS = 1000

const isDialogOpen = () => document.querySelector('[role="dialog"][data-state="open"]') !== null

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const entries = useRef<ShortcutEntry[]>([])
  const pending = useRef<{ key: string; at: number } | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)

  const register = useCallback((entry: ShortcutEntry) => {
    entries.current = [...entries.current, entry]
    return () => {
      entries.current = entries.current.filter((item) => item !== entry)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return
      const typing = isTypingTarget(event.target)
      const modalOpen = isDialogOpen()
      const now = Date.now()
      const previous = pending.current
      const seen = new Set<string>()

      for (let index = entries.current.length - 1; index >= 0; index -= 1) {
        const entry = entries.current[index]
        if (seen.has(entry.id)) continue
        seen.add(entry.id)

        if (modalOpen ? entry.scope !== 'modal' : entry.scope === 'modal') continue

        const steps = parseCombo(SHORTCUTS[entry.id].combo)
        const last = steps[steps.length - 1]
        if (typing && !isStrongStep(last)) continue

        const matched =
          steps.length === 1
            ? matchesStep(event, last)
            : previous !== null &&
              now - previous.at < SEQUENCE_TIMEOUT_MS &&
              isPlainStep(steps[0]) &&
              previous.key === steps[0].key &&
              matchesStep(event, last)

        if (matched) {
          event.preventDefault()
          pending.current = null
          entry.run(event)
          return
        }
      }

      const plain = !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey
      pending.current = plain && !typing ? { key: eventKey(event), at: now } : null
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = useMemo(() => ({ register, helpOpen, setHelpOpen }), [register, helpOpen])

  return <ShortcutContext.Provider value={value}>{children}</ShortcutContext.Provider>
}
