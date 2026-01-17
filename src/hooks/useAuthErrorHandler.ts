import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Hook to handle authentication errors from data fetching.
 * Call handleAuthError when you detect an auth-related error in a query/mutation.
 */
export const useAuthErrorHandler = () => {
  const { signOut, authError } = useAuth();
  const navigate = useNavigate();

  // Handle auth errors from queries
  const handleAuthError = useCallback(async (error: Error | unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Check if it's an auth-related error
    if (
      errorMessage.includes('JWT') ||
      errorMessage.includes('401') ||
      errorMessage.includes('PGRST301') ||
      errorMessage.includes('token') ||
      errorMessage.includes('expired')
    ) {
      console.warn('Auth error detected, signing out:', errorMessage);
      toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.', {
        duration: 5000,
      });
      await signOut();
      navigate('/auth', { replace: true });
      return true;
    }
    
    return false;
  }, [signOut, navigate]);

  // Watch for auth errors from context
  useEffect(() => {
    if (authError === 'session_expired') {
      navigate('/auth', { replace: true });
    }
  }, [authError, navigate]);

  return { handleAuthError };
};
