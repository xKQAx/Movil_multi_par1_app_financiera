import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../context/AuthContext';
import { validateRegisterFields } from '../utils/authHelpers';
import { focusFirstInvalid } from '../utils/formFocus';
import { ROUTES } from '../utils/constants';
import { useToast } from '../hooks/useToast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const formRef = useRef(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
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
    const fieldErrors = validateRegisterFields(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      requestAnimationFrame(() => focusFirstInvalid(formRef.current));
      return;
    }

    setLoading(true);
    const result = await register({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setLoading(false);

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    showToast('Cuenta lista. Empieza registrando un ingreso de este mes.');
    navigate(ROUTES.dashboard, { replace: true });
  };

  return (
    <AuthLayout title="Crear cuenta" subtitle="Regístrate para controlar tu presupuesto mensual.">
      <form ref={formRef} className="movement-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="name">Nombre o alias</label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            autoFocus
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Carlos"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && <p id="name-error" className="form-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
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
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && <p id="password-error" className="form-error">{errors.password}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            placeholder="Repite la contraseña"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
          />
          {errors.confirmPassword && <p id="confirm-error" className="form-error">{errors.confirmPassword}</p>}
        </div>

        {submitError && (
          <div className="form-alert form-alert--error" role="alert">
            {submitError}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary btn--block" disabled={loading} aria-busy={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </div>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to={ROUTES.login}>Iniciar sesión</Link>
      </p>
    </AuthLayout>
  );
}
