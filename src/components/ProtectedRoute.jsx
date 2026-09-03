import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

/** Rutas del dashboard y el resto de la app: solo con sesión. */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  if (!ready) {
    return (
      <div className="page" role="status">
        <p className="text-muted">Comprobando sesión…</p>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }
  return children;
}
