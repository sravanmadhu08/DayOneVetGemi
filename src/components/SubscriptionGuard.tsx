import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/hooks/useAuth';

export default function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, globalSettings, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  // Allow access if app is in free mode
  if (globalSettings?.isFreeMode) {
    return <>{children}</>;
  }

  // Allow access to admins
  if (profile?.isAdmin) {
    return <>{children}</>;
  }

  // Check if subscription is active
  const hasActiveSubscription = profile?.subscriptionUntil && profile.subscriptionUntil > Date.now();

  if (!hasActiveSubscription) {
    // Prevent infinite redirect
    if (location.pathname === '/subscribe' || location.pathname === '/profile') {
      return <>{children}</>;
    }
    return <Navigate to="/subscribe" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
