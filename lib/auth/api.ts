import type { AdminUser, LoginResponse, RefreshResponse } from "./types";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export type AuthFetchOptions = RequestInit & {
  skipAuthRetry?: boolean;
};

type AuthFetchDeps = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  clearSession: () => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

let refreshPromise: Promise<string | null> | null = null;

function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function safeParseJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return (await response.json()) as T;
}

function parseErrorMessage(payload: ApiErrorPayload | null, fallback: string): string {
  if (!payload) {
    return fallback;
  }

  return payload.message ?? payload.error ?? payload.detail ?? fallback;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await safeParseJson<T | ApiErrorPayload>(response);
  if (!response.ok) {
    throw new ApiError(response.status, parseErrorMessage(data as ApiErrorPayload | null, "Request failed"));
  }

  return data as T;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const response = await apiRequest<RefreshResponse>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  return response.access_token;
}

export function createAuthenticatedRequest(deps: AuthFetchDeps) {
  return async function authenticatedRequest<T>(path: string, init?: AuthFetchOptions): Promise<T> {
    const accessToken = deps.getAccessToken();
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetch(buildUrl(path), {
      ...init,
      headers,
    });

    if (response.status === 401 && !init?.skipAuthRetry) {
      const storedRefreshToken = deps.getRefreshToken();
      if (!storedRefreshToken) {
        deps.clearSession();
        throw new ApiError(401, "Session expired. Please login again.");
      }

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken(storedRefreshToken)
          .then((token) => {
            deps.setAccessToken(token);
            return token;
          })
          .catch(() => {
            deps.clearSession();
            return null;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const renewedAccessToken = await refreshPromise;
      if (!renewedAccessToken) {
        throw new ApiError(401, "Session expired. Please login again.");
      }

      return authenticatedRequest<T>(path, {
        ...init,
        skipAuthRetry: true,
      });
    }

    const data = await safeParseJson<T | ApiErrorPayload>(response);
    if (!response.ok) {
      throw new ApiError(response.status, parseErrorMessage(data as ApiErrorPayload | null, "Request failed"));
    }

    return data as T;
  };
}

export function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>("/api/v1/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentAdmin(request: <T>(path: string, init?: AuthFetchOptions) => Promise<T>) {
  return request<AdminUser>("/api/v1/auth/me", {
    method: "GET",
  });
}

export function logoutAdmin(refreshToken: string): Promise<void> {
  return apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}
