const baseURL = (
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
).replace(/\/$/, '');
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${baseURL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      'Could not connect to BugLife. Check that the server is running and try again.',
    );
  }
  const data = (await response.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  if (!response.ok)
    throw new ApiError(
      response.status,
      data?.error?.message || 'The request failed. Please try again.',
    );
  if (!data)
    throw new ApiError(
      response.status,
      'The server returned an unexpected response.',
    );
  return data as T;
}
