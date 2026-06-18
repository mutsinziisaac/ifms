// Shared HTTP client for the real backend.
//
// One axios instance for the whole app. A request interceptor attaches the
// Keycloak access token (refreshed before expiry) to every outbound call; a
// response interceptor unwraps the backend's standard envelope and normalizes
// every failure into an `ApiError`. The mock layer in `src/data/api.ts` is
// migrated onto this one resource at a time — see the note there.
//
// Backend envelope (every response):
//   { header: { operation, request_uri, response_code, response_message,
//               additional_details },
//     data,                       // the actual payload
//     pagination?: { page_number, page_size, total_pages, total_records } }
//
// List endpoints accept kebab-case query params: `page-number`, `page-size`,
// `order-by`, and a repeatable `filter`.

import axios from "axios"
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios"

import { isKeycloakConfigured, keycloak } from "@/auth/keycloak"

// ---------------------------------------------------------------------------
// Envelope types
// ---------------------------------------------------------------------------

export interface ApiHeader {
  operation: string
  request_uri: string
  response_code: number
  response_message: string
  additional_details: string
}

export interface ApiPagination {
  page_number: number
  page_size: number
  total_pages: number
  total_records: number
}

export interface ApiEnvelope<T> {
  header: ApiHeader
  data: T
  pagination?: ApiPagination
}

/** Query params for paginated list endpoints. Extra keys pass through. */
export interface ListParams {
  "page-number"?: number
  "page-size"?: number
  "order-by"?: string
  filter?: string | string[]
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// ApiError — the single error type the app sees from this layer
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  /** HTTP status, the envelope's `response_code`, or 0 for network/cancel. */
  status: number
  /** Envelope `response_message` (e.g. "SUCCESS", "NOT_FOUND"), when present. */
  code?: string
  /** Envelope `additional_details`, when present. */
  details?: string

  constructor(
    message: string,
    opts: { status: number; code?: string; details?: string }
  ) {
    super(message)
    this.name = "ApiError"
    this.status = opts.status
    this.code = opts.code
    this.details = opts.details
  }
}

/** True for requests aborted by us (token refresh failed) or by React Query. */
export function isCanceledError(error: unknown): boolean {
  return (
    axios.isCancel(error) ||
    (error instanceof ApiError && error.code === "CANCELED")
  )
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || undefined,
  headers: { "Content-Type": "application/json" },
  // Repeat keys for array params (filter=a&filter=b) with no [] brackets, to
  // match the backend's URI style.
  paramsSerializer: { indexes: null },
})

// Request: refresh + attach the Keycloak token. In mock-auth mode (`keycloak`
// is null) we send no Authorization header — mirroring the app's graceful
// degradation when Keycloak/Maps keys are absent.
client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (isKeycloakConfigured && keycloak) {
    try {
      await keycloak.updateToken(30) // refresh if it expires within 30s
    } catch {
      keycloak.login() // refresh failed -> bounce through login
      throw new axios.CanceledError("auth-required")
    }
    if (keycloak.token) {
      config.headers.set("Authorization", `Bearer ${keycloak.token}`)
    }
  }
  const lang = localStorage.getItem("ifms.lang")
  if (lang) config.headers.set("Accept-Language", lang)
  return config
})

// Response: re-auth on 401, normalize every failure into an ApiError.
client.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      keycloak?.login()
    }
    return Promise.reject(toApiError(error))
  }
)

// ---------------------------------------------------------------------------
// Envelope handling
// ---------------------------------------------------------------------------

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return (
    typeof body === "object" &&
    body !== null &&
    "header" in body &&
    "data" in body
  )
}

/**
 * Coerce any 2xx body into an envelope. Throws `ApiError` when the envelope
 * reports an app-level failure (HTTP 200 with `response_code >= 400`). Bodies
 * that aren't enveloped (204 No Content, or a plain payload) are wrapped so
 * callers always get `{ data }`.
 */
function normalizeEnvelope<T>(body: unknown): ApiEnvelope<T> {
  if (isEnvelope(body)) {
    const code = body.header?.response_code
    if (typeof code === "number" && code >= 400) {
      throw new ApiError(body.header.response_message || "Request failed", {
        status: code,
        code: body.header.response_message,
        details: body.header.additional_details,
      })
    }
    return body as ApiEnvelope<T>
  }
  return {
    header: {
      operation: "",
      request_uri: "",
      response_code: 200,
      response_message: "SUCCESS",
      additional_details: "",
    },
    data: body as T,
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isCancel(error)) {
    return new ApiError("Request canceled", { status: 0, code: "CANCELED" })
  }
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data
    const header = isEnvelope(body) ? body.header : undefined
    const message =
      header?.response_message ||
      header?.additional_details ||
      error.message ||
      "Network error"
    return new ApiError(message, {
      status,
      code: header?.response_message,
      details: header?.additional_details,
    })
  }
  return new ApiError(error instanceof Error ? error.message : "Unknown error", {
    status: 0,
  })
}

async function call<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  const res = await client.request<unknown>(config)
  return normalizeEnvelope<T>(res.data)
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return (await call<T>(config)).data
}

// ---------------------------------------------------------------------------
// Public verb helpers (return the unwrapped `data`)
// ---------------------------------------------------------------------------

export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data: body }),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PUT", url, data: body }),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data: body }),
  del: <T = void>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url }),
}

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

/** Fetch a single page of a list endpoint, with its pagination metadata. */
export async function getPage<T>(
  url: string,
  params?: ListParams,
  config?: AxiosRequestConfig
): Promise<{ data: T[]; pagination?: ApiPagination }> {
  const env = await call<T[]>({ ...config, method: "GET", url, params })
  return { data: env.data ?? [], pagination: env.pagination }
}

const DEFAULT_PAGE_SIZE = 200

/**
 * Fetch every page and concatenate. Drop-in for the current "return the whole
 * collection" list functions, so migrating a list endpoint keeps the existing
 * `Promise<T[]>` contract that hooks and UI already expect.
 */
export async function getAll<T>(
  url: string,
  params?: ListParams,
  config?: AxiosRequestConfig
): Promise<T[]> {
  const pageSize = params?.["page-size"] ?? DEFAULT_PAGE_SIZE
  let pageNumber = params?.["page-number"] ?? 1
  const all: T[] = []
  for (;;) {
    const { data, pagination } = await getPage<T>(
      url,
      { ...params, "page-number": pageNumber, "page-size": pageSize },
      config
    )
    all.push(...data)
    if (
      !pagination ||
      data.length === 0 ||
      pagination.total_pages <= pageNumber
    ) {
      break
    }
    pageNumber++
  }
  return all
}
