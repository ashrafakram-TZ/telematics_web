import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from '@tanstack/react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { queryClient } from '@/lib/api/query-client'
import { GeneralErrorPage, NotFoundPage } from '@/features/errors/error-pages'

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  errorComponent: GeneralErrorPage,
})

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
})

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: lazyRouteComponent(
    () => import('@/features/dashboard/pages/dashboard-page'),
    'DashboardPage'
  ),
})

const devicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/devices',
  component: lazyRouteComponent(
    () => import('@/features/devices/pages/devices-page'),
    'DevicesPage'
  ),
})

const deviceDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/devices/$deviceId',
  component: lazyRouteComponent(
    () => import('@/features/devices/pages/device-detail-page'),
    'DeviceDetailPage'
  ),
})

const consoleRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/console',
  component: lazyRouteComponent(
    () => import('@/features/mqtt-console/pages/mqtt-console-page'),
    'MqttConsolePage'
  ),
})

const routeTree = rootRoute.addChildren([
  appRoute.addChildren([dashboardRoute, devicesRoute, deviceDetailRoute, consoleRoute]),
])

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
