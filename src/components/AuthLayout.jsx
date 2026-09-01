import { Link } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import { ROUTES } from '../utils/constants';

/** Layout compartido de Login y Registro (DRY). */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="page auth-page">
      <Link to={ROUTES.landing} className="auth-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Volver al inicio
      </Link>
      <div className="auth-page__header">
        <span className="auth-page__mark" aria-hidden="true">
          <Wallet size={22} />
        </span>
        <h1 className="auth-page__title">{title}</h1>
        {subtitle && <p className="auth-page__subtitle">{subtitle}</p>}
      </div>
      <div className="card auth-page__card">{children}</div>
    </div>
  );
}
