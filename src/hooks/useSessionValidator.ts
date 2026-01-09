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
      // Use refreshSession to validate token with the server, not just check cached session
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.warn('Session expired or invalid, redirecting to login:', error?.message);
        toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.', {
          duration: 5000,
          description: 'Güvenliğiniz için yeniden giriş yapmanız gerekmektedir.'
        });
        await signOut();
        navigate('/auth', { replace: true });
        return false;
      }

      console.log('Session validated successfully');
      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      toast.error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      await signOut();
      navigate('/auth', { replace: true });
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
