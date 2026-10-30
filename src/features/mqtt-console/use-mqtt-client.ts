import { useCallback, useEffect, useRef, useState } from 'react'
import mqtt, { type MqttClient } from 'mqtt'
import { filterError, publishTopicError } from './topic'

export type QoS = 0 | 1 | 2
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface MqttMessage {
  id: number
  direction: 'in' | 'out'
  topic: string
  payload: string
  qos: QoS
  retain: boolean
  at: number
  bytes: number
}

export interface Subscription {
  topic: string
  qos: QoS
  color: string
}

export interface LogEntry {
  id: number
  at: number
  level: 'info' | 'success' | 'error'
  text: string
}

export interface ConnectOptions {
  url: string
  clientId: string
  username?: string
  password?: string
}

const MAX_MESSAGES = 500
const MAX_LOG = 200
const COLORS = ['#22b46b', '#6b9cff', '#e9a23b', '#c084fc', '#f472b6', '#2dd4bf']
const encoder = new TextEncoder()

export function useMqttClient(initialSubscriptions: Omit<Subscription, 'color'>[] = []) {
  const clientRef = useRef<MqttClient | null>(null)
  const idRef = useRef(0)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    initialSubscriptions.map((subscription, index) => ({
      ...subscription,
      color: COLORS[index % COLORS.length],
    }))
  )
  const subscriptionsRef = useRef<Subscription[]>(subscriptions)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<MqttMessage[]>([])
  const [log, setLog] = useState<LogEntry[]>([])

  const nextId = useCallback(() => {
    idRef.current += 1
    return idRef.current
  }, [])

  const addLog = useCallback(
    (level: LogEntry['level'], text: string) =>
      setLog((entries) => [
        ...entries.slice(-(MAX_LOG - 1)),
        { id: nextId(), at: Date.now(), level, text },
      ]),
    [nextId]
  )

  const pushMessage = useCallback(
    (message: Omit<MqttMessage, 'id' | 'at' | 'bytes'>) =>
      setMessages((list) =>
        [
          {
            ...message,
            id: nextId(),
            at: Date.now(),
            bytes: encoder.encode(message.payload).length,
          },
          ...list,
        ].slice(0, MAX_MESSAGES)
      ),
    [nextId]
  )

  const setSubs = useCallback((next: Subscription[]) => {
    subscriptionsRef.current = next
    setSubscriptions(next)
  }, [])

  const sendSubscribe = useCallback(
    (client: MqttClient, subscription: Subscription) => {
      client.subscribe(subscription.topic, { qos: subscription.qos }, (error, granted) => {
        if (error)
          return addLog('error', `Subscribe to ${subscription.topic} failed: ${error.message}`)
        if (granted?.some((grant) => grant.qos === 128)) {
          return addLog('error', `The broker refused the subscription to ${subscription.topic}`)
        }
        addLog('success', `Subscribed to ${subscription.topic} (QoS ${subscription.qos})`)
      })
    },
    [addLog]
  )

  const connect = useCallback(
    (options: ConnectOptions) => {
      clientRef.current?.end(true)
      setStatus('connecting')
      addLog('info', `Connecting to ${options.url} as "${options.clientId}"`)

      const client = mqtt.connect(options.url, {
        clientId: options.clientId,
        username: options.username || undefined,
        password: options.password || undefined,
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 5000,
        keepalive: 60,
        reschedulePings: true,
      })
      clientRef.current = client
      const current = () => clientRef.current === client

      client.on('connect', () => {
        if (!current()) return
        setStatus('connected')
        addLog('success', 'Connected')
        subscriptionsRef.current.forEach((subscription) => sendSubscribe(client, subscription))
      })
      client.on('reconnect', () => {
        if (!current()) return
        setStatus('reconnecting')
        addLog('info', 'Reconnecting')
      })
      client.on('close', () => {
        if (!current()) return
        setStatus((value) => (value === 'connected' ? 'reconnecting' : value))
        addLog('info', 'Connection closed')
      })
      client.on('error', (error) => {
        if (!current()) return
        addLog('error', error.message)
      })
      client.on('message', (topic, payload, packet) => {
        if (!current()) return
        pushMessage({
          direction: 'in',
          topic,
          payload: payload.toString(),
          qos: packet.qos,
          retain: packet.retain,
        })
      })
    },
    [addLog, pushMessage, sendSubscribe]
  )

  const disconnect = useCallback(() => {
    const client = clientRef.current
    clientRef.current = null
    client?.end()
    setStatus('disconnected')
    addLog('info', 'Disconnected')
  }, [addLog])

  const subscribe = useCallback(
    (topic: string, qos: QoS) => {
      const error = filterError(topic)
      if (error) throw new Error(error)
      const existing = subscriptionsRef.current.find((item) => item.topic === topic)
      const subscription: Subscription = {
        topic,
        qos,
        color: existing?.color ?? COLORS[subscriptionsRef.current.length % COLORS.length],
      }
      setSubs(
        existing
          ? subscriptionsRef.current.map((item) => (item.topic === topic ? subscription : item))
          : [...subscriptionsRef.current, subscription]
      )
      const client = clientRef.current
      if (client?.connected) sendSubscribe(client, subscription)
    },
    [sendSubscribe, setSubs]
  )

  const unsubscribe = useCallback(
    (topic: string) => {
      setSubs(subscriptionsRef.current.filter((item) => item.topic !== topic))
      const client = clientRef.current
      if (client?.connected) {
        client.unsubscribe(topic, () => addLog('info', `Unsubscribed from ${topic}`))
      }
    },
    [addLog, setSubs]
  )

  const publish = useCallback(
    (topic: string, payload: string, options: { qos: QoS; retain: boolean }) =>
      new Promise<void>((resolve, reject) => {
        const error = publishTopicError(topic)
        if (error) return reject(new Error(error))
        const client = clientRef.current
        if (!client?.connected) return reject(new Error('Connect to the broker first'))
        client.publish(topic, payload, options, (publishError) => {
          if (publishError) {
            addLog('error', `Publish failed: ${publishError.message}`)
            return reject(publishError)
          }
          pushMessage({
            direction: 'out',
            topic,
            payload,
            qos: options.qos,
            retain: options.retain,
          })
          resolve()
        })
      }),
    [addLog, pushMessage]
  )

  const clearMessages = useCallback(() => setMessages([]), [])

  useEffect(
    () => () => {
      clientRef.current?.end(true)
      clientRef.current = null
    },
    []
  )

  return {
    status,
    messages,
    subscriptions,
    log,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    clearMessages,
  }
}

export type MqttClientApi = ReturnType<typeof useMqttClient>
