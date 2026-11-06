import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => void;
  getRoleRedirectPath: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const getRoleRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'MANAGER':
      return '/manager';
    case 'TEACHER':
      return '/teacher';
    default:
      return '/login';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('renesens_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('renesens_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('renesens_token');
      if (savedToken) {
        try {
          const currentUser = await api.get<User>('/auth/me');
          setUser(currentUser);
          localStorage.setItem('renesens_user', JSON.stringify(currentUser));
        } catch (error) {
          console.error('Sessiyani tasdiqlashda xatolik:', error);
          localStorage.removeItem('renesens_token');
          localStorage.removeItem('renesens_user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    verifyUser();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('renesens_token', newToken);
    localStorage.setItem('renesens_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('renesens_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = () => {
    localStorage.removeItem('renesens_token');
    localStorage.removeItem('renesens_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        updateUser,
        logout,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth AuthProvider ichida ishlatilishi shart');
  }
  return context;
};
