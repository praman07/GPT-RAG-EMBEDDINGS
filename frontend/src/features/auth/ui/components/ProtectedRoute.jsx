import { Navigate, useLocation } from 'react-router';
import useAuth from '../../hooks/useAuth.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isAuthChecked } = useAuth();
  const location = useLocation();

  if (!isAuthChecked) {
    return (
      <div className="rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-300">
        Restoring session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
