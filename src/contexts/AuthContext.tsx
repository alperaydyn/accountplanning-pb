import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Handle expired/signed out events
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session and validate it by attempting refresh
    const initializeAuth = async () => {
      try {
        // First, try to refresh the session - this validates the token with the server
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          // Refresh failed - token is expired or invalid
          console.warn('Session refresh failed, clearing session:', refreshError?.message);
          setSession(null);
          setUser(null);
          setLoading(false);
          // Clean up any stale local storage
          try {
            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
            if (projectId) {
              localStorage.removeItem(`sb-${projectId}-auth-token`);
            }
          } catch (e) {
            console.warn("Failed to clear local auth token:", e);
          }
          return;
        }

        // Valid session after refresh
        setSession(refreshData.session);
        setUser(refreshData.session.user);
        setLoading(false);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

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
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
