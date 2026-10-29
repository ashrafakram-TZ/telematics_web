import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AppModal } from '@/components/common/app-modal'
import { FormField } from '@/components/common/form-field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { alerts } from '@/lib/alerts'
import { toApiError } from '@/lib/api/errors'
import { useCreateDevice, useUpdateDevice, type Device } from '../api'

const FORM_ID = 'device-form'

const schema = z.object({
  imei: z
    .string()
    .trim()
    .regex(/^\d{15}$/, 'IMEI must be exactly 15 digits'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  vehicle_no: z.string().trim().max(20, 'Vehicle number must be 20 characters or less'),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface DeviceFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device?: Device | null
}

export function DeviceFormModal({ open, onOpenChange, device }: DeviceFormModalProps) {
  const create = useCreateDevice()
  const update = useUpdateDevice()
  const editing = Boolean(device)

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Edit device' : 'Register device'}
      description={
        editing
          ? 'Changes apply to new readings straight away.'
          : 'The tracker can send telemetry as soon as it is registered.'
      }
      formId={FORM_ID}
      submitText={editing ? 'Save changes' : 'Register device'}
      loading={create.isPending || update.isPending}
    >
      <DeviceForm
        device={device ?? null}
        onSubmit={async (input) => {
          if (device) {
            await update.mutateAsync({ id: device.id, input })
            alerts.success('Device updated')
          } else {
            await create.mutateAsync(input)
            alerts.success('Device registered', {
              description: `${input.name} can now publish to telematics/${input.imei}/telemetry`,
            })
          }
          onOpenChange(false)
        }}
      />
    </AppModal>
  )
}

interface DeviceFormProps {
  device: Device | null
  onSubmit: (input: {
    imei: string
    name: string
    vehicle_no: string | null
    is_active: boolean
  }) => Promise<void>
}

function DeviceForm({ device, onSubmit }: DeviceFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      imei: device?.imei ?? '',
      name: device?.name ?? '',
      vehicle_no: device?.vehicle_no ?? '',
      is_active: device?.is_active ?? true,
    },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit({ ...values, vehicle_no: values.vehicle_no || null })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 409 && /imei/i.test(apiError.message)) {
        setError('imei', { message: 'This IMEI is already registered' }, { shouldFocus: true })
      } else if (apiError.status === 400) {
        setError('root', { message: apiError.message })
      } else {
        alerts.error(apiError.message)
      }
    }
  })

  return (
    <form id={FORM_ID} onSubmit={submit} noValidate className='grid gap-4'>
      {errors.root?.message && (
        <p
          role='alert'
          className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive'
        >
          {errors.root.message}
        </p>
      )}
      <FormField
        id='imei'
        label='IMEI'
        required
        error={errors.imei?.message}
        hint='15 digits, printed on the tracker label'
      >
        <Input
          id='imei'
          inputMode='numeric'
          autoComplete='off'
          maxLength={15}
          placeholder='860000000000001'
          className='font-mono'
          autoFocus
          aria-invalid={Boolean(errors.imei)}
          {...register('imei')}
        />
      </FormField>
      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField id='name' label='Name' required error={errors.name?.message}>
          <Input
            id='name'
            placeholder='Truck 01'
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </FormField>
        <FormField id='vehicle_no' label='Vehicle number' error={errors.vehicle_no?.message}>
          <Input
            id='vehicle_no'
            placeholder='TN01AB1234'
            className='uppercase'
            aria-invalid={Boolean(errors.vehicle_no)}
            {...register('vehicle_no')}
          />
        </FormField>
      </div>
      <Controller
        control={control}
        name='is_active'
        render={({ field }) => (
          <div className='flex items-center justify-between gap-4 rounded-lg border bg-muted/40 px-4 py-3'>
            <div className='grid gap-0.5'>
              <label htmlFor='is_active' className='text-sm font-semibold'>
                Accept telemetry
              </label>
              <p className='text-xs text-muted-foreground'>
                Inactive devices are ignored when they publish.
              </p>
            </div>
            <Switch id='is_active' checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />
    </form>
  )
}
