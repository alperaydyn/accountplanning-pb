import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Validates the current session and redirects to login if expired.
 * This hook should be used in protected layouts to handle mid-session JWT expiry.
 */
export const useSessionValidator = () => {
  const { user, signOut, refreshSession } = useAuth();
  const navigate = useNavigate();
  const isValidating = useRef(false);

  const validateSession = useCallback(async () => {
    if (!user || isValidating.current) return true;

    isValidating.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn('Session expired or invalid, redirecting to login');
        toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        await signOut();
        navigate('/auth', { replace: true });
        isValidating.current = false;
        return false;
      }

      // Check token expiration
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = expiresAt - now;
        
        // Token already expired
        if (timeToExpiry < 0) {
          console.warn('Token has expired, redirecting to login');
          toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.', {
            duration: 5000,
            description: 'Güvenliğiniz için yeniden giriş yapmanız gerekmektedir.'
          });
          await signOut();
          navigate('/auth', { replace: true });
          isValidating.current = false;
          return false;
        }
        
        // Proactive refresh: if token expires within 5 minutes (300 seconds)
        if (timeToExpiry > 0 && timeToExpiry < 300) {
          console.log('Token expiring soon, attempting refresh...');
          const refreshed = await refreshSession();
          if (!refreshed) {
            console.warn('Failed to refresh token, redirecting to login');
            toast.error('Oturum yenilenemiyor. Lütfen tekrar giriş yapın.');
            navigate('/auth', { replace: true });
            isValidating.current = false;
            return false;
          }
          console.log('Token refreshed proactively');
        }
      }

      isValidating.current = false;
      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      isValidating.current = false;
      return false;
    }
  }, [user, signOut, refreshSession, navigate]);

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
          if (user) {
            toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
            navigate('/auth', { replace: true });
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
  }, [user, validateSession, navigate]);

  return { validateSession };
};
