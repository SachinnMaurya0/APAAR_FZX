import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { User } from './types';

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api.get<User>('/auth/me')).data;
      } catch {
        return null; // not logged in (or API unreachable)
      }
    },
    retry: false,
    staleTime: 60_000,
  });

  async function login(email: string, password: string) {
    await api.post('/auth/login', { email, password });
    const me = (await api.get<User>('/auth/me')).data;
    qc.setQueryData(['me'], me);
    return me;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ queryKey: ['overview'] });
    }
  }

  return (
    <AuthContext.Provider value={{ user: data ?? null, loading: isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}