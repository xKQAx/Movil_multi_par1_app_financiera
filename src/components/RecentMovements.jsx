import { Link } from 'react-router-dom';
import MovementCard from './MovementCard';
import { useFinance } from '../context/FinanceContext';
import { ROUTES } from '../utils/constants';
import { getRecentMovements } from '../utils/movementList';

export default function RecentMovements() {
  const { monthMovements } = useFinance();
  const recent = getRecentMovements(monthMovements);

  return (
    <section className="recent-movements card" aria-labelledby="recent-movements-title">
      <div className="section-head">
        <h2 id="recent-movements-title" className="section-title">
          Últimos movimientos
        </h2>
        <Link to={ROUTES.movements} className="section-head__link">
          Ver todos
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-muted">Aún no hay movimientos</p>
      ) : (
        <ul className="recent-movements__list">
          {recent.map((movement) => (
            <li key={movement.id}>
              <MovementCard movement={movement} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
