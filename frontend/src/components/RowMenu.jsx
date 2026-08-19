// Menú desplegable de acciones para cada fila de la tabla.
// Se renderiza en un portal sobre <body> y se posiciona con coordenadas fijas
// calculadas a partir del botón disparador, para que no quede recortado por
// el overflow del contenedor de la tabla (.table-wrap).
// Se cierra al hacer clic fuera o al presionar Escape.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';

const MENU_ANCHO_ESTIMADO = 180; // coincide con min-width de .menu__list
const MARGEN_VIEWPORT = 8;

export function RowMenu({ items }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Recalcula la posición del menú flotante en base al botón y al tamaño real del menú.
  const posicionar = useCallback(() => {
    const btn = btnRef.current;
    if (!btn) return;
    const rectBtn = btn.getBoundingClientRect();
    const anchoMenu = menuRef.current?.offsetWidth ?? MENU_ANCHO_ESTIMADO;
    const altoMenu = menuRef.current?.offsetHeight ?? 0;

    // Verticalmente: debajo del botón, o arriba si no entra en la ventana.
    let top = rectBtn.bottom + 4;
    if (top + altoMenu > window.innerHeight - MARGEN_VIEWPORT) {
      top = Math.max(MARGEN_VIEWPORT, rectBtn.top - altoMenu - 4);
    }

    // Horizontalmente: alineado al borde derecho del botón, sin salirse de la ventana.
    let left = rectBtn.right - anchoMenu;
    left = Math.min(Math.max(left, MARGEN_VIEWPORT), window.innerWidth - anchoMenu - MARGEN_VIEWPORT);

    setPos({ top, left });
  }, []);

  // Recalcula apenas se abre y en cuanto el menú se monta (para usar su tamaño real).
  useLayoutEffect(() => {
    if (abierto) posicionar();
  }, [abierto, posicionar]);

  useEffect(() => {
    if (!abierto) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (menuRef.current && !menuRef.current.contains(e.target)) setAbierto(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setAbierto(false); };
    // capture:true para detectar el scroll de cualquier ancestro (incluido .table-wrap).
    window.addEventListener('scroll', posicionar, true);
    window.addEventListener('resize', posicionar);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', posicionar, true);
      window.removeEventListener('resize', posicionar);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [abierto, posicionar]);

  return (
    <div className="menu">
      <button
        ref={btnRef}
        className="icon-btn menu-trigger"
        onClick={() => setAbierto((v) => !v)}
        aria-label="Acciones"
      >
        <Icon name="more-vertical" size={18} />
      </button>
      {abierto && createPortal(
        <div
          ref={menuRef}
          className="menu__list menu__list--floating"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
        >
          {items.map((it, i) =>
            it.sep ? (
              <div key={i} className="menu__sep" />
            ) : (
              <button
                key={i}
                className={`menu__item ${it.danger ? 'menu__item--danger' : ''}`}
                onClick={() => { setAbierto(false); it.onClick(); }}
                role="menuitem"
              >
                <Icon name={it.icon} size={16} /> {it.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
