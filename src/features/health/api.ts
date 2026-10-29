import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { config } from '@/config/env'

export interface Health {
  db: 'up' | 'down'
  mqtt: 'up' | 'down' | 'disabled'
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<Health>('/health'),
    refetchInterval: config.refreshIntervalMs,
    retry: false,
    meta: { silent: true },
  })
}
