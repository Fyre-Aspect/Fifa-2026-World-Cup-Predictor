/** Error carrying the HTTP status and a machine-readable code from the proxy. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(`API ${status}: ${code}`);
    this.name = 'ApiError';
  }
}

/**
 * Fetch JSON from our own /api proxy. Throws ApiError on non-2xx so callers
 * (and React Query) can branch to a fallback. The response shape is returned
 * as `unknown` on purpose — every caller must Zod-parse before use.
 */
export async function apiGet(path: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(path, {
    headers: { accept: 'application/json' },
    signal,
  });

  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const body = (await res.json()) as unknown;
      if (body && typeof body === 'object' && 'error' in body) {
        code = String((body as { error: unknown }).error);
      }
    } catch {
      // Non-JSON error body — keep the generic code.
    }
    throw new ApiError(res.status, code);
  }

  return res.json() as Promise<unknown>;
}
