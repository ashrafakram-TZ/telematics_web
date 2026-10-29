import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Inbox, Pause, Play, Search, Trash2 } from 'lucide-react'
import { EmptyState } from '@/components/common/display'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useNow } from '@/hooks/use-now'
import { formatBytes, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { topicMatches } from '../topic'
import type { LogEntry, MqttMessage, Subscription } from '../use-mqtt-client'

type Filter = 'all' | 'in' | 'out'

const FILTERS = [
  { value: 'all' as Filter, label: 'All' },
  { value: 'in' as Filter, label: 'Received' },
  { value: 'out' as Filter, label: 'Sent' },
]

const SENT_COLOR = '#6b9cff'

interface MessageStreamProps {
  messages: MqttMessage[]
  allMessages: MqttMessage[]
  subscriptions: Subscription[]
  log: LogEntry[]
  selectedId: number | null
  onSelect: (message: MqttMessage) => void
  paused: boolean
  pendingCount: number
  onTogglePause: () => void
  onClear: () => void
}

export function MessageStream({
  messages,
  allMessages,
  subscriptions,
  log,
  selectedId,
  onSelect,
  paused,
  pendingCount,
  onTogglePause,
  onClear,
}: MessageStreamProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return messages.filter(
      (message) =>
        (filter === 'all' || message.direction === filter) &&
        (!text ||
          message.topic.toLowerCase().includes(text) ||
          message.payload.toLowerCase().includes(text))
    )
  }, [messages, filter, query])

  const colorFor = (message: MqttMessage) =>
    message.direction === 'out'
      ? SENT_COLOR
      : (subscriptions.find((subscription) => topicMatches(subscription.topic, message.topic))
          ?.color ?? 'var(--muted-foreground)')

  return (
    <Card className='flex min-h-[520px] flex-col overflow-hidden lg:h-[calc(100dvh-13rem)]'>
      <div className='flex flex-wrap items-center gap-2 border-b px-4 py-3'>
        <div className='relative min-w-40 flex-1'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Filter by topic or payload'
            aria-label='Filter messages'
            className='pl-9'
          />
        </div>
        <SegmentedControl
          label='Message direction'
          value={filter}
          onChange={setFilter}
          options={FILTERS}
        />
        <div className='flex gap-1'>
          <Button variant='ghost' size='sm' onClick={onTogglePause} aria-pressed={paused}>
            {paused ? <Play /> : <Pause />}
            {paused ? 'Resume' : 'Pause'}
            <Kbd id='console.pause' />
          </Button>
          <Button variant='ghost' size='sm' onClick={onClear} disabled={allMessages.length === 0}>
            <Trash2 />
            Clear
            <Kbd id='console.clear' />
          </Button>
        </div>
      </div>

      {paused && (
        <button
          type='button'
          onClick={onTogglePause}
          className='border-b bg-warning/10 px-4 py-2 text-left text-xs font-semibold text-warning'
        >
          Paused. {pendingCount} new {pendingCount === 1 ? 'message' : 'messages'} waiting. Click to
          resume.
        </button>
      )}

      <div className='flex-1 overflow-y-auto' role='log' aria-live='polite' aria-label='Messages'>
        {visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={messages.length ? 'No messages match this filter' : 'No messages yet'}
            description={
              messages.length
                ? 'Change the filter or clear the search.'
                : 'Connect, subscribe to a topic and publish a message to see it here.'
            }
          />
        ) : (
          <ul className='divide-y'>
            {visible.map((message) => (
              <li key={message.id}>
                <button
                  type='button'
                  onClick={() => onSelect(message)}
                  aria-current={message.id === selectedId}
                  className={cn(
                    'grid w-full grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 px-4 py-2.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-accent/60',
                    message.id === selectedId && 'bg-accent/70 hover:bg-accent/70'
                  )}
                >
                  <span className='row-span-2 pt-0.5'>
                    {message.direction === 'in' ? (
                      <ArrowDownLeft className='size-4 text-success' aria-label='Received' />
                    ) : (
                      <ArrowUpRight className='size-4 text-info' aria-label='Sent' />
                    )}
                  </span>
                  <span className='flex min-w-0 items-center gap-2'>
                    <span className='tabular font-mono text-[11px] text-muted-foreground'>
                      {formatTime(message.at)}.{String(message.at % 1000).padStart(3, '0')}
                    </span>
                    <span
                      className='truncate font-mono text-xs font-bold'
                      style={{ color: colorFor(message) }}
                    >
                      {message.topic}
                    </span>
                  </span>
                  <span className='rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground'>
                    Q{message.qos}
                    {message.retain && ' · R'}
                  </span>
                  <span className='col-span-2 truncate font-mono text-xs text-foreground/80'>
                    {message.payload || <em className='text-muted-foreground'>empty payload</em>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StreamFooter messages={allMessages} />

      <details className='group border-t'>
        <summary className='flex cursor-pointer list-none items-center justify-between px-4 py-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase select-none hover:text-foreground'>
          Connection log ({log.length})
          <span className='font-normal normal-case group-open:hidden'>Show</span>
          <span className='hidden font-normal normal-case group-open:inline'>Hide</span>
        </summary>
        <ol className='max-h-40 overflow-y-auto px-4 pb-3 font-mono text-[11px]'>
          {log.length === 0 && <li className='text-muted-foreground'>Nothing yet</li>}
          {log.map((entry) => (
            <li key={entry.id} className='flex gap-3 py-0.5'>
              <span className='tabular text-muted-foreground'>{formatTime(entry.at)}</span>
              <span
                className={cn(
                  entry.level === 'success' && 'text-success',
                  entry.level === 'error' && 'text-destructive'
                )}
              >
                {entry.text}
              </span>
            </li>
          ))}
        </ol>
      </details>
    </Card>
  )
}

function StreamFooter({ messages }: { messages: MqttMessage[] }) {
  const now = useNow(1000)
  const received = messages.filter((message) => message.direction === 'in')
  const sent = messages.length - received.length
  const bytes = received.reduce((total, message) => total + message.bytes, 0)
  const rate = messages.filter((message) => now - message.at <= 10_000).length / 10

  return (
    <div className='tabular flex flex-wrap gap-x-5 gap-y-1 border-t px-4 py-2 text-xs text-muted-foreground'>
      <span>
        Received <strong className='text-foreground'>{received.length}</strong>
      </span>
      <span>
        Sent <strong className='text-foreground'>{sent}</strong>
      </span>
      <span>
        In <strong className='text-foreground'>{formatBytes(bytes)}</strong>
      </span>
      <span>
        Rate <strong className='text-foreground'>{rate.toFixed(1)}</strong> msg/s
      </span>
    </div>
  )
}
