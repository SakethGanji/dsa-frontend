import { ReactNode, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStatus } from '../../hooks/use-auth';
import { Skeleton } from '../ui/skeleton';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isLoggedOut } = useAuthStatus();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If definitely not authenticated, redirect to login
    if (isLoggedOut) {
      navigate({ to: '/login' });
    }
  }, [isLoggedOut, navigate]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  
  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}