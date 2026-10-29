import axios, { type AxiosResponse } from 'axios'
import { config } from '@/config/env'
import { toApiError } from './errors'

export interface ApiEnvelope<T> {
  status: number
  message: string
  data: T
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>

export const http = axios.create({
  baseURL: config.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(toApiError(error))
)

const unwrap = <T>(response: AxiosResponse<ApiEnvelope<T>>) => response.data.data

const clean = (params?: QueryParams) =>
  params
    ? Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== undefined && value !== null && value !== ''
        )
      )
    : undefined

export const api = {
  get: <T>(url: string, params?: QueryParams) =>
    http.get<ApiEnvelope<T>>(url, { params: clean(params) }).then(unwrap),
  post: <T>(url: string, body?: unknown) => http.post<ApiEnvelope<T>>(url, body).then(unwrap),
  patch: <T>(url: string, body?: unknown) => http.patch<ApiEnvelope<T>>(url, body).then(unwrap),
  delete: <T>(url: string) => http.delete<ApiEnvelope<T>>(url).then(unwrap),
}
