import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError, isCanceledError } from "@/lib/http"

// Set `meta: { suppressGlobalError: true }` on a query/mutation to handle its
// error locally instead of showing the global toast below.
declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: { suppressGlobalError?: boolean }
    mutationMeta: { suppressGlobalError?: boolean }
  }
}

function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong"
}

// Don't retry client errors (401/403/404/422 …) — they won't fix themselves.
// Retry network/5xx failures a couple of times.
function retry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 2
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressGlobalError || isCanceledError(error)) return
      toast.error(messageFor(error))
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (mutation.meta?.suppressGlobalError || isCanceledError(error)) return
      toast.error(messageFor(error))
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
    mutations: {
      retry: 0,
    },
  },
})
