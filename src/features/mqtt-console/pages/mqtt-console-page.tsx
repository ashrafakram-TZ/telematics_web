import { useMemo, useState } from 'react'
import { Page, PageHeader } from '@/components/common/page'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { config } from '@/config/env'
import { ConnectionPanel } from '../components/connection-panel'
import { ConnectionStatusBadge } from '../components/connection-status-badge'
import { MessageDetail } from '../components/message-detail'
import { MessageStream } from '../components/message-stream'
import { PublishPanel } from '../components/publish-panel'
import { SubscriptionsPanel } from '../components/subscriptions-panel'
import { useMqttClient, type MqttMessage } from '../use-mqtt-client'

const INITIAL_SUBSCRIPTIONS = [{ topic: config.mqttTopicFilter, qos: 0 as const }]

export function MqttConsolePage() {
  const mqtt = useMqttClient(INITIAL_SUBSCRIPTIONS)
  const [selected, setSelected] = useState<MqttMessage | null>(null)
  const [snapshot, setSnapshot] = useState<MqttMessage[] | null>(null)

  const shown = snapshot ?? mqtt.messages
  const pendingCount = useMemo(() => {
    if (!snapshot) return 0
    const newest = snapshot[0]?.id ?? 0
    return mqtt.messages.filter((message) => message.id > newest).length
  }, [snapshot, mqtt.messages])

  const togglePause = () => setSnapshot((value) => (value ? null : mqtt.messages))
  const clear = () => {
    mqtt.clearMessages()
    setSnapshot((value) => (value ? [] : null))
    setSelected(null)
  }

  useShortcut('console.pause', togglePause)
  useShortcut('console.clear', clear)

  return (
    <Page className='max-w-[1800px]'>
      <PageHeader
        eyebrow='Tools'
        title='MQTT console'
        description='Act as a device: publish readings to the broker and watch every message it delivers. Uses the broker over WebSocket, the same broker the API listens to.'
        actions={<ConnectionStatusBadge status={mqtt.status} />}
      />

      <div className='grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_360px]'>
        <div className='grid gap-6'>
          <ConnectionPanel
            status={mqtt.status}
            onConnect={mqtt.connect}
            onDisconnect={mqtt.disconnect}
          />
          <SubscriptionsPanel
            subscriptions={mqtt.subscriptions}
            messages={mqtt.messages}
            onSubscribe={mqtt.subscribe}
            onUnsubscribe={mqtt.unsubscribe}
          />
        </div>

        <MessageStream
          messages={shown}
          allMessages={mqtt.messages}
          subscriptions={mqtt.subscriptions}
          log={mqtt.log}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          paused={snapshot !== null}
          pendingCount={pendingCount}
          onTogglePause={togglePause}
          onClear={clear}
        />

        <div className='grid gap-6 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:grid-cols-1'>
          <PublishPanel status={mqtt.status} onPublish={mqtt.publish} />
          <MessageDetail message={selected} />
        </div>
      </div>
    </Page>
  )
}
