import { useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, type SessionUser } from '@/services';

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, ready: false });
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;
    api.getUser().then((user) => alive && setState({ user, ready: true }));
    const off = api.onAuthChange((user) => {
      setState({ user, ready: true });
      qc.clear(); // different user, different data
    });
    return () => {
      alive = false;
      off();
    };
  }, [qc]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
