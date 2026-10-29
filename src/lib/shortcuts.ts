import { isMac } from './utils'

export interface ShortcutStep {
  key: string
  mod: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
}

export function parseCombo(combo: string): ShortcutStep[] {
  return combo.split(' ').map((part) => {
    const tokens = part.split('+').map((token) => token.toLowerCase())
    const key = tokens.pop() ?? ''
    const modifiers = new Set(tokens)
    return {
      key,
      mod: modifiers.has('mod'),
      ctrl: modifiers.has('ctrl'),
      alt: modifiers.has('alt'),
      shift: modifiers.has('shift'),
      meta: modifiers.has('meta'),
    }
  })
}

export function eventKey(event: KeyboardEvent) {
  if (event.code.startsWith('Key')) return event.code.slice(3).toLowerCase()
  if (event.code.startsWith('Digit')) return event.code.slice(5)
  return event.key.toLowerCase()
}

export function matchesStep(event: KeyboardEvent, step: ShortcutStep) {
  const wantCtrl = step.ctrl || (step.mod && !isMac)
  const wantMeta = step.meta || (step.mod && isMac)
  if (event.ctrlKey !== wantCtrl || event.metaKey !== wantMeta || event.altKey !== step.alt) {
    return false
  }
  if (step.key === '?') return event.key === '?'
  if (event.shiftKey !== step.shift) return false
  return eventKey(event) === step.key
}

export function isPlainStep(step: ShortcutStep) {
  return !step.mod && !step.ctrl && !step.alt && !step.meta && !step.shift
}

export function isStrongStep(step: ShortcutStep) {
  return step.mod || step.ctrl || step.alt || step.meta || step.key === 'escape'
}

const KEY_LABELS: Record<string, string> = {
  enter: 'Enter',
  escape: 'Esc',
  delete: 'Del',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
}

export function comboKeys(combo: string): string[][] {
  return parseCombo(combo).map((step) => {
    const keys: string[] = []
    if (step.mod) keys.push(isMac ? '⌘' : 'Ctrl')
    if (step.ctrl) keys.push('Ctrl')
    if (step.alt) keys.push(isMac ? '⌥' : 'Alt')
    if (step.shift && step.key !== '?') keys.push('Shift')
    keys.push(KEY_LABELS[step.key] ?? step.key.toUpperCase())
    return keys
  })
}

export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}
