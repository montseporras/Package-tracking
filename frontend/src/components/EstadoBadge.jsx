// Badge de estado con el color identificativo correspondiente.
import { ESTADO_CLASE } from '../utils/constants.js';

export function EstadoBadge({ estado }) {
  const clase = ESTADO_CLASE[estado] || 'espera';
  return <span className={`badge badge--${clase}`}>{estado}</span>;
}
