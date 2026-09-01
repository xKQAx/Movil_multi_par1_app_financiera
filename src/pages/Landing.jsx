import { Link } from 'react-router-dom';
import { TRUST_ITEMS, STEPS, FEATURES } from '../components/landing/landingContent';
import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import { ROUTES } from '../utils/constants';

export default function Landing() {
  return (
    <div className="landing">
      <LandingNav />
      <LandingHero />

      <section className="landing-trust" aria-label="Qué incluye">
        <ul className="landing-wrap landing-trust__list">
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <li key={label}>
              <span className="landing-trust__icon">
                <Icon size={16} aria-hidden="true" />
              </span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <h2 className="landing-section__title">Cómo funciona</h2>
          <p className="landing-section__lead">Tres pasos. Sin hojas de cálculo.</p>
          <ol className="landing-steps">
            {STEPS.map(({ title, text }, index) => (
              <li key={title} className="landing-steps__item">
                <span className="landing-steps__num">{index + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="landing-section landing-section--muted">
        <div className="landing-wrap">
          <h2 className="landing-section__title">Hecha para el mes a mes</h2>
          <p className="landing-section__lead">Lo justo para no perder el hilo entre clases y gastos.</p>
          <ul className="landing-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="landing-features__item">
                <span className="landing-features__icon">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-wrap landing-cta__inner">
          <h2 className="landing-cta__title">Empieza este mes con el saldo a la vista</h2>
          <Link to={ROUTES.register} className="btn btn--primary">
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap landing-footer__inner">
          <p className="landing-footer__name">Control Financiero</p>
          <p>Hecho para estudiantes universitarios</p>
        </div>
      </footer>
    </div>
  );
}
