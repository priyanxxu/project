import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.getMe()
      .then(result => setCurrentUser(result.data.user))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async credentials => {
    const result = await authAPI.login(credentials);
    setCurrentUser(result.data.user);
    return result.data.user;
  };

  const register = async details => {
    const result = await authAPI.register(details);
    setCurrentUser(result.data.user);
    return result.data.user;
  };

  const getCurrentUser = useCallback(async () => {
    const result = await authAPI.getMe();
    setCurrentUser(result.data.user);
    return result.data.user;
  }, []);

  const logout = async () => {
    await authAPI.logout();
    setCurrentUser(null);
  };

  const value = useMemo(() => ({ currentUser, loading, login, register, logout, getCurrentUser, isAuthenticated: Boolean(currentUser) }), [currentUser, loading, getCurrentUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
