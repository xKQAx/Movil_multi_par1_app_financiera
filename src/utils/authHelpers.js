/** Validación y hashing de autenticación local (SRP: separado del contexto). */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email).trim());
}

export function validateLoginFields({ email, password }) {
  const errors = {};
  if (!email?.trim()) errors.email = 'El correo es obligatorio.';
  else if (!isValidEmail(email)) errors.email = 'Ingresa un correo válido.';
  if (!password) errors.password = 'La contraseña es obligatoria.';
  return errors;
}

export function validateRegisterFields({ name, email, password, confirmPassword }) {
  const errors = validateLoginFields({ email, password });
  if (!name?.trim()) errors.name = 'El nombre es obligatorio.';
  if (password && password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (!confirmPassword) errors.confirmPassword = 'Confirma tu contraseña.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
  return errors;
}

/** Hash SHA-256 para demo local. No sustituye un backend seguro. */
export async function hashPassword(password) {
  if (globalThis.crypto?.subtle) {
    const data = new TextEncoder().encode(`cf-local:${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `plain:${password}`;
}

export function createUserId() {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}
