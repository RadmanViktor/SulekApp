import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../config/apiConfig';

type AuthUser = {
  userId: number;
  email: string;
  name: string;
};

type AuthResponse = {
  token: string;
  userId: number;
  email: string;
  name: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: true } | { success: false; message: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: true } | { success: false; message: string }>;
  logout: () => Promise<void>;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const TOKEN_STORAGE_KEY = 'sulek_auth_token';
const apiBaseUrl = getApiBaseUrl();

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function withJsonHeaders(init?: RequestInit): Headers {
  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const persistSession = useCallback(async (auth: AuthResponse) => {
    setToken(auth.token);
    setUser({ userId: auth.userId, email: auth.email, name: auth.name });
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, auth.token);
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
  }, []);

  const loadCurrentUser = useCallback(async (nextToken: string) => {
    const response = await fetch(`${apiBaseUrl}/Auth/Me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${nextToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Session expired');
    }

    const me: AuthResponse = await response.json();
    setUser({ userId: me.userId, email: me.email, name: me.name });
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
        if (!storedToken) {
          return;
        }

        if (!active) {
          return;
        }

        setToken(storedToken);
        await loadCurrentUser(storedToken);
      } catch {
        if (!active) {
          return;
        }
        await logout();
      } finally {
        if (active) {
          setIsAuthLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [loadCurrentUser, logout]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/Auth/Login`, {
        method: 'POST',
        headers: withJsonHeaders(),
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        return {
          success: false as const,
          message: payload?.message ?? 'Kunde inte logga in.',
        };
      }

      const auth: AuthResponse = await response.json();
      await persistSession(auth);

      return { success: true as const };
    } catch {
      return {
        success: false as const,
        message: 'Nätverksfel. Kontrollera att API:t är igång.',
      };
    }
  }, [persistSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/Auth/Register`, {
        method: 'POST',
        headers: withJsonHeaders(),
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { message?: string } | null;
        return {
          success: false as const,
          message: payload?.message ?? 'Kunde inte skapa konto.',
        };
      }

      const auth: AuthResponse = await response.json();
      await persistSession(auth);

      return { success: true as const };
    } catch {
      return {
        success: false as const,
        message: 'Nätverksfel. Kontrollera att API:t är igång.',
      };
    }
  }, [persistSession]);

  const authFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers ?? {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (response.status === 401) {
      await logout();
    }

    return response;
  }, [logout, token]);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isAuthLoading,
    login,
    register,
    logout,
    authFetch,
  }), [authFetch, isAuthLoading, login, logout, register, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
