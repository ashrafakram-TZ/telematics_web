import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { AppToaster } from '@/components/layout/app-toaster'
import { ShortcutHelpDialog } from '@/components/shortcuts/shortcut-help-dialog'
import { ShortcutProvider } from '@/components/shortcuts/shortcut-provider'
import { queryClient } from '@/lib/api/query-client'
import { ThemeProvider } from '@/providers/theme-provider'
import { router } from './router'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ShortcutProvider>
          <RouterProvider router={router} />
          <ShortcutHelpDialog />
          <AppToaster />
        </ShortcutProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
)
