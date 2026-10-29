import { Toaster } from 'sonner'
import { useTheme } from '@/providers/theme-context'

export function AppToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster theme={resolvedTheme} richColors closeButton position='top-right' />
}
