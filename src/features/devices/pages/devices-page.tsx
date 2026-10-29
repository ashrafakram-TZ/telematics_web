import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Pencil, Plus, RefreshCw, Search, Trash2, Truck } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/display'
import { Page, PageHeader } from '@/components/common/page'
import { Pagination } from '@/components/common/pagination'
import { useShortcut } from '@/components/shortcuts/shortcut-context'
import { Kbd } from '@/components/shortcuts/kbd'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDebouncedValue } from '@/hooks/use-debounce'
import { useNow } from '@/hooks/use-now'
import { formatDateTime, timeAgo } from '@/lib/format'
import { useDevices, type Device } from '../api'
import { DeleteDeviceDialog } from '../components/delete-device-dialog'
import { DeviceFormModal } from '../components/device-form-modal'
import { DeviceStatusBadge } from '../components/device-status-badge'
import { getDeviceStatus } from '../status'

const LIMIT = 20

export function DevicesPage() {
  const navigate = useNavigate()
  const now = useNow()
  const searchRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Device | null>(null)
  const [deleting, setDeleting] = useState<Device | null>(null)

  const devices = useDevices({ page, limit: LIMIT, search: debouncedSearch }, { live: true })
  const items = devices.data?.items ?? []

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (device: Device) => {
    setEditing(device)
    setFormOpen(true)
  }

  const openDevice = (device: Device) =>
    navigate({ to: '/devices/$deviceId', params: { deviceId: String(device.id) } })

  useShortcut('devices.create', openCreate)
  useShortcut('app.search', () => searchRef.current?.focus())
  useShortcut('app.refresh', () => devices.refetch())

  return (
    <Page>
      <PageHeader
        eyebrow='Fleet'
        title='Devices'
        description='Every tracker that is allowed to send telemetry. A device must be registered here before its messages are stored.'
        actions={
          <>
            <Button
              variant='outline'
              onClick={() => devices.refetch()}
              loading={devices.isFetching}
            >
              {!devices.isFetching && <RefreshCw />}
              Refresh
              <Kbd id='app.refresh' />
            </Button>
            <Button onClick={openCreate}>
              <Plus />
              Register device
              <Kbd id='devices.create' inverted />
            </Button>
          </>
        }
      />

      <Card className='overflow-hidden'>
        <div className='flex flex-wrap items-center gap-3 border-b px-4 py-3'>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              ref={searchRef}
              type='search'
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              onKeyDown={(event) => event.key === 'Escape' && event.currentTarget.blur()}
              placeholder='Search by name or IMEI'
              aria-label='Search devices'
              className='pr-10 pl-9'
            />
            <Kbd id='app.search' className='absolute top-1/2 right-2.5 -translate-y-1/2' />
          </div>
          <span className='tabular ml-auto text-xs text-muted-foreground'>
            {devices.data ? `${devices.data.total} registered` : ''}
          </span>
        </div>

        {devices.isError && !devices.data ? (
          <ErrorState message={devices.error.message} onRetry={() => devices.refetch()} />
        ) : devices.isPending ? (
          <div className='grid gap-2 p-4'>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className='h-12' />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Truck}
            title={debouncedSearch ? 'No devices match your search' : 'No devices yet'}
            description={
              debouncedSearch
                ? 'Try part of the name or IMEI.'
                : 'Register your first tracker to start receiving telemetry.'
            }
            action={
              !debouncedSearch && (
                <Button onClick={openCreate}>
                  <Plus />
                  Register device
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className='hover:bg-transparent'>
                  <TableHead>Device</TableHead>
                  <TableHead className='hidden sm:table-cell'>IMEI</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='hidden md:table-cell'>Last seen</TableHead>
                  <TableHead className='w-24 text-right'>
                    <span className='sr-only'>Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((device) => (
                  <TableRow
                    key={device.id}
                    tabIndex={0}
                    onClick={() => openDevice(device)}
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return
                      if (event.key === 'Enter') openDevice(device)
                      if (event.key === 'e') openEdit(device)
                      if (event.key === 'Delete') setDeleting(device)
                      if (event.key === 'ArrowDown' || event.key === 'j') {
                        event.preventDefault()
                        ;(event.currentTarget.nextElementSibling as HTMLElement | null)?.focus()
                      }
                      if (event.key === 'ArrowUp' || event.key === 'k') {
                        event.preventDefault()
                        ;(event.currentTarget.previousElementSibling as HTMLElement | null)?.focus()
                      }
                    }}
                    className='cursor-pointer outline-none focus-visible:bg-accent/60'
                  >
                    <TableCell>
                      <div className='grid gap-0.5'>
                        <span className='font-bold'>{device.name}</span>
                        <span className='text-xs text-muted-foreground'>
                          <span className='font-mono sm:hidden'>{device.imei} · </span>
                          {device.vehicle_no || 'No vehicle number'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className='hidden font-mono text-[13px] sm:table-cell'>
                      {device.imei}
                    </TableCell>
                    <TableCell>
                      <DeviceStatusBadge status={getDeviceStatus(device, now)} />
                    </TableCell>
                    <TableCell
                      className='hidden text-muted-foreground md:table-cell'
                      title={formatDateTime(device.last_seen_at)}
                    >
                      {timeAgo(device.last_seen_at, now)}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='inline-flex gap-1'>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={`Edit ${device.name}`}
                          title='Edit (E)'
                          onClick={(event) => {
                            event.stopPropagation()
                            openEdit(device)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={`Delete ${device.name}`}
                          title='Delete (Del)'
                          className='text-destructive hover:bg-destructive/10'
                          onClick={(event) => {
                            event.stopPropagation()
                            setDeleting(device)
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              limit={LIMIT}
              total={devices.data?.total ?? 0}
              onPageChange={setPage}
              label='devices'
            />
          </>
        )}
      </Card>

      <DeviceFormModal open={formOpen} onOpenChange={setFormOpen} device={editing} />
      <DeleteDeviceDialog device={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </Page>
  )
}
