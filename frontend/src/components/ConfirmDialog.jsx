// Diálogo de confirmación para acciones críticas (por ejemplo, eliminar).
import { useState } from 'react';
import { Modal } from './Modal.jsx';
import { Icon } from './Icon.jsx';

export function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', danger, onConfirm, onClose }) {
  const [cargando, setCargando] = useState(false);

  const handle = async () => {
    setCargando(true);
    try {
      await onConfirm();
    } finally {
      setCargando(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={cargando}>Cancelar</button>
          <button className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={handle} disabled={cargando}>
            {cargando ? <span className="spinner" /> : <Icon name="check" size={16} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-soft)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}
