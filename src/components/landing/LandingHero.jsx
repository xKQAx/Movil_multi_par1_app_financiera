import { Link } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import LandingPreview from './LandingPreview';

export default function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__mesh" aria-hidden="true">
        <span className="landing-blob landing-blob--1" />
        <span className="landing-blob landing-blob--2" />
        <span className="landing-blob landing-blob--3" />
      </div>
      <div className="landing-wrap landing-hero__grid">
        <div className="landing-hero__copy">
          <p className="landing-badge">App para estudiantes</p>
          <h1 className="landing-hero__title">
            Sabe cuánto te queda{' '}
            <span className="landing-hero__mark">antes de que se acabe el mes</span>
          </h1>
          <p className="landing-hero__lead">
            Mesada, beca o freelance, organizados. Registra ingresos y gastos, recibe alertas al
            30 % y al 10 %, y dicta movimientos por voz.
          </p>
          <div className="landing-hero__cta">
            <Link to={ROUTES.register} className="btn btn--primary">
              Crear cuenta
            </Link>
            <Link to={ROUTES.login} className="btn btn--secondary">
              Iniciar sesión
            </Link>
          </div>
        </div>
        <LandingPreview />
      </div>
    </section>
  );
}
