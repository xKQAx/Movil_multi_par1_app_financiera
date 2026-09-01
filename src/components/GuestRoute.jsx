import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

/** Landing / login / registro: si ya hay sesión, ir al dashboard. */
export default function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }
  return children;
}
