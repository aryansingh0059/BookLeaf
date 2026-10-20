import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    // Redirect to the appropriate portal if logged in with wrong role
    return <Navigate to={user.role === 'admin' ? '/admin' : '/author'} replace />;
  }

  return children;
}
