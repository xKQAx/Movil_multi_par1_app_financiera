import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { ROUTES } from '../../utils/constants';

/** Barra pública de la landing: logo + acceso. Sin hamburguesa. */
export default function LandingNav() {
  return (
    <header className="landing-nav">
      <div className="landing-wrap landing-nav__inner">
        <Link to={ROUTES.landing} className="landing-nav__brand">
          <span className="landing-nav__mark" aria-hidden="true">
            <Wallet size={18} />
          </span>
          <span>Control Financiero</span>
        </Link>
        <nav className="landing-nav__actions" aria-label="Acceso">
          <Link to={ROUTES.login} className="landing-nav__login">
            <span className="landing-nav__login-short">Entrar</span>
            <span className="landing-nav__login-full">Iniciar sesión</span>
          </Link>
          <Link to={ROUTES.register} className="btn btn--primary btn--fit landing-nav__cta">
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
