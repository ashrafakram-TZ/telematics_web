import { useHealth } from '@/features/health/api'

export type ServiceState = 'up' | 'down' | 'disabled' | 'unknown'

export function useSystemStatus() {
  const health = useHealth()
  const api: ServiceState = health.isError ? 'down' : health.data ? 'up' : 'unknown'
  const db: ServiceState = health.data?.db ?? (health.isError ? 'down' : 'unknown')
  const mqtt: ServiceState = health.data?.mqtt ?? (health.isError ? 'down' : 'unknown')
  const allUp = api === 'up' && db === 'up' && mqtt !== 'down'
  return { api, db, mqtt, allUp, loading: health.isPending }
}
