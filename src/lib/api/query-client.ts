import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { alerts } from '@/lib/alerts'
import { type ApiError, toApiError } from './errors'

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
    queryMeta: { silent?: boolean }
    mutationMeta: { silent?: boolean }
  }
}

const NO_RETRY = [400, 401, 403, 404, 409, 422]

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      refetchOnWindowFocus: true,
      retry: (count, error) => !NO_RETRY.includes(toApiError(error).status) && count < 2,
    },
    mutations: { retry: false },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.silent) return
      if (query.state.data !== undefined) return
      alerts.error(toApiError(error).message)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silent) return
      alerts.error(toApiError(error).message)
    },
  }),
})
