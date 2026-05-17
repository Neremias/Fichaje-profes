import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/lib/api';
import type { User, AuthTokens, LoginCredentials } from '@/types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    const access = localStorage.getItem('access_token');
    if (!access) {
      setIsLoading(false);
      return;
    }

    const cached = localStorage.getItem('user');
    if (cached) {
      try {
        setUser(JSON.parse(cached) as User);
      } catch {
        // ignore
      }
    }

    authApi
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
      })
      .catch(() => {
        logout();
      })
      .finally(() => setIsLoading(false));
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const tokens: AuthTokens = await authApi.login(credentials);
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    const me = await authApi.me();
    localStorage.setItem('user', JSON.stringify(me));
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
