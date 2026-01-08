import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Validates the current session and shows a modal if expired.
 * This hook should be used in protected layouts to handle mid-session JWT expiry.
 */
export const useSessionValidator = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const handleSessionExpired = useCallback(async () => {
    setShowExpiredModal(true);
  }, []);

  const handleExpiredConfirm = useCallback(async () => {
    setShowExpiredModal(false);
    await signOut();
    navigate('/auth', { replace: true });
  }, [signOut, navigate]);

  const validateSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn('Session expired or invalid');
        await handleSessionExpired();
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
          await handleSessionExpired();
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
  }, [user, handleSessionExpired]);

  useEffect(() => {
    // Validate session on mount
    validateSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        } else if (event === 'SIGNED_OUT' || !session) {
          // User was signed out (possibly due to expired token)
          if (user && !showExpiredModal) {
            await handleSessionExpired();
          }
        }
      }
    );

    // Periodic session check every 30 seconds
    const intervalId = setInterval(validateSession, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [user, validateSession, handleSessionExpired, showExpiredModal]);

  return { validateSession, showExpiredModal, handleExpiredConfirm };
};
