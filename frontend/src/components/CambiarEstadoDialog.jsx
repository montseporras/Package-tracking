// Diálogo rápido para cambiar el estado de un pedido sin abrir el formulario completo.
import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { EstadoBadge } from './EstadoBadge.jsx';
import { Icon } from './Icon.jsx';
import { api, ApiError } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { ESTADOS } from '../utils/constants.js';

export function CambiarEstadoDialog({ pedido, onClose, onSaved }) {
  const [estado, setEstado] = useState(pedido.estado);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const toast = useToast();

  const guardar = async () => {
    setGuardando(true);
    try {
      const actualizado = await api.cambiarEstado(pedido.id, estado);
      toast.success('Estado actualizado.');
      onSaved(actualizado);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else toast.error(e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={`Cambiar estado · ${pedido.numero_pedido}`}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="btn btn--primary" onClick={guardar} disabled={guardando || estado === pedido.estado}>
            {guardando ? <span className="spinner" /> : <Icon name="check" size={16} color="#fff" />}
            Guardar
          </button>
        </>
      }
    >
      <div style={{ marginBottom: 14 }}>
        <span className="muted" style={{ fontSize: 13 }}>Estado actual:</span>{' '}
        <EstadoBadge estado={pedido.estado} />
      </div>
      <div className={`field ${error ? 'field--error' : ''}`}>
        <label>Nuevo estado</label>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setError(''); }}>
          {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {error && <span className="field__error">{error}</span>}
      </div>
    </Modal>
  );
}
