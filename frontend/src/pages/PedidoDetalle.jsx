// Detalle completo de un pedido, incluido el historial de cambios de estado.
import { useEffect, useState } from 'react';
import { Modal } from '../components/Modal.jsx';
import { EstadoBadge } from '../components/EstadoBadge.jsx';
import { Icon } from '../components/Icon.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatoPrecio, formatoFecha, formatoFechaHora, paisMostrar } from '../utils/format.js';

function Dato({ k, v, full }) {
  return (
    <div className={`detail-item ${full ? 'full' : ''}`}>
      <span className="k">{k}</span>
      <span className="v">{v || '—'}</span>
    </div>
  );
}

export default function PedidoDetalle({ id, onClose, onEditar }) {
  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const p = await api.obtenerPedido(id);
        if (activo) setPedido(p);
      } catch (e) {
        toast.error(e.message);
        onClose();
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal
      title={pedido ? `Pedido ${pedido.numero_pedido}` : 'Detalle del pedido'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>Cerrar</button>
          {pedido && (
            <button className="btn btn--primary" onClick={() => onEditar(pedido)}>
              <Icon name="edit" size={16} color="#fff" /> Editar
            </button>
          )}
        </>
      }
    >
      {cargando || !pedido ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[...Array(4)].map((_, i) => <span key={i} className="skeleton" style={{ height: 40 }} />)}
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}><EstadoBadge estado={pedido.estado} /></div>

          <div className="detail-grid">
            <Dato k="N° de pedido" v={pedido.numero_pedido} />
            <Dato k="Empresa" v={pedido.empresa} />
            <Dato k="País de origen" v={paisMostrar(pedido)} />
            <Dato k="Proveedor" v={pedido.proveedor} />
            <Dato k="Precio total" v={formatoPrecio(pedido.precio_total, pedido.moneda)} />
            <Dato k="Fecha de compra" v={formatoFecha(pedido.fecha_compra)} />
            <Dato k="Descripción" v={pedido.descripcion} full />
            {pedido.observaciones && <Dato k="Observaciones" v={pedido.observaciones} full />}
          </div>

          {Boolean(pedido.tiene_dj) && (
            <div className="dj-block" style={{ marginTop: 18 }}>
              <span className="dj-block__toggle" style={{ cursor: 'default' }}>
                <Icon name="file-text" size={16} color="var(--dj)" /> Declaración Jurada
              </span>
              <div className="detail-item">
                <span className="k">N° Declaración Jurada</span>
                <span className="v">{pedido.numero_dj || '—'}</span>
              </div>
            </div>
          )}

          <h4 className="section-title" style={{ marginTop: 24 }}>Historial de estados</h4>
          {pedido.historial?.length ? (
            <div className="timeline">
              {pedido.historial.map((h) => (
                <div className="timeline__item" key={h.id}>
                  <span className="timeline__dot" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>
                      {h.estado_anterior ? (
                        <>{h.estado_anterior} → {h.estado_nuevo}</>
                      ) : (
                        <>Creado como “{h.estado_nuevo}”</>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{formatoFechaHora(h.fecha)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Sin cambios registrados.</p>
          )}

          <div className="muted" style={{ fontSize: 12, marginTop: 18 }}>
            Creado: {formatoFechaHora(pedido.created_at)} · Última modificación: {formatoFechaHora(pedido.updated_at)}
          </div>
        </>
      )}
    </Modal>
  );
}
