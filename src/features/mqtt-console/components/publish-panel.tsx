import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Send, TriangleAlert, Wand2 } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { SegmentedControl } from '@/components/common/segmented-control'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { parseJson, publishTopicError, resolvePayload } from '../topic'
import type { ConnectionStatus, QoS } from '../use-mqtt-client'

const DEFAULT_TOPIC = 'telematics/860000000000001/telemetry'
const TELEMETRY_TEMPLATE =
  '{ "ts": {{$timestamp}}, "lat": 13.0827, "lng": 80.2707, "spd": 42, "hdg": 180, "ign": 1, "odo": 12345.6, "fuel": 56 }'

const QOS_OPTIONS = [
  { value: 0 as QoS, label: 'QoS 0' },
  { value: 1 as QoS, label: 'QoS 1' },
  { value: 2 as QoS, label: 'QoS 2' },
]

interface PublishPanelProps {
  status: ConnectionStatus
  onPublish: (
    topic: string,
    payload: string,
    options: { qos: QoS; retain: boolean }
  ) => Promise<void>
}

export function PublishPanel({ status, onPublish }: PublishPanelProps) {
  const [topic, setTopic] = useState(DEFAULT_TOPIC)
  const [payload, setPayload] = useState(TELEMETRY_TEMPLATE)
  const [qos, setQos] = useState<QoS>(0)
  const [retain, setRetain] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [seconds, setSeconds] = useState(5)
  const [sending, setSending] = useState(false)
  const connected = status === 'connected'

  const topicError = publishTopicError(topic)
  const resolved = resolvePayload(payload)
  const looksJson = /^\s*[[{]/.test(resolved)
  const jsonValid = !looksJson || parseJson(resolved).ok

  const publish = async () => {
    if (!connected) return alerts.warning('Connect to the broker first')
    if (topicError) {
      setRepeat(false)
      return alerts.error(topicError)
    }
    setSending(true)
    try {
      await onPublish(topic, resolvePayload(payload), { qos, retain })
    } catch (error) {
      setRepeat(false)
      alerts.error((error as Error).message)
    } finally {
      setSending(false)
    }
  }

  const publishRef = useRef(publish)
  useLayoutEffect(() => {
    publishRef.current = publish
  })

  useEffect(() => {
    if (!repeat || !connected) return
    const timer = window.setInterval(() => publishRef.current(), Math.max(1, seconds) * 1000)
    return () => window.clearInterval(timer)
  }, [repeat, connected, seconds])

  useShortcut('console.publish', () => publishRef.current())

  const formatJson = () => {
    const placeholder = '"__TZ_TS__"'
    const swapped = payload.replace(/\{\{\s*\$timestamp\s*\}\}/g, placeholder)
    const parsed = parseJson(swapped)
    if (!parsed.ok) return alerts.error('The payload is not valid JSON')
    setPayload(JSON.stringify(parsed.value, null, 2).replaceAll(placeholder, '{{$timestamp}}'))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Send className='size-4 text-muted-foreground' />
          Publish
        </CardTitle>
        <Button variant='ghost' size='sm' onClick={() => setPayload(TELEMETRY_TEMPLATE)}>
          Telemetry template
        </Button>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <FormField id='publish-topic' label='Topic' error={topicError ?? undefined}>
          <Input
            id='publish-topic'
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className='font-mono text-xs'
            spellCheck={false}
            aria-invalid={Boolean(topicError)}
          />
        </FormField>

        <FormField
          id='publish-payload'
          label='Payload'
          hint={
            <>
              <code className='font-mono'>{'{{$timestamp}}'}</code> becomes the current Unix time
              when sent.
            </>
          }
        >
          <Textarea
            id='publish-payload'
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            rows={7}
            className='font-mono text-xs'
            spellCheck={false}
          />
        </FormField>
        <div className='-mt-2 flex items-center justify-between gap-2'>
          {jsonValid ? (
            <span className='text-xs text-muted-foreground'>
              {looksJson ? 'Valid JSON' : 'Plain text'}
            </span>
          ) : (
            <span className='flex items-center gap-1 text-xs font-medium text-warning'>
              <TriangleAlert className='size-3.5' />
              Not valid JSON. The API will reject it.
            </span>
          )}
          <Button variant='ghost' size='sm' onClick={formatJson}>
            <Wand2 />
            Format
          </Button>
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <SegmentedControl
            label='Publish QoS'
            value={qos}
            onChange={setQos}
            options={QOS_OPTIONS}
          />
          <label className='flex items-center gap-2 text-xs font-semibold'>
            <Switch checked={retain} onCheckedChange={setRetain} aria-label='Retain' />
            Retain
          </label>
        </div>

        <div className='flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2'>
          <Switch
            checked={repeat}
            onCheckedChange={setRepeat}
            aria-label='Repeat'
            disabled={!connected}
          />
          <span className='text-xs font-semibold'>Repeat every</span>
          <Input
            type='number'
            min={1}
            max={3600}
            value={seconds}
            onChange={(event) => setSeconds(Math.max(1, Number(event.target.value) || 1))}
            className='h-8 w-16 text-center'
            aria-label='Seconds between messages'
          />
          <span className='text-xs text-muted-foreground'>s</span>
        </div>

        <Button onClick={publish} disabled={!connected} loading={sending} className='w-full'>
          {!sending && <Send />}
          {connected ? 'Publish' : 'Connect first'}
          {connected && <Kbd id='console.publish' inverted />}
        </Button>
      </CardContent>
    </Card>
  )
}
