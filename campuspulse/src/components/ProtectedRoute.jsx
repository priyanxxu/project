import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ roles, children }) {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center text-sm font-semibold text-gray-500">Loading CampusPulse...</div>;
  if (!currentUser) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/" replace />;
  return children;
}
