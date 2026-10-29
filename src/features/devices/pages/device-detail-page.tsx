import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  ArrowLeft,
  Compass,
  Fuel,
  Gauge,
  History,
  KeyRound,
  Pencil,
  RefreshCw,
  Route,
  SearchX,
  Trash2,
} from 'lucide-react'
import { DetailList, EmptyState, ErrorState } from '@/components/common/display'
import { FleetMap } from '@/components/common/fleet-map'
import { Page, PageHeader } from '@/components/common/page'
import { Pagination } from '@/components/common/pagination'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
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
import { useLatestTelemetry, useTelemetryHistory, type Telemetry } from '@/features/telemetry/api'
import { useDevice } from '../api'
import { DeleteDeviceDialog } from '../components/delete-device-dialog'
import { DeviceFormModal } from '../components/device-form-modal'
import { DeviceStatusBadge } from '../components/device-status-badge'
import { DEVICE_STATUS, getDeviceStatus } from '../status'

const LIMIT = 20

const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined)

export function DeviceDetailPage() {
  const { deviceId } = useParams({ strict: false })
  const id = Number(deviceId)
  const navigate = useNavigate()
  const now = useNow()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const device = useDevice(id)
  const latest = useLatestTelemetry(id)
  const history = useTelemetryHistory(id, { page, limit: LIMIT, from: toIso(from), to: toIso(to) })

  const refresh = () => {
    device.refetch()
    latest.refetch()
    history.refetch()
  }
  useShortcut('app.refresh', refresh)

  const status = device.data ? getDeviceStatus(device.data, now) : 'never'
  const points = useMemo(
    () =>
      device.data && latest.data
        ? [
            {
              id: device.data.id,
              lat: latest.data.lat,
              lng: latest.data.lng,
              label: device.data.name,
              sublabel: formatDateTime(latest.data.recorded_at),
              color: DEVICE_STATUS[status].color,
            },
          ]
        : [],
    [device.data, latest.data, status]
  )

  if (device.isError && !device.data) {
    return (
      <Page>
        <Card>
          {device.error.isNotFound ? (
            <EmptyState
              icon={SearchX}
              title='Device not found'
              description='It may have been deleted, or the link is wrong.'
              action={
                <Button asChild variant='outline'>
                  <Link to='/devices'>Back to devices</Link>
                </Button>
              }
            />
          ) : (
            <ErrorState message={device.error.message} onRetry={() => device.refetch()} />
          )}
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <Link
        to='/devices'
        className='inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' />
        Devices
      </Link>

      {device.isPending ? (
        <Skeleton className='h-14 w-72' />
      ) : (
        <PageHeader
          title={
            <span className='flex flex-wrap items-center gap-3'>
              {device.data.name}
              <DeviceStatusBadge status={status} />
            </span>
          }
          description={
            <>
              <span className='font-mono'>{device.data.imei}</span>
              {device.data.vehicle_no && <> · {device.data.vehicle_no}</>} · Last seen{' '}
              {timeAgo(device.data.last_seen_at, now).toLowerCase()}
            </>
          }
          actions={
            <>
              <Button variant='outline' onClick={refresh} aria-label='Refresh'>
                <RefreshCw />
                <span className='hidden sm:inline'>Refresh</span>
                <Kbd id='app.refresh' />
              </Button>
              <Button variant='outline' onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
              <Button
                variant='outline'
                className='text-destructive hover:bg-destructive/10'
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 />
                Delete
              </Button>
            </>
          }
        />
      )}

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='grid gap-1'>
              <CardTitle>Last known position</CardTitle>
              <CardDescription>
                {latest.data
                  ? `${latest.data.lat.toFixed(5)}, ${latest.data.lng.toFixed(5)}`
                  : 'Waiting for the first reading'}
              </CardDescription>
            </div>
            {latest.data && (
              <a
                className='text-xs font-semibold text-primary hover:underline'
                href={`https://www.google.com/maps?q=${latest.data.lat},${latest.data.lng}`}
                target='_blank'
                rel='noreferrer'
              >
                Open in Google Maps
              </a>
            )}
          </CardHeader>
          <CardContent>
            <FleetMap
              points={points}
              className='h-72 sm:h-80'
              emptyText='This device has not sent a position yet'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='grid gap-1'>
              <CardTitle>Latest reading</CardTitle>
              <CardDescription>
                {latest.data
                  ? `Recorded ${formatDateTime(latest.data.recorded_at)}`
                  : 'No readings yet'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {latest.isPending ? (
              <div className='grid grid-cols-2 gap-3'>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className='h-16' />
                ))}
              </div>
            ) : latest.data ? (
              <ReadingTiles reading={latest.data} />
            ) : (
              <p className='text-sm text-muted-foreground'>
                Publish to{' '}
                <code className='rounded bg-muted px-1 font-mono text-xs'>
                  telematics/{device.data?.imei ?? '{imei}'}/telemetry
                </code>{' '}
                and the reading appears here within {config.refreshIntervalMs / 1000} seconds.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {device.data && (
        <Card>
          <CardHeader>
            <CardTitle>Device details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              className='lg:grid-cols-4'
              items={[
                { label: 'IMEI', value: device.data.imei, mono: true },
                { label: 'Vehicle number', value: device.data.vehicle_no || '—' },
                { label: 'Registered', value: formatDateTime(device.data.created_at) },
                { label: 'Last seen', value: formatDateTime(device.data.last_seen_at) },
                {
                  label: 'MQTT topic',
                  value: `telematics/${device.data.imei}/telemetry`,
                  mono: true,
                },
                { label: 'Accepts telemetry', value: device.data.is_active ? 'Yes' : 'No' },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <Card className='overflow-hidden'>
        <CardHeader className='pb-4'>
          <div className='grid gap-1'>
            <CardTitle className='flex items-center gap-2'>
              <History className='size-4 text-muted-foreground' />
              Telemetry history
            </CardTitle>
            <CardDescription>Newest first. Times are shown in IST.</CardDescription>
          </div>
          <div className='flex flex-wrap items-end gap-3'>
            <div className='grid gap-1'>
              <Label htmlFor='from'>From</Label>
              <Input
                id='from'
                type='datetime-local'
                value={from}
                onChange={(event) => {
                  setFrom(event.target.value)
                  setPage(1)
                }}
                className='w-auto'
              />
            </div>
            <div className='grid gap-1'>
              <Label htmlFor='to'>To</Label>
              <Input
                id='to'
                type='datetime-local'
                value={to}
                onChange={(event) => {
                  setTo(event.target.value)
                  setPage(1)
                }}
                className='w-auto'
              />
            </div>
            {(from || to) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  setFrom('')
                  setTo('')
                  setPage(1)
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        {history.isError && !history.data ? (
          <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
        ) : history.isPending ? (
          <div className='grid gap-2 p-4'>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className='h-10' />
            ))}
          </div>
        ) : history.data.items.length === 0 ? (
          <EmptyState
            icon={Route}
            title={from || to ? 'No readings in this time range' : 'No readings yet'}
            description={from || to ? 'Widen or clear the time range.' : undefined}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead>Recorded</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead className='text-right'>Speed</TableHead>
                  <TableHead>Ignition</TableHead>
                  <TableHead className='hidden text-right sm:table-cell'>Fuel</TableHead>
                  <TableHead className='hidden text-right md:table-cell'>Odometer</TableHead>
                  <TableHead className='hidden text-right lg:table-cell'>Heading</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className='tabular whitespace-nowrap'>
                      {formatDateTime(row.recorded_at)}
                    </TableCell>
                    <TableCell className='font-mono text-xs whitespace-nowrap'>
                      {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
                    </TableCell>
                    <TableCell className='tabular text-right'>
                      {formatNumber(row.speed, 0, 'km/h')}
                    </TableCell>
                    <TableCell>
                      <IgnitionBadge value={row.ignition} />
                    </TableCell>
                    <TableCell className='tabular hidden text-right sm:table-cell'>
                      {formatNumber(row.fuel, 0, '%')}
                    </TableCell>
                    <TableCell className='tabular hidden text-right md:table-cell'>
                      {formatNumber(row.odometer, 1, 'km')}
                    </TableCell>
                    <TableCell className='tabular hidden text-right lg:table-cell'>
                      {formatNumber(row.heading, 0, '°')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              limit={LIMIT}
              total={history.data.total}
              onPageChange={setPage}
              label='readings'
            />
          </>
        )}
      </Card>

      {device.data && (
        <>
          <DeviceFormModal open={editOpen} onOpenChange={setEditOpen} device={device.data} />
          <DeleteDeviceDialog
            device={deleteOpen ? device.data : null}
            onOpenChange={setDeleteOpen}
            onDeleted={() => navigate({ to: '/devices' })}
          />
        </>
      )}
    </Page>
  )
}

function IgnitionBadge({ value }: { value: boolean | null }) {
  if (value === null) return <span className='text-muted-foreground'>—</span>
  return (
    <Badge tone={value ? 'success' : 'neutral'} dot>
      {value ? 'On' : 'Off'}
    </Badge>
  )
}

function ReadingTiles({ reading }: { reading: Telemetry }) {
  const tiles = [
    { label: 'Speed', value: formatNumber(reading.speed, 0, 'km/h'), icon: Gauge },
    {
      label: 'Ignition',
      value: reading.ignition === null ? '—' : reading.ignition ? 'On' : 'Off',
      icon: KeyRound,
    },
    { label: 'Fuel', value: formatNumber(reading.fuel, 0, '%'), icon: Fuel },
    { label: 'Heading', value: formatNumber(reading.heading, 0, '°'), icon: Compass },
  ]

  return (
    <div className='grid gap-3'>
      <div className='grid grid-cols-2 gap-3'>
        {tiles.map((tile) => (
          <div key={tile.label} className='grid gap-1 rounded-lg border bg-muted/40 p-3'>
            <span className='flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase'>
              <tile.icon className='size-3.5' />
              {tile.label}
            </span>
            <span className='tabular text-lg font-extrabold'>{tile.value}</span>
          </div>
        ))}
      </div>
      <div className='flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm'>
        <span className='text-muted-foreground'>Odometer</span>
        <span className='tabular font-bold'>{formatNumber(reading.odometer, 1, 'km')}</span>
      </div>
    </div>
  )
}
