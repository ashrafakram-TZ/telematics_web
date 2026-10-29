import { FileJson } from 'lucide-react'
import { CopyButton, DetailList, EmptyState } from '@/components/common/display'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatBytes, formatDateTime, formatNumber } from '@/lib/format'
import { parseJson } from '../topic'
import type { MqttMessage } from '../use-mqtt-client'

interface TelemetryShape {
  ts?: unknown
  lat?: unknown
  lng?: unknown
  spd?: unknown
  hdg?: unknown
  ign?: unknown
  odo?: unknown
  fuel?: unknown
}

const asNumber = (value: unknown) => (typeof value === 'number' ? value : null)

export function MessageDetail({ message }: { message: MqttMessage | null }) {
  if (!message) {
    return (
      <Card>
        <EmptyState
          icon={FileJson}
          title='No message selected'
          description='Click a message in the stream to inspect it.'
          className='py-10'
        />
      </Card>
    )
  }

  const parsed = parseJson(message.payload)
  const pretty = parsed.ok ? JSON.stringify(parsed.value, null, 2) : message.payload
  const telemetry =
    parsed.ok && typeof parsed.value === 'object' && parsed.value !== null && 'ts' in parsed.value
      ? (parsed.value as TelemetryShape)
      : null
  const ts = asNumber(telemetry?.ts)

  return (
    <Card>
      <CardHeader>
        <div className='grid min-w-0 gap-1'>
          <CardTitle>Message</CardTitle>
          <span className='truncate font-mono text-xs text-muted-foreground' title={message.topic}>
            {message.topic}
          </span>
        </div>
        <Badge tone={message.direction === 'in' ? 'success' : 'info'}>
          {message.direction === 'in' ? 'Received' : 'Sent'}
        </Badge>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <div className='tabular flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
          <span>{formatDateTime(message.at)}</span>
          <span>QoS {message.qos}</span>
          <span>{message.retain ? 'Retained' : 'Not retained'}</span>
          <span>{formatBytes(message.bytes)}</span>
        </div>

        <div className='grid gap-2'>
          <div className='flex items-center justify-between'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Payload {parsed.ok ? '(JSON)' : '(text)'}
            </span>
            <CopyButton value={message.payload} />
          </div>
          <pre className='max-h-64 overflow-auto rounded-lg border bg-muted/50 p-3 font-mono text-xs leading-relaxed'>
            {pretty || ' '}
          </pre>
        </div>

        {telemetry && (
          <div className='grid gap-3 rounded-lg border p-3'>
            <span className='text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              Decoded telemetry
            </span>
            <DetailList
              items={[
                {
                  label: 'Device time',
                  value: ts ? formatDateTime(ts * 1000) : 'Invalid ts (needs Unix seconds)',
                },
                {
                  label: 'Position',
                  value:
                    asNumber(telemetry.lat) !== null && asNumber(telemetry.lng) !== null
                      ? `${telemetry.lat}, ${telemetry.lng}`
                      : '—',
                  mono: true,
                },
                { label: 'Speed', value: formatNumber(asNumber(telemetry.spd), 0, 'km/h') },
                {
                  label: 'Ignition',
                  value: telemetry.ign === 1 ? 'On' : telemetry.ign === 0 ? 'Off' : '—',
                },
                { label: 'Fuel', value: formatNumber(asNumber(telemetry.fuel), 0, '%') },
                { label: 'Odometer', value: formatNumber(asNumber(telemetry.odo), 1, 'km') },
              ]}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
