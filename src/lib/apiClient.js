export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const NETWORK_ERROR =
  'No hay conexión con el servidor. En local ejecuta npm run dev:full (API + Vite).';

export async function apiFetch(path, options = {}) {
  const hasBody = options.body !== undefined;
  let response;

  try {
    response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || 'Error del servidor.', response.status, data);
  }
  return data;
}

export function toResultError(error) {
  return {
    success: false,
    error: error?.message || 'No se pudo completar la operación.',
    reason: error?.data?.reason,
    maxAllowed: error?.data?.maxAllowed,
  };
}
