import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Card } from './ui/Card';
import { Loader2 } from 'lucide-react';
import { useSlowRequest } from '../hooks/useSlowRequest';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading, getRoleRedirectPath } = useAuth();
  const isSlow = useSlowRequest(isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)]">
        <Card variant="raised" className="flex flex-col items-center gap-3 p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Yuklanmoqda...</p>
          {isSlow && (
            <p className="text-xs text-amber-500 font-medium text-center max-w-[200px]">
              ⏳ Server uyg'onmoqda, biroz kuting...
            </p>
          )}
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    const correctPath = getRoleRedirectPath(user.role);
    return <Navigate to={correctPath} replace />;
  }

  return <Outlet />;
};
