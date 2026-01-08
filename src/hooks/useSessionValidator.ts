import { useEffect, useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Validates the current session and shows a modal if expired.
 * This hook should be used in protected layouts to handle mid-session JWT expiry.
 */
export const useSessionValidator = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  // Track if user was ever authenticated in this session
  const wasAuthenticated = useRef(false);

  const handleSessionExpired = useCallback(() => {
    // Only show modal if user was previously authenticated
    if (wasAuthenticated.current) {
      setShowExpiredModal(true);
    }
  }, []);

  const handleExpiredConfirm = useCallback(async () => {
    setShowExpiredModal(false);
    await signOut();
    navigate('/auth', { replace: true });
  }, [signOut, navigate]);

  const validateSession = useCallback(async () => {
    // Don't validate if auth is still loading or user was never authenticated
    if (loading || !wasAuthenticated.current) return true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn('Session expired or invalid');
        handleSessionExpired();
        return false;
      }

      // Check token expiration
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = expiresAt - now;
        
        // Token already expired
        if (timeToExpiry < 0) {
          console.warn('Token has expired');
          handleSessionExpired();
          return false;
        }
        
        // Proactive refresh: if token expires within 5 minutes (300 seconds)
        if (timeToExpiry > 0 && timeToExpiry < 300) {
          console.log('Token expiring soon, attempting refresh...');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.warn('Failed to refresh token:', refreshError);
            toast.warning('Oturumunuz yakında sona erecek. Lütfen sayfayı yenileyin.', {
              duration: 10000,
              description: 'Çalışmanızı kaybetmemek için kaydedin.'
            });
          } else {
            console.log('Token refreshed proactively');
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      return false;
    }
  }, [loading, handleSessionExpired]);

  useEffect(() => {
    // Track when user becomes authenticated
    if (user && !loading) {
      wasAuthenticated.current = true;
    }

    // Only start validation after auth is loaded and user is authenticated
    if (loading || !user) return;

    // Validate session after a small delay to ensure auth is stable
    const initialTimeout = setTimeout(validateSession, 1000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT' || (!session && wasAuthenticated.current)) {
          // User was signed out (possibly due to expired token)
          if (!showExpiredModal) {
            handleSessionExpired();
          }
        }
      }
    );

    // Periodic session check every 30 seconds
    const intervalId = setInterval(validateSession, 30000);

    return () => {
      clearTimeout(initialTimeout);
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [user, loading, validateSession, handleSessionExpired, showExpiredModal]);

  return { validateSession, showExpiredModal, handleExpiredConfirm };
};
