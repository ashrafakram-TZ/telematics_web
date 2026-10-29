import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { SegmentedControl } from '@/components/common/segmented-control'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { alerts } from '@/lib/alerts'
import { filterError, topicMatches } from '../topic'
import type { MqttMessage, QoS, Subscription } from '../use-mqtt-client'

const QOS_OPTIONS = [
  { value: 0 as QoS, label: 'QoS 0' },
  { value: 1 as QoS, label: 'QoS 1' },
  { value: 2 as QoS, label: 'QoS 2' },
]

interface SubscriptionsPanelProps {
  subscriptions: Subscription[]
  messages: MqttMessage[]
  onSubscribe: (topic: string, qos: QoS) => void
  onUnsubscribe: (topic: string) => void
}

export function SubscriptionsPanel({
  subscriptions,
  messages,
  onSubscribe,
  onUnsubscribe,
}: SubscriptionsPanelProps) {
  const [topic, setTopic] = useState('')
  const [qos, setQos] = useState<QoS>(0)
  const [touched, setTouched] = useState(false)
  const error = touched ? filterError(topic) : null

  const counts = useMemo(
    () =>
      subscriptions.map(
        (subscription) =>
          messages.filter(
            (message) =>
              message.direction === 'in' && topicMatches(subscription.topic, message.topic)
          ).length
      ),
    [subscriptions, messages]
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <span className='tabular rounded-full bg-muted px-2 py-0.5 text-xs font-bold'>
          {subscriptions.length}
        </span>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <form
          className='grid gap-2'
          onSubmit={(event) => {
            event.preventDefault()
            setTouched(true)
            if (filterError(topic)) return
            try {
              onSubscribe(topic, qos)
              setTopic('')
              setTouched(false)
            } catch (subscribeError) {
              alerts.error((subscribeError as Error).message)
            }
          }}
        >
          <Input
            aria-label='Topic filter'
            placeholder='telematics/+/telemetry'
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className='font-mono text-xs'
            spellCheck={false}
            aria-invalid={Boolean(error)}
          />
          {error && <p className='text-xs font-medium text-destructive'>{error}</p>}
          <div className='flex items-center justify-between gap-2'>
            <SegmentedControl
              label='Subscription QoS'
              value={qos}
              onChange={setQos}
              options={QOS_OPTIONS}
            />
            <Button type='submit' variant='outline' size='sm'>
              Subscribe
            </Button>
          </div>
        </form>

        {subscriptions.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No subscriptions. Add one to receive messages.
          </p>
        ) : (
          <ul className='grid gap-1.5'>
            {subscriptions.map((subscription, index) => (
              <li
                key={subscription.topic}
                className='flex items-center gap-2 rounded-lg border bg-muted/30 py-1.5 pr-1.5 pl-2'
              >
                <span
                  className='h-6 w-1 shrink-0 rounded-full'
                  style={{ background: subscription.color }}
                />
                <span
                  className='min-w-0 flex-1 truncate font-mono text-xs'
                  title={subscription.topic}
                >
                  {subscription.topic}
                </span>
                <span className='tabular text-[11px] text-muted-foreground'>{counts[index]}</span>
                <span className='rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground'>
                  Q{subscription.qos}
                </span>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  className='size-7'
                  onClick={() => onUnsubscribe(subscription.topic)}
                  aria-label={`Unsubscribe from ${subscription.topic}`}
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
