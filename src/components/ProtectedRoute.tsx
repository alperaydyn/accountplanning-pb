import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, authError } = useAuth();
  const location = useLocation();

  // Show toast notification when session expires
  useEffect(() => {
    if (!loading && authError === 'session_expired') {
      toast.error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.', {
        duration: 5000,
        description: 'Güvenliğiniz için yeniden giriş yapmanız gerekmektedir.'
      });
    }
  }, [loading, authError]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Oturum doğrulanıyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Preserve the intended destination for after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
