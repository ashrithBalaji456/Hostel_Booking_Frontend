import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest, tokenStorage } from '../api/client';
import type { AuthResponse, UserRole, UserSummary } from '../types/api';

interface AuthContextValue {
  user: UserSummary | null;
  isAuthenticated: boolean;
  hasRole: (...roles: UserRole[]) => boolean;
  setSession: (auth: AuthResponse) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(() => tokenStorage.getUser<UserSummary>());

  const setSession = useCallback((auth: AuthResponse) => {
    tokenStorage.setSession(auth);
    setUser(auth.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Clear local session regardless of network outcome
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) return;
    try {
      const profile = await apiRequest<UserSummary>('/api/v1/users/me');
      setUser(profile);
      localStorage.setItem('spatial_stay_user', JSON.stringify(profile));
    } catch {
      // Handled by apiRequest 401 refresh flow
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.getAccessToken() && !user) {
      void refreshProfile();
    }
  }, [user, refreshProfile]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user && tokenStorage.getAccessToken()),
        hasRole,
        setSession,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
