import { useState } from 'react'
import { ChevronDown, Plug, RefreshCw, Unplug } from 'lucide-react'
import { FormField } from '@/components/common/form-field'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { config } from '@/config/env'
import { cn } from '@/lib/utils'
import type { ConnectOptions, ConnectionStatus } from '../use-mqtt-client'
import { ConnectionStatusBadge } from './connection-status-badge'

const STORAGE_KEY = 'tz-mqtt-connection'

const randomClientId = () => `tz-web-${Math.random().toString(36).slice(2, 8)}`

const readSaved = (): Partial<ConnectOptions> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<ConnectOptions>
  } catch {
    return {}
  }
}

const toBrowserUrl = (value: string) => {
  const match = /^(mqtts?|wss?):\/\/([^/:\s]+)(?::(\d+))?(\/\S*)?$/i.exec(value)
  if (!match) return null
  const [, scheme, host, , path] = match
  if (scheme.toLowerCase().startsWith('ws')) return value
  return `wss://${host}:8884${path ?? '/mqtt'}`.replace(/:8884\/?$/, ':8884/mqtt')
}

const saveConnection = ({ url, clientId, username }: Omit<ConnectOptions, 'password'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, clientId, username }))
    return true
  } catch {
    return false
  }
}

interface ConnectionPanelProps {
  status: ConnectionStatus
  onConnect: (options: ConnectOptions) => void
  onDisconnect: () => void
}

export function ConnectionPanel({ status, onConnect, onDisconnect }: ConnectionPanelProps) {
  const [saved] = useState(readSaved)
  const [url, setUrl] = useState(config.mqttUrl)
  const [clientId, setClientId] = useState(saved.clientId ?? randomClientId)
  const [username, setUsername] = useState(saved.username ?? '')
  const [password, setPassword] = useState('')
  const [showLogin, setShowLogin] = useState(Boolean(saved.username))
  const active = status !== 'disconnected'
  const browserUrl = toBrowserUrl(url.trim())
  const urlError = browserUrl
    ? undefined
    : 'Use a broker URL such as mqtt://broker.hivemq.com:1883 or wss://host:8884/mqtt'

  const toggle = () => {
    if (active) return onDisconnect()
    if (!browserUrl || !clientId.trim()) return
    saveConnection({ url: url.trim(), clientId: clientId.trim(), username: username.trim() })
    const options = {
      url: browserUrl,
      clientId: clientId.trim(),
      username: username.trim(),
      password,
    }
    onConnect(options)
  }

  useShortcut('console.connect', toggle)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection</CardTitle>
        <ConnectionStatusBadge status={status} />
      </CardHeader>
      <CardContent className='grid gap-4'>
        <form
          className='grid gap-4'
          onSubmit={(event) => {
            event.preventDefault()
            toggle()
          }}
        >
          <FormField
            id='mqtt-url'
            label='Broker URL'
            error={urlError}
            hint={
              <span className='grid gap-0.5'>
                {browserUrl && browserUrl !== url.trim() && (
                  <span>Browser connects to the same broker via {browserUrl}</span>
                )}
                <button
                  type='button'
                  className='w-fit font-semibold text-primary hover:underline disabled:opacity-50'
                  onClick={() => setUrl(config.mqttUrl)}
                  disabled={active}
                >
                  Use default ({config.mqttUrl})
                </button>
              </span>
            }
          >
            <Input
              id='mqtt-url'
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              disabled={active}
              className='font-mono text-xs'
              spellCheck={false}
              aria-invalid={Boolean(urlError)}
            />
          </FormField>

          <FormField id='mqtt-client-id' label='Client ID' hint='Must be unique on the broker'>
            <div className='flex gap-2'>
              <Input
                id='mqtt-client-id'
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                disabled={active}
                className='font-mono text-xs'
                spellCheck={false}
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => setClientId(randomClientId())}
                disabled={active}
                aria-label='Generate a new client ID'
                title='Generate a new client ID'
              >
                <RefreshCw />
              </Button>
            </div>
          </FormField>

          <div className='grid gap-3'>
            <button
              type='button'
              onClick={() => setShowLogin((value) => !value)}
              className='flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground'
              aria-expanded={showLogin}
            >
              <ChevronDown
                className={cn('size-3.5 transition-transform', showLogin && 'rotate-180')}
              />
              Login (only for private brokers)
            </button>
            {showLogin && (
              <div className='grid gap-3'>
                <Input
                  aria-label='Username'
                  placeholder='Username'
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={active}
                  autoComplete='off'
                />
                <Input
                  aria-label='Password'
                  type='password'
                  placeholder='Password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={active}
                  autoComplete='off'
                />
              </div>
            )}
          </div>

          <Button
            type='submit'
            variant={active ? 'outline' : 'default'}
            className={cn('w-full', active && 'text-destructive hover:bg-destructive/10')}
            disabled={!active && Boolean(urlError)}
          >
            {active ? <Unplug /> : <Plug />}
            {active ? 'Disconnect' : 'Connect'}
            <Kbd id='console.connect' inverted={!active} />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
