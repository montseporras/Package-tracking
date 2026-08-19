// Contexto de notificaciones (toasts): mensajes de éxito, error e info.
import { createContext, useContext, useCallback, useState } from 'react';
import { Icon } from '../components/Icon.jsx';

const ToastContext = createContext(null);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (msg, tipo = 'info', ms = 3500) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, msg, tipo }]);
      if (ms > 0) setTimeout(() => remove(id), ms);
    },
    [remove]
  );

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error', 5000),
    info: (m) => push(m, 'info'),
  };

  const iconos = { success: 'check-circle', error: 'alert-circle', info: 'info' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            <Icon
              name={iconos[t.tipo]}
              size={18}
              color={
                t.tipo === 'success'
                  ? 'var(--success)'
                  : t.tipo === 'error'
                  ? 'var(--danger)'
                  : 'var(--primary)'
              }
            />
            <span className="toast__msg">{t.msg}</span>
            <button className="icon-btn" style={{ width: 28, height: 28 }} onClick={() => remove(t.id)} aria-label="Cerrar">
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
