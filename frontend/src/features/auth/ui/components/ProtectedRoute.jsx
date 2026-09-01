import { Navigate, Outlet, useLocation } from 'react-router';
import useAuth from '../../hooks/useAuth.js';

const ProtectedRoute = ({ requireAuth = true }) => {
  const { isAuthenticated, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-300 text-sm">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-4 shadow-xl">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
          <span>Restoring session...</span>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
