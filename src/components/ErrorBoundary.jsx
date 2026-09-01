import { Component } from 'react';
import { ROUTES } from '../utils/constants';

/**
 * Límite de error de React: si un render peta, muestra una pantalla amable
 * en lugar de la pantalla en blanco.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page page--narrow error-fallback">
        <h1 className="error-fallback__title">Algo salió mal</h1>
        <p className="error-fallback__text">
          Esta pantalla se detuvo, pero tus movimientos y preferencias siguen
          guardados en este dispositivo.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn--primary" onClick={this.handleRetry}>
            Reintentar
          </button>
          <a className="btn btn--secondary" href={ROUTES.landing}>
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }
}
