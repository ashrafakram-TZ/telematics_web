import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Activity, ArrowRight, Plus, Server, Truck, Wifi, WifiOff } from 'lucide-react'
import { EmptyState, ErrorState, StatCard } from '@/components/common/display'
import { FleetMap, type MapPoint } from '@/components/common/fleet-map'
import { Page, PageHeader } from '@/components/common/page'
import { useSystemStatus } from '@/components/layout/use-system-status'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { config } from '@/config/env'
import { useNow } from '@/hooks/use-now'
import { formatDateTime, formatNumber, timeAgo } from '@/lib/format'
import { useDevices, type Device } from '@/features/devices/api'
import { DeviceFormModal } from '@/features/devices/components/device-form-modal'
import { DeviceStatusBadge } from '@/features/devices/components/device-status-badge'
import { DEVICE_STATUS, getDeviceStatus, type DeviceStatus } from '@/features/devices/status'
import { useLatestTelemetryMany, type Telemetry } from '@/features/telemetry/api'

interface Row {
  device: Device
  status: DeviceStatus
  latest: Telemetry | null
}

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const now = useNow(5_000)
  const system = useSystemStatus()
  const [createOpen, setCreateOpen] = useState(false)

  const devices = useDevices({ page: 1, limit: 100 }, { live: true })
  const list = useMemo(() => devices.data?.items ?? [], [devices.data])
  const tracked = useMemo(() => list.filter((device) => device.last_seen_at), [list])
  const latestList = useLatestTelemetryMany(tracked.map((device) => device.id))

  const latestById = useMemo(() => {
    const map = new Map<number, Telemetry>()
    latestList.forEach((reading, index) => {
      if (reading && tracked[index]) map.set(tracked[index].id, reading)
    })
    return map
  }, [latestList, tracked])

  const rows: Row[] = useMemo(
    () =>
      list.map((device) => ({
        device,
        status: getDeviceStatus(device, now),
        latest: latestById.get(device.id) ?? null,
      })),
    [list, latestById, now]
  )

  const counts = useMemo(
    () =>
      rows.reduce((total, row) => ({ ...total, [row.status]: total[row.status] + 1 }), {
        online: 0,
        offline: 0,
        never: 0,
        inactive: 0,
      } as Record<DeviceStatus, number>),
    [rows]
  )

  const points: MapPoint[] = useMemo(
    () =>
      rows
        .filter((row) => row.latest)
        .map((row) => ({
          id: row.device.id,
          lat: row.latest!.lat,
          lng: row.latest!.lng,
          label: row.device.name,
          sublabel: `${DEVICE_STATUS[row.status].label} · ${formatNumber(row.latest!.speed, 0, 'km/h')}`,
          color: DEVICE_STATUS[row.status].color,
        })),
    [rows]
  )

  const recent = useMemo(
    () =>
      [...rows]
        .filter((row) => row.device.last_seen_at)
        .sort(
          (a, b) =>
            new Date(b.device.last_seen_at!).getTime() - new Date(a.device.last_seen_at!).getTime()
        )
        .slice(0, 6),
    [rows]
  )

  const refresh = () => queryClient.invalidateQueries()
  const openDevice = (id: number) =>
    navigate({ to: '/devices/$deviceId', params: { deviceId: String(id) } })

  useShortcut('app.refresh', refresh)
  useShortcut('devices.create', () => setCreateOpen(true))

  const loading = devices.isPending
  const total = devices.data?.total ?? 0

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet overview'
        title='Dashboard'
        description={`Live view of every registered tracker. Updates every ${config.refreshIntervalMs / 1000} seconds.`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            Register device
            <Kbd id='devices.create' inverted />
          </Button>
        }
      />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          label='Registered devices'
          value={total}
          hint={`${total - counts.inactive} accepting telemetry`}
          icon={Truck}
          loading={loading}
        />
        <StatCard
          label='Online now'
          value={counts.online}
          hint={`Seen in the last ${config.onlineWindowMs / 60_000} minutes`}
          icon={Wifi}
          tone='success'
          loading={loading}
        />
        <StatCard
          label='Offline'
          value={counts.offline + counts.never}
          hint={`${counts.never} never reported`}
          icon={WifiOff}
          tone={counts.offline + counts.never > 0 ? 'warning' : 'neutral'}
          loading={loading}
        />
        <StatCard
          label='Backend'
          value={system.loading ? '…' : system.allUp ? 'Healthy' : 'Issue'}
          hint={`API ${system.api} · DB ${system.db} · MQTT ${system.mqtt}`}
          icon={Server}
          tone={system.loading ? 'neutral' : system.allUp ? 'success' : 'danger'}
        />
      </div>

      {devices.isError && !devices.data ? (
        <Card>
          <ErrorState message={devices.error.message} onRetry={() => devices.refetch()} />
        </Card>
      ) : (
        <>
          <div className='grid gap-6 xl:grid-cols-3'>
            <Card className='xl:col-span-2'>
              <CardHeader>
                <div className='grid gap-1'>
                  <CardTitle>Live positions</CardTitle>
                  <CardDescription>
                    Last known location of each tracker. Click a dot to open it.
                  </CardDescription>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {(['online', 'offline', 'inactive'] as const).map((status) => (
                    <Badge key={status} tone={DEVICE_STATUS[status].tone} dot>
                      {DEVICE_STATUS[status].label}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <FleetMap
                  points={points}
                  onSelect={openDevice}
                  className='h-80 sm:h-[420px]'
                  emptyText={
                    loading
                      ? 'Loading positions…'
                      : 'No positions yet. Publish a reading to see it here.'
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className='grid gap-1'>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='size-4 text-muted-foreground' />
                    Recent activity
                  </CardTitle>
                  <CardDescription>Devices that reported most recently</CardDescription>
                </div>
              </CardHeader>
              <CardContent className='pt-3'>
                {loading ? (
                  <div className='grid gap-2'>
                    {Array.from({ length: 4 }, (_, index) => (
                      <Skeleton key={index} className='h-14' />
                    ))}
                  </div>
                ) : recent.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title='No activity yet'
                    description='Readings appear here as soon as a registered device publishes.'
                    className='py-8'
                  />
                ) : (
                  <ul className='grid gap-1'>
                    {recent.map((row) => (
                      <li key={row.device.id}>
                        <Link
                          to='/devices/$deviceId'
                          params={{ deviceId: String(row.device.id) }}
                          className='flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40'
                        >
                          <span
                            className='size-2.5 shrink-0 rounded-full'
                            style={{ background: DEVICE_STATUS[row.status].color }}
                          />
                          <span className='grid min-w-0 flex-1 gap-0.5'>
                            <span className='truncate text-sm font-bold'>{row.device.name}</span>
                            <span className='truncate font-mono text-[11px] text-muted-foreground'>
                              {row.device.imei}
                            </span>
                          </span>
                          <span
                            className='text-xs whitespace-nowrap text-muted-foreground'
                            title={formatDateTime(row.device.last_seen_at)}
                          >
                            {timeAgo(row.device.last_seen_at, now)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className='overflow-hidden'>
            <CardHeader className='pb-4'>
              <div className='grid gap-1'>
                <CardTitle>Latest readings</CardTitle>
                <CardDescription>
                  The most recent message from every registered device
                </CardDescription>
              </div>
              <Button asChild variant='ghost' size='sm'>
                <Link to='/devices'>
                  All devices
                  <ArrowRight />
                </Link>
              </Button>
            </CardHeader>
            {loading ? (
              <div className='grid gap-2 p-4'>
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className='h-10' />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <EmptyState
                icon={Truck}
                title='No devices registered'
                description='Register a tracker, then publish to its MQTT topic.'
                action={
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus />
                    Register device
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className='hover:bg-transparent'>
                    <TableHead>Device</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Speed</TableHead>
                    <TableHead className='hidden sm:table-cell'>Ignition</TableHead>
                    <TableHead className='hidden text-right md:table-cell'>Fuel</TableHead>
                    <TableHead className='hidden lg:table-cell'>Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.device.id}
                      tabIndex={0}
                      className='cursor-pointer outline-none focus-visible:bg-accent/60'
                      onClick={() => openDevice(row.device.id)}
                      onKeyDown={(event) => event.key === 'Enter' && openDevice(row.device.id)}
                    >
                      <TableCell>
                        <div className='grid gap-0.5'>
                          <span className='font-bold'>{row.device.name}</span>
                          <span className='font-mono text-[11px] text-muted-foreground'>
                            {row.device.imei}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DeviceStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell className='tabular text-right'>
                        {formatNumber(row.latest?.speed, 0, 'km/h')}
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>
                        {row.latest?.ignition === undefined || row.latest?.ignition === null
                          ? '—'
                          : row.latest.ignition
                            ? 'On'
                            : 'Off'}
                      </TableCell>
                      <TableCell className='tabular hidden text-right md:table-cell'>
                        {formatNumber(row.latest?.fuel, 0, '%')}
                      </TableCell>
                      <TableCell className='hidden text-muted-foreground lg:table-cell'>
                        {row.latest ? formatDateTime(row.latest.recorded_at) : 'No readings yet'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <DeviceFormModal open={createOpen} onOpenChange={setCreateOpen} />
    </Page>
  )
}
