import type { ApiResponse, AuthResponse } from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiClientError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errorCode = errorCode;
  }
}

const ACCESS_TOKEN_KEY = 'spatial_stay_access_token';
const REFRESH_TOKEN_KEY = 'spatial_stay_refresh_token';
const USER_KEY = 'spatial_stay_user';

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setSession: (auth: AuthResponse) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, auth.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  },
  getUser: <T>() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          tokenStorage.clear();
          return null;
        }
        const json = (await res.json()) as ApiResponse<AuthResponse>;
        tokenStorage.setSession(json.data);
        return json.data.accessToken;
      } catch {
        tokenStorage.clear();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, headers, ...rest } = options;
  const reqHeaders = new Headers(headers);

  if (!reqHeaders.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    reqHeaders.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.getAccessToken();
  if (!skipAuth && token) {
    reqHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: reqHeaders,
    });
  } catch {
    throw new ApiClientError('Network error. Please check your connection.', 0, 'NETWORK_ERROR');
  }

  if (response.status === 401 && !skipAuth && tokenStorage.getRefreshToken()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      reqHeaders.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers: reqHeaders,
      });
    }
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || (payload && !payload.success)) {
    const message = payload?.message ?? `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, payload?.errorCode);
  }

  return (payload ? payload.data : undefined) as T;
}

export function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => sp.append(k, String(item)));
    } else {
      sp.append(k, String(v));
    }
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}
