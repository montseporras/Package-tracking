// Página de gestión de pedidos: buscador, filtros combinables, ordenamiento,
// tabla y todas las acciones CRUD (ver, editar, duplicar, cambiar estado, eliminar).
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout.jsx';
import { Icon } from '../components/Icon.jsx';
import { EstadoBadge } from '../components/EstadoBadge.jsx';
import { RowMenu } from '../components/RowMenu.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { CambiarEstadoDialog } from '../components/CambiarEstadoDialog.jsx';
import PedidoForm from './PedidoForm.jsx';
import PedidoDetalle from './PedidoDetalle.jsx';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { ESTADOS, PAISES } from '../utils/constants.js';
import { formatoPrecio, formatoFecha, paisMostrar } from '../utils/format.js';

const FILTROS_VACIOS = {
  estado: '', empresa: '', proveedor: '', pais: '',
  fecha_desde: '', precio_min: '', precio_max: '', tiene_dj: '',
};

// Encabezados de la tabla; los que tienen `key` son ordenables.
const COLUMNAS = [
  { key: 'numero', label: 'N° pedido' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'pais', label: 'País' },
  { key: 'proveedor', label: 'Proveedor' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'precio', label: 'Precio' },
  { key: 'estado', label: 'Estado' },
  { label: '' },
];

export default function Pedidos() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaDebounced, setBusquedaDebounced] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [orden, setOrden] = useState({ campo: 'fecha', dir: 'desc' });

  // Estados de los modales.
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [detalleId, setDetalleId] = useState(null);
  const [cambiarEstado, setCambiarEstado] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);

  const toast = useToast();

  // Abrir el formulario nuevo si venimos del dashboard (?nuevo=1).
  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setEditando(null);
      setFormAbierto(true);
      searchParams.delete('nuevo');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Debounce del buscador (evita una petición por tecla).
  useEffect(() => {
    const t = setTimeout(() => setBusquedaDebounced(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const data = await api.listarPedidos({
        q: busquedaDebounced,
        ...filtros,
        orden: orden.campo,
        dir: orden.dir,
      });
      setPedidos(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setCargando(false);
    }
  }, [busquedaDebounced, filtros, orden]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { cargar(); }, [cargar]);

  const filtrosActivos = useMemo(
    () => Object.values(filtros).filter((v) => v !== '').length,
    [filtros]
  );

  const setFiltro = (k, v) => setFiltros((f) => ({ ...f, [k]: v }));
  const limpiarFiltros = () => { setFiltros(FILTROS_VACIOS); setBusqueda(''); };

  const ordenarPor = (campo) => {
    setOrden((o) => (o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' }));
  };

  // --- Acciones ---
  const abrirNuevo = () => { setEditando(null); setFormAbierto(true); };
  const abrirEditar = (p) => { setDetalleId(null); setEditando(p); setFormAbierto(true); };

  const onGuardado = () => { setFormAbierto(false); setEditando(null); cargar(); };

  const duplicar = async (p) => {
    try {
      await api.duplicarPedido(p.id);
      toast.success(`Pedido ${p.numero_pedido} duplicado.`);
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  // jsPDF/autoTable se cargan sólo al exportar (code-splitting), para no
  // engordar el bundle principal con una librería que no siempre se usa.
  const exportarTodosPDF = async () => {
    if (pedidos.length === 0) {
      toast.error('No hay pedidos para exportar.');
      return;
    }
    const { exportarListadoPDF } = await import('../utils/pdf.js');
    exportarListadoPDF(pedidos);
  };

  const exportarUnoPDF = async (p) => {
    try {
      const [completo, { exportarPedidoPDF }] = await Promise.all([
        api.obtenerPedido(p.id), // incluye historial de estados
        import('../utils/pdf.js'),
      ]);
      exportarPedidoPDF(completo);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await api.eliminarPedido(aEliminar.id);
      toast.success(`Pedido ${aEliminar.numero_pedido} eliminado.`);
      setAEliminar(null);
      cargar();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const flecha = (campo) => (orden.campo === campo ? (orden.dir === 'asc' ? ' ↑' : ' ↓') : '');

  return (
    <Layout
      title="Pedidos"
      actions={
        <>
          <button className="btn btn--ghost" onClick={exportarTodosPDF} disabled={pedidos.length === 0}>
            <Icon name="download" size={16} /> Exportar PDF
          </button>
          <button className="btn btn--primary" onClick={abrirNuevo}>
            <Icon name="plus" size={17} color="#fff" /> Nuevo pedido
          </button>
        </>
      }
    >
      <div className="page-head">
        <div>
          <h2>Pedidos</h2>
          <p>Administrá todos los pedidos desde una sola pantalla</p>
        </div>
        <span className="count-pill">{pedidos.length} resultado{pedidos.length === 1 ? '' : 's'}</span>
      </div>

      {/* Buscador + botón de filtros */}
      <div className="toolbar">
        <div className="search">
          <span className="search__icon"><Icon name="search" size={18} /></span>
          <input
            placeholder="Buscar por número, proveedor, empresa o descripción…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button className={`btn btn--ghost`} onClick={() => setMostrarFiltros((v) => !v)}>
          <Icon name="filter" size={16} /> Filtros
          {filtrosActivos > 0 && <span className="chip-active" style={{ padding: '1px 8px' }}>{filtrosActivos}</span>}
        </button>
        {(filtrosActivos > 0 || busqueda) && (
          <button className="btn btn--ghost" onClick={limpiarFiltros}>
            <Icon name="x" size={16} /> Limpiar
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {mostrarFiltros && (
        <div className="filters">
          <div className="filters__grid">
            <div className="field">
              <label>Estado</label>
              <select value={filtros.estado} onChange={(e) => setFiltro('estado', e.target.value)}>
                <option value="">Todos</option>
                {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>País de origen</label>
              <select value={filtros.pais} onChange={(e) => setFiltro('pais', e.target.value)}>
                <option value="">Todos</option>
                {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Empresa</label>
              <input value={filtros.empresa} onChange={(e) => setFiltro('empresa', e.target.value)} placeholder="Contiene…" />
            </div>
            <div className="field">
              <label>Proveedor</label>
              <input value={filtros.proveedor} onChange={(e) => setFiltro('proveedor', e.target.value)} placeholder="Contiene…" />
            </div>
            <div className="field">
              <label>Compra desde</label>
              <input type="date" value={filtros.fecha_desde} onChange={(e) => setFiltro('fecha_desde', e.target.value)} />
            </div>
            <div className="field">
              <label>Precio mínimo</label>
              <input type="number" min="0" value={filtros.precio_min} onChange={(e) => setFiltro('precio_min', e.target.value)} placeholder="0" />
            </div>
            <div className="field">
              <label>Precio máximo</label>
              <input type="number" min="0" value={filtros.precio_max} onChange={(e) => setFiltro('precio_max', e.target.value)} placeholder="Sin límite" />
            </div>
            <div className="field">
              <label>Declaración Jurada</label>
              <select value={filtros.tiene_dj} onChange={(e) => setFiltro('tiene_dj', e.target.value)}>
                <option value="">Todos</option>
                <option value="1">Con DJ</option>
                <option value="0">Sin DJ</option>
              </select>
            </div>
          </div>
          <div className="filters__actions">
            <button className="btn btn--ghost" onClick={limpiarFiltros}>Limpiar filtros</button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {COLUMNAS.map((c, i) => (
                <th
                  key={i}
                  className={c.key ? 'sortable' : ''}
                  onClick={c.key ? () => ordenarPor(c.key) : undefined}
                  style={i === COLUMNAS.length - 1 ? { textAlign: 'right' } : undefined}
                >
                  {c.label}{c.key ? flecha(c.key) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {COLUMNAS.map((c, j) => (
                    <td key={j} data-label={c.label}><span className="skeleton" style={{ display: 'block', height: 16 }} /></td>
                  ))}
                </tr>
              ))
            ) : pedidos.length === 0 ? (
              <tr>
                <td colSpan={COLUMNAS.length}>
                  <div className="empty">
                    <div className="empty__icon"><Icon name="search" size={56} /></div>
                    <h3>No se encontraron pedidos</h3>
                    <p>Probá ajustar la búsqueda o los filtros{filtrosActivos ? ', o limpialos.' : '.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pedidos.map((p) => (
                <tr key={p.id}>
                  <td data-label="N° pedido" className="mono" style={{ cursor: 'pointer' }} onClick={() => setDetalleId(p.id)}>{p.numero_pedido}</td>
                  <td data-label="Empresa">{p.empresa}</td>
                  <td data-label="País">{paisMostrar(p)}</td>
                  <td data-label="Proveedor">{p.proveedor}</td>
                  <td data-label="Fecha">{formatoFecha(p.fecha_compra)}</td>
                  <td data-label="Precio" className="num mono">{formatoPrecio(p.precio_total, p.moneda)}</td>
                  <td data-label="Estado">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <EstadoBadge estado={p.estado} />
                      {Boolean(p.tiene_dj) && <span className="badge badge--dj">DJ</span>}
                    </div>
                  </td>
                  <td data-label="" className="td-actions">
                    <div className="row-actions">
                      <RowMenu
                        items={[
                          { icon: 'eye', label: 'Ver detalles', onClick: () => setDetalleId(p.id) },
                          { icon: 'edit', label: 'Editar', onClick: () => abrirEditar(p) },
                          { icon: 'refresh', label: 'Cambiar estado', onClick: () => setCambiarEstado(p) },
                          { icon: 'copy', label: 'Duplicar', onClick: () => duplicar(p) },
                          { icon: 'download', label: 'Exportar PDF', onClick: () => exportarUnoPDF(p) },
                          { sep: true },
                          { icon: 'trash', label: 'Eliminar', danger: true, onClick: () => setAEliminar(p) },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modales */}
      {formAbierto && (
        <PedidoForm pedido={editando} onClose={() => { setFormAbierto(false); setEditando(null); }} onSaved={onGuardado} />
      )}
      {detalleId && (
        <PedidoDetalle id={detalleId} onClose={() => setDetalleId(null)} onEditar={abrirEditar} />
      )}
      {cambiarEstado && (
        <CambiarEstadoDialog
          pedido={cambiarEstado}
          onClose={() => setCambiarEstado(null)}
          onSaved={() => { setCambiarEstado(null); cargar(); }}
        />
      )}
      {aEliminar && (
        <ConfirmDialog
          title="Eliminar pedido"
          message={`¿Seguro que querés eliminar el pedido ${aEliminar.numero_pedido}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmarEliminar}
          onClose={() => setAEliminar(null)}
        />
      )}
    </Layout>
  );
}
