type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

const DEV_API_FETCH_TRACE_THRESHOLD = 30

/** Vite injects `import.meta.env` in SPA builds only; mechanics/server reuse this module plain in Node where `env` is absent. */
const devApiFetchPathCounts: Map<string, number> | null =
  import.meta.env?.DEV === true ? new Map() : null

function devTraceRepeatedApiPath(url: string): void {
  if (!devApiFetchPathCounts) return
  let pathKey: string
  try {
    pathKey = new URL(url, 'http://dev.local').pathname
  } catch {
    pathKey = url
  }
  const next = (devApiFetchPathCounts.get(pathKey) ?? 0) + 1
  devApiFetchPathCounts.set(pathKey, next)
  if (next === DEV_API_FETCH_TRACE_THRESHOLD) {
    console.warn(
      `[apiFetch] Same path hit ${DEV_API_FETCH_TRACE_THRESHOLD}+ times this session: ${pathKey}. Tracing further calls.`,
    )
  }
  if (next >= DEV_API_FETCH_TRACE_THRESHOLD) {
    console.trace(`[apiFetch] ${pathKey} #${next}`)
  }
}

export type ApiRequest<TBody = unknown> = {
  method?: ApiMethod
  body?: TBody
  headers?: HeadersInit
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number
  payload?: unknown

  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export async function apiFetch<TResponse, TBody = unknown>(
  url: string,
  options: ApiRequest<TBody> = {}
): Promise<TResponse> {
  devTraceRepeatedApiPath(url)
  const { method = 'GET', body, headers, signal } = options
  const res = await fetch(url, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  let payload: unknown = null
  try {
    payload = await res.json()
  } catch {
    // ignore JSON parse failure
  }

  if (!res.ok) {
    const message = (payload as { error?: string })?.error ?? 'Request failed'
    throw new ApiError(message, res.status, payload)
  }

  return payload as TResponse
}
