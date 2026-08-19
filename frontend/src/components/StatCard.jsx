// Tarjeta de indicador para el dashboard.
import { Icon } from './Icon.jsx';

export function StatCard({ label, value, icon, color, bg, loading }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <div className="stat-card__icon" style={{ background: bg, color }}>
          <Icon name={icon} size={21} color={color} />
        </div>
      </div>
      <div className="stat-card__value">
        {loading ? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 30 }} /> : value}
      </div>
    </div>
  );
}
