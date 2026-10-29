import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { alerts } from '@/lib/alerts'
import { useDeleteDevice, type Device } from '../api'

interface DeleteDeviceDialogProps {
  device: Device | null
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteDeviceDialog({ device, onOpenChange, onDeleted }: DeleteDeviceDialogProps) {
  const remove = useDeleteDevice()

  return (
    <ConfirmDialog
      open={Boolean(device)}
      onOpenChange={onOpenChange}
      title='Delete this device?'
      description={
        <>
          <strong className='text-foreground'>{device?.name}</strong> ({device?.imei}) will stop
          appearing in the fleet, and its new messages will be ignored. Its history is kept.
        </>
      }
      confirmText='Delete device'
      destructive
      loading={remove.isPending}
      onConfirm={() => {
        if (!device) return
        remove.mutate(device.id, {
          onSuccess: () => {
            alerts.success('Device deleted')
            onOpenChange(false)
            onDeleted?.()
          },
        })
      }}
    />
  )
}
