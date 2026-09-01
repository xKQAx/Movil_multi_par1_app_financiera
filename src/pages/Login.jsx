import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { validateLoginFields } from '../utils/authHelpers';
import { focusFirstInvalid } from '../utils/formFocus';
import { ROUTES } from '../utils/constants';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateLoginFields(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    navigate(ROUTES.dashboard, { replace: true });
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Entra con tu correo para ver tu presupuesto.">
      <form ref={formRef} className="movement-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="estudiante@correo.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && <p id="email-error" className="form-error">{errors.email}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && <p id="password-error" className="form-error">{errors.password}</p>}
        </div>

        {submitError && (
          <div className="form-alert form-alert--error" role="alert">
            {submitError}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary btn--block" disabled={loading} aria-busy={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta? <Link to={ROUTES.register}>Crear cuenta</Link>
      </p>
    </AuthLayout>
  );
}
