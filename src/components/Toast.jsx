/** Feedback flotante reutilizable (éxito / error). */
export default function Toast({ toast }) {
  if (!toast?.message) return null;

  const isError = toast.type === 'error';

  return (
    <div
      className={`toast ${isError ? 'toast--error' : 'toast--success'}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {toast.message}
    </div>
  );
}
