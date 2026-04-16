"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createAuthenticatedRequest,
  getCurrentAdmin,
  loginAdmin,
  logoutAdmin,
  type AuthFetchOptions,
} from "@/lib/auth/api";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "@/lib/auth/storage";
import type { AdminUser } from "@/lib/auth/types";

type AuthContextValue = {
  admin: AdminUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  request: <T>(path: string, init?: AuthFetchOptions) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const accessTokenRef = useRef<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setAdmin(null);
    clearRefreshToken();
  }, [setAccessToken]);

  const authenticatedRequest = useMemo(
    () =>
      createAuthenticatedRequest({
        getAccessToken: () => accessTokenRef.current,
        getRefreshToken,
        setAccessToken,
        clearSession,
      }),
    [clearSession, setAccessToken]
  );

  const refreshCurrentUser = useCallback(async () => {
    const currentAdmin = await getCurrentAdmin(authenticatedRequest);
    setAdmin(currentAdmin);
  }, [authenticatedRequest]);

  const bootstrapAuth = useCallback(async () => {
    try {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) {
        return;
      }

      // Trigger /me, which will auto-refresh on 401 and persist renewed access token in memory.
      await refreshCurrentUser();
    } catch {
      clearSession();
    } finally {
      setIsInitializing(false);
    }
  }, [clearSession, refreshCurrentUser]);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await loginAdmin(email, password);

      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setAdmin(response.admin);
    },
    [setAccessToken]
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutAdmin(refreshToken);
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      accessToken,
      isAuthenticated: Boolean(admin && accessToken),
      isInitializing,
      login,
      logout,
      refreshCurrentUser,
      request: authenticatedRequest,
    }),
    [accessToken, admin, isInitializing, login, logout, refreshCurrentUser, authenticatedRequest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
