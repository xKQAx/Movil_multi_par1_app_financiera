import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Sin movimientos', message = 'Aún no hay registros para mostrar.' }) {
  return (
    <div className="empty-state">
      <Inbox size={48} className="empty-state__icon" aria-hidden="true" />
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__message">{message}</p>
    </div>
  );
}
