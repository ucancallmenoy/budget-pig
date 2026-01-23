class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchApi<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...init } = options;

  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams(params);
    finalUrl = `${url}?${searchParams.toString()}`;
  }

  const response = await fetch(finalUrl, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || 'An error occurred',
      errorData
    );
  }

  return response.json();
}

export const api = {
  get: <T>(url: string, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: 'GET' }),

  post: <T>(url: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(url: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(url: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(url: string, options?: FetchOptions) =>
    fetchApi<T>(url, { ...options, method: 'DELETE' }),
};

export { ApiError };