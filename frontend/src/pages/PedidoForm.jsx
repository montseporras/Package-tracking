// Formulario de creación y edición de pedidos, dentro de un modal.
// Incluye validación en tiempo real, campo condicional de país "Otro" y el
// atributo de Declaración Jurada (checkbox + número condicional).
import { useState, useMemo } from 'react';
import { Modal } from '../components/Modal.jsx';
import { Icon } from '../components/Icon.jsx';
import { api, ApiError } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { ESTADOS, PAISES, MONEDAS, MAX } from '../utils/constants.js';

// Valores por defecto de un pedido nuevo.
const VACIO = {
  numero_pedido: '', pais_origen: '', pais_otro: '', proveedor: '', empresa: '',
  precio_total: '', moneda: 'USD', fecha_compra: new Date().toISOString().slice(0, 10),
  descripcion: '', estado: 'En espera', tiene_dj: false, numero_dj: '', observaciones: '',
};

// Reglas de validación en el cliente (espejo del backend).
function validarCampo(name, value, form) {
  const v = typeof value === 'string' ? value.trim() : value;
  switch (name) {
    case 'numero_pedido':
      if (!v) return 'El número de pedido es obligatorio.';
      if (v.length > MAX.numero_pedido) return `Máximo ${MAX.numero_pedido} caracteres.`;
      return '';
    case 'proveedor':
      if (!v) return 'El proveedor es obligatorio.';
      if (v.length > MAX.proveedor) return `Máximo ${MAX.proveedor} caracteres.`;
      return '';
    case 'empresa':
      if (!v) return 'La empresa es obligatoria.';
      if (v.length > MAX.empresa) return `Máximo ${MAX.empresa} caracteres.`;
      return '';
    case 'pais_origen':
      if (!v) return 'Seleccioná un país de origen.';
      return '';
    case 'pais_otro':
      if (form.pais_origen === 'Otro' && !v) return 'Indicá el nombre del país.';
      if (v.length > MAX.pais_otro) return `Máximo ${MAX.pais_otro} caracteres.`;
      return '';
    case 'precio_total':
      if (v === '' || v === null) return 'El precio es obligatorio.';
      if (Number.isNaN(Number(v))) return 'Ingresá un número válido.';
      if (Number(v) < 0) return 'El precio debe ser positivo.';
      return '';
    case 'fecha_compra':
      if (!v) return 'La fecha de compra es obligatoria.';
      return '';
    case 'numero_dj':
      if (form.tiene_dj && !v) return 'El número de Declaración Jurada es obligatorio.';
      if (v.length > MAX.numero_dj) return `Máximo ${MAX.numero_dj} caracteres.`;
      return '';
    default:
      return '';
  }
}

const CAMPOS_REQUERIDOS = ['numero_pedido', 'pais_origen', 'proveedor', 'empresa', 'precio_total', 'fecha_compra'];

export default function PedidoForm({ pedido, onClose, onSaved }) {
  const esEdicion = Boolean(pedido);
  const [form, setForm] = useState(() =>
    pedido ? { ...VACIO, ...pedido, tiene_dj: Boolean(pedido.tiene_dj) } : { ...VACIO }
  );
  const [errores, setErrores] = useState({});
  const [tocado, setTocado] = useState({});
  const [guardando, setGuardando] = useState(false);
  const toast = useToast();

  const esDJ = form.tiene_dj;
  const esOtro = form.pais_origen === 'Otro';

  // ¿El formulario es válido en su conjunto? (habilita el botón Guardar)
  const formValido = useMemo(() => {
    const campos = [...CAMPOS_REQUERIDOS];
    if (esOtro) campos.push('pais_otro');
    if (esDJ) campos.push('numero_dj');
    return campos.every((c) => !validarCampo(c, form[c], form));
  }, [form, esOtro, esDJ]);

  const setCampo = (name, value) => {
    const next = { ...form, [name]: value };
    setForm(next);
    if (tocado[name]) {
      setErrores((e) => ({ ...e, [name]: validarCampo(name, value, next) }));
    }
    // Revalidar campos dependientes cuando cambian el atributo DJ o el país.
    if (name === 'tiene_dj') setErrores((e) => ({ ...e, numero_dj: validarCampo('numero_dj', next.numero_dj, next) }));
    if (name === 'pais_origen') setErrores((e) => ({ ...e, pais_otro: validarCampo('pais_otro', next.pais_otro, next) }));
  };

  const onBlur = (name) => {
    setTocado((t) => ({ ...t, [name]: true }));
    setErrores((e) => ({ ...e, [name]: validarCampo(name, form[name], form) }));
  };

  const validarTodo = () => {
    const nuevos = {};
    const campos = [...CAMPOS_REQUERIDOS, 'descripcion', 'observaciones'];
    if (esOtro) campos.push('pais_otro');
    if (esDJ) campos.push('numero_dj');
    for (const c of campos) {
      const err = validarCampo(c, form[c], form);
      if (err) nuevos[c] = err;
    }
    setErrores(nuevos);
    setTocado(Object.fromEntries(campos.map((c) => [c, true])));
    return Object.keys(nuevos).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validarTodo()) {
      toast.error('Revisá los campos marcados en rojo.');
      return;
    }
    setGuardando(true);
    try {
      const payload = { ...form, precio_total: Number(form.precio_total) };
      const guardado = esEdicion
        ? await api.actualizarPedido(pedido.id, payload)
        : await api.crearPedido(payload);
      toast.success(esEdicion ? 'Pedido actualizado correctamente.' : 'Pedido creado correctamente.');
      onSaved(guardado);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.errores).length) {
        setErrores(err.errores); // errores de validación del servidor
        toast.error('El servidor rechazó algunos campos.');
      } else {
        toast.error(err.message);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={esEdicion ? `Editar pedido ${pedido.numero_pedido}` : 'Nuevo pedido'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" form="pedido-form" className="btn btn--primary" disabled={guardando || !formValido}>
            {guardando ? <span className="spinner" /> : <Icon name="check" size={16} color="#fff" />}
            {esEdicion ? 'Guardar cambios' : 'Crear pedido'}
          </button>
        </>
      }
    >
      <form id="pedido-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          {/* Número de pedido */}
          <div className={`field ${tocado.numero_pedido && errores.numero_pedido ? 'field--error' : ''}`}>
            <label>Número de pedido <span className="req">*</span></label>
            <input value={form.numero_pedido} maxLength={MAX.numero_pedido}
              onChange={(e) => setCampo('numero_pedido', e.target.value)} onBlur={() => onBlur('numero_pedido')}
              placeholder="Ej: PED-1007" />
            {tocado.numero_pedido && errores.numero_pedido && <span className="field__error">{errores.numero_pedido}</span>}
          </div>

          {/* Empresa */}
          <div className={`field ${tocado.empresa && errores.empresa ? 'field--error' : ''}`}>
            <label>Empresa <span className="req">*</span></label>
            <input value={form.empresa} maxLength={MAX.empresa}
              onChange={(e) => setCampo('empresa', e.target.value)} onBlur={() => onBlur('empresa')}
              placeholder="Ej: Mottura Insumos SA" />
            {tocado.empresa && errores.empresa && <span className="field__error">{errores.empresa}</span>}
          </div>

          {/* País de origen */}
          <div className={`field ${tocado.pais_origen && errores.pais_origen ? 'field--error' : ''}`}>
            <label>País de origen <span className="req">*</span></label>
            <select value={form.pais_origen} onChange={(e) => setCampo('pais_origen', e.target.value)} onBlur={() => onBlur('pais_origen')}>
              <option value="">Seleccionar…</option>
              {PAISES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            {tocado.pais_origen && errores.pais_origen && <span className="field__error">{errores.pais_origen}</span>}
          </div>

          {/* Campo condicional: nombre del país cuando es "Otro" */}
          {esOtro && (
            <div className={`field ${tocado.pais_otro && errores.pais_otro ? 'field--error' : ''}`}>
              <label>Nombre del país <span className="req">*</span></label>
              <input value={form.pais_otro} maxLength={MAX.pais_otro}
                onChange={(e) => setCampo('pais_otro', e.target.value)} onBlur={() => onBlur('pais_otro')}
                placeholder="Ej: Alemania" autoFocus />
              {tocado.pais_otro && errores.pais_otro && <span className="field__error">{errores.pais_otro}</span>}
            </div>
          )}

          {/* Proveedor */}
          <div className={`field ${tocado.proveedor && errores.proveedor ? 'field--error' : ''}`}>
            <label>Proveedor <span className="req">*</span></label>
            <input value={form.proveedor} maxLength={MAX.proveedor}
              onChange={(e) => setCampo('proveedor', e.target.value)} onBlur={() => onBlur('proveedor')}
              placeholder="Nombre del proveedor" />
            {tocado.proveedor && errores.proveedor && <span className="field__error">{errores.proveedor}</span>}
          </div>

          {/* Precio total */}
          <div className={`field ${tocado.precio_total && errores.precio_total ? 'field--error' : ''}`}>
            <label>Precio total <span className="req">*</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min="0" step="0.01" value={form.precio_total}
                onChange={(e) => setCampo('precio_total', e.target.value)} onBlur={() => onBlur('precio_total')}
                placeholder="0.00" style={{ flex: 1 }} />
              <select value={form.moneda} onChange={(e) => setCampo('moneda', e.target.value)} style={{ width: 92, flexShrink: 0 }}>
                {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {tocado.precio_total && errores.precio_total && <span className="field__error">{errores.precio_total}</span>}
          </div>

          {/* Fecha de compra */}
          <div className={`field ${tocado.fecha_compra && errores.fecha_compra ? 'field--error' : ''}`}>
            <label>Fecha de compra <span className="req">*</span></label>
            <input type="date" value={form.fecha_compra}
              onChange={(e) => setCampo('fecha_compra', e.target.value)} onBlur={() => onBlur('fecha_compra')} />
            {tocado.fecha_compra && errores.fecha_compra && <span className="field__error">{errores.fecha_compra}</span>}
          </div>

          {/* Estado */}
          <div className="field">
            <label>Estado <span className="req">*</span></label>
            <select value={form.estado} onChange={(e) => setCampo('estado', e.target.value)}>
              {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Declaración Jurada: atributo independiente del estado, con color propio */}
          <div className="dj-block col-span-2">
            <label className="dj-block__toggle">
              <input type="checkbox" checked={form.tiene_dj}
                onChange={(e) => setCampo('tiene_dj', e.target.checked)} />
              ¿Tiene Declaración Jurada?
            </label>
            {esDJ && (
              <div className={`field ${tocado.numero_dj && errores.numero_dj ? 'field--error' : ''}`}>
                <label>Número de Declaración Jurada <span className="req">*</span></label>
                <input value={form.numero_dj} maxLength={MAX.numero_dj}
                  onChange={(e) => setCampo('numero_dj', e.target.value)} onBlur={() => onBlur('numero_dj')}
                  placeholder="Ej: DJ-2026-00123" autoFocus />
                {tocado.numero_dj && errores.numero_dj && <span className="field__error">{errores.numero_dj}</span>}
              </div>
            )}
          </div>

          {/* Descripción */}
          <div className={`field col-span-2 ${errores.descripcion ? 'field--error' : ''}`}>
            <label>Descripción</label>
            <textarea value={form.descripcion} maxLength={MAX.descripcion}
              onChange={(e) => setCampo('descripcion', e.target.value)}
              placeholder="Detalle de los productos del pedido…" />
            {errores.descripcion && <span className="field__error">{errores.descripcion}</span>}
          </div>

          {/* Observaciones (opcional) */}
          <div className={`field col-span-2 ${errores.observaciones ? 'field--error' : ''}`}>
            <label>Observaciones <span className="muted">(opcional)</span></label>
            <textarea value={form.observaciones} maxLength={MAX.observaciones}
              onChange={(e) => setCampo('observaciones', e.target.value)}
              placeholder="Notas internas, condiciones de envío, etc." />
            {errores.observaciones && <span className="field__error">{errores.observaciones}</span>}
          </div>
        </div>
      </form>
    </Modal>
  );
}
