import { createContext, useContext, useEffect, useLayoutEffect, useRef } from 'react'
import type { ShortcutId } from '@/config/shortcuts'

export type ShortcutScope = 'global' | 'page' | 'modal'

export interface ShortcutEntry {
  id: ShortcutId
  scope: ShortcutScope
  run: (event: KeyboardEvent) => void
}

export interface ShortcutContextValue {
  register: (entry: ShortcutEntry) => () => void
  helpOpen: boolean
  setHelpOpen: (open: boolean) => void
}

export const ShortcutContext = createContext<ShortcutContextValue | null>(null)

function useShortcutContext() {
  const context = useContext(ShortcutContext)
  if (!context) throw new Error('Shortcut hooks must be used inside <ShortcutProvider>')
  return context
}

interface UseShortcutOptions {
  enabled?: boolean
  scope?: ShortcutScope
}

export function useShortcut(
  id: ShortcutId,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, scope = 'page' }: UseShortcutOptions = {}
) {
  const { register } = useShortcutContext()
  const handlerRef = useRef(handler)

  useLayoutEffect(() => {
    handlerRef.current = handler
  })

  useEffect(() => {
    if (!enabled) return
    return register({ id, scope, run: (event) => handlerRef.current(event) })
  }, [register, id, scope, enabled])
}

export function useShortcutHelp() {
  const { helpOpen, setHelpOpen } = useShortcutContext()
  return { helpOpen, setHelpOpen }
}
