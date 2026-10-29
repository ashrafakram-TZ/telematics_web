import { nowUnixSeconds } from '@/lib/format'

export function publishTopicError(topic: string): string | null {
  if (!topic) return 'Enter a topic'
  if (/[\r\n]/.test(topic))
    return 'The topic contains a hidden line break. Clear the box and type it again.'
  if (topic !== topic.trim()) return 'The topic starts or ends with a space'
  if (/[+#]/.test(topic)) {
    return 'Publish topics cannot contain + or #. Use the exact topic, for example telematics/860000000000001/telemetry'
  }
  return null
}

export function filterError(filter: string): string | null {
  if (!filter) return 'Enter a topic filter'
  if (/[\r\n]/.test(filter)) return 'The topic filter contains a hidden line break'
  const levels = filter.split('/')
  for (let index = 0; index < levels.length; index += 1) {
    const level = levels[index]
    if (level.includes('#') && (level !== '#' || index !== levels.length - 1)) {
      return '# must be the whole last level, for example telematics/#'
    }
    if (level.includes('+') && level !== '+') {
      return '+ must fill a whole level, for example telematics/+/telemetry'
    }
  }
  return null
}

export function topicMatches(filter: string, topic: string) {
  const filterLevels = filter.split('/')
  const topicLevels = topic.split('/')
  for (let index = 0; index < filterLevels.length; index += 1) {
    const level = filterLevels[index]
    if (level === '#') return true
    if (index >= topicLevels.length) return false
    if (level !== '+' && level !== topicLevels[index]) return false
  }
  return filterLevels.length === topicLevels.length
}

const PLACEHOLDERS: Record<string, () => string> = {
  $timestamp: () => String(nowUnixSeconds()),
  now: () => String(nowUnixSeconds()),
  $isoTimestamp: () => new Date().toISOString(),
}

export function resolvePayload(payload: string) {
  return payload.replace(/\{\{\s*(\$timestamp|now|\$isoTimestamp)\s*\}\}/g, (_, name: string) =>
    PLACEHOLDERS[name]()
  )
}

export function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}
