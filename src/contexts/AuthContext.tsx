import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Refresh session helper - returns true if successful
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error || !refreshedSession) {
        console.warn('Failed to refresh session:', error?.message);
        setSession(null);
        setUser(null);
        setAuthError('session_expired');
        return false;
      }

      setSession(refreshedSession);
      setUser(refreshedSession.user);
      setAuthError(null);
      return true;
    } catch (err) {
      console.error('Session refresh error:', err);
      setSession(null);
      setUser(null);
      setAuthError('session_expired');
      return false;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setAuthError('signed_out');
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setAuthError(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN' && newSession) {
          setSession(newSession);
          setUser(newSession.user);
          setAuthError(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session and validate it
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Error getting session:', error.message);
          setSession(null);
          setUser(null);
          setAuthError('session_error');
          setLoading(false);
          return;
        }

        if (!existingSession) {
          // No session exists
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Check if token is expired or about to expire (within 60 seconds)
        const expiresAt = existingSession.expires_at;
        if (expiresAt) {
          const now = Math.floor(Date.now() / 1000);
          const timeToExpiry = expiresAt - now;
          
          if (timeToExpiry < 60) {
            // Token expired or expiring soon - attempt refresh
            console.log('Token expired or expiring soon, attempting refresh...');
            const refreshed = await refreshSession();
            if (!refreshed) {
              // Refresh failed - clear everything
              console.warn('Token refresh failed during initialization');
              await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            }
            setLoading(false);
            return;
          }
        }

        // Valid session with valid token
        setSession(existingSession);
        setUser(existingSession.user);
        setAuthError(null);
        setLoading(false);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setSession(null);
        setUser(null);
        setAuthError('init_error');
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  const signUp = async (email: string, password: string, name?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || email.split('@')[0],
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Update UI immediately (don't block logout UX on network / revocation issues).
    setSession(null);
    setUser(null);
    setAuthError(null);
    setLoading(false);

    // Defensive: also clear the persisted token directly.
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
      if (projectId) {
        localStorage.removeItem(`sb-${projectId}-auth-token`);
      }
    } catch (e) {
      console.warn("Failed to clear local auth token:", e);
    }

    // Best-effort revoke/cleanup in the SDK (fire-and-forget to avoid hanging spinners).
    void supabase.auth
      .signOut({ scope: "local" })
      .then(({ error }) => {
        if (error) console.warn("signOut error:", error);
      })
      .catch((e) => console.warn("signOut error:", e));
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, authError, signUp, signIn, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
