// Panel inicial: resumen general del estado de los pedidos.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { Icon } from '../components/Icon.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatoPrecio, formatoFecha, paisMostrar } from '../utils/format.js';
import { EstadoBadge } from '../components/EstadoBadge.jsx';

const COLUMNAS_RECIENTES = ['N° pedido', 'Empresa', 'País', 'Fecha', 'Precio', 'Estado'];

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const [r, pedidos] = await Promise.all([api.resumen(), api.listarPedidos({ orden: 'fecha', dir: 'desc' })]);
        if (!activo) return;
        setResumen(r);
        setRecientes(pedidos.slice(0, 5));
      } catch (e) {
        toast.error(e.message);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pe = resumen?.porEstado || {};

  const tarjetas = [
    { label: 'Total de pedidos', value: resumen?.total ?? 0, icon: 'layers', color: 'var(--primary)', bg: 'var(--primary-soft)' },
    { label: 'En espera', value: pe['En espera'] ?? 0, icon: 'hourglass', color: 'var(--estado-espera)', bg: 'var(--estado-espera-bg)' },
    { label: 'En camino', value: pe['En camino'] ?? 0, icon: 'truck', color: 'var(--estado-camino)', bg: 'var(--estado-camino-bg)' },
    { label: 'Recibidos', value: pe['Recibido'] ?? 0, icon: 'check-circle', color: 'var(--estado-recibido)', bg: 'var(--estado-recibido-bg)' },
    { label: 'Sin Declaración Jurada', value: resumen?.sinDJ ?? 0, icon: 'alert-circle', color: 'var(--dj)', bg: 'var(--dj-bg)' },
  ];

  return (
    <Layout
      title="Panel"
      actions={
        <button className="btn btn--primary" onClick={() => navigate('/pedidos?nuevo=1')}>
          <Icon name="plus" size={17} color="#fff" /> Nuevo pedido
        </button>
      }
    >
      <div className="page-head">
        <div>
          <h2>Resumen general</h2>
          <p>Estado actual de todos los pedidos registrados</p>
        </div>
        {resumen && (
          <span className="count-pill">
            Monto total: <strong style={{ color: 'var(--text)' }}>{formatoPrecio(resumen.montoTotal)}</strong>
          </span>
        )}
      </div>

      <div className="stat-grid">
        {tarjetas.map((t) => (
          <StatCard key={t.label} {...t} loading={cargando} />
        ))}
      </div>

      <h3 className="section-title">Pedidos recientes</h3>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>N° pedido</th>
              <th>Empresa</th>
              <th>País</th>
              <th>Fecha</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}>
                  {COLUMNAS_RECIENTES.map((label, j) => (
                    <td key={j} data-label={label}><span className="skeleton" style={{ display: 'block', height: 16 }} /></td>
                  ))}
                </tr>
              ))
            ) : recientes.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    <div className="empty__icon"><Icon name="inbox" size={56} /></div>
                    <h3>Todavía no hay pedidos</h3>
                    <p>Creá tu primer pedido para empezar.</p>
                  </div>
                </td>
              </tr>
            ) : (
              recientes.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/pedidos')}>
                  <td data-label="N° pedido" className="mono">{p.numero_pedido}</td>
                  <td data-label="Empresa">{p.empresa}</td>
                  <td data-label="País">{paisMostrar(p)}</td>
                  <td data-label="Fecha">{formatoFecha(p.fecha_compra)}</td>
                  <td data-label="Precio" className="num mono">{formatoPrecio(p.precio_total, p.moneda)}</td>
                  <td data-label="Estado"><EstadoBadge estado={p.estado} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
