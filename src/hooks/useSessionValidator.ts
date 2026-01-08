import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Validates the current session and redirects to login if expired.
 * This hook should be used in protected layouts to handle mid-session JWT expiry.
 */
export const useSessionValidator = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const validateSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.warn('Session expired or invalid, redirecting to login');
        toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
        await signOut();
        navigate('/auth', { replace: true });
        return false;
      }

      // Check if token is about to expire (within 60 seconds)
      const expiresAt = session.expires_at;
      if (expiresAt) {
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = expiresAt - now;
        
        if (timeToExpiry < 0) {
          console.warn('Token has expired, redirecting to login');
          toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
          await signOut();
          navigate('/auth', { replace: true });
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      return false;
    }
  }, [user, signOut, navigate]);

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
