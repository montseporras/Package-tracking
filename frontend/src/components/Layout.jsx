// Estructura general: sidebar + topbar + área de contenido.
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

export function Layout({ title, actions, children }) {
  const { theme, toggle } = useTheme();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const cerrar = () => setMenuAbierto(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuAbierto ? 'open' : ''}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo"><Icon name="plus" size={22} color="#fff" strokeWidth={2.5} /></div>
          <div>
            <h1>Clínica Mottura</h1>
            <span>Gestión de pedidos</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <NavLink to="/" end className="nav-link" onClick={cerrar}>
            <Icon name="dashboard" size={19} /> Panel
          </NavLink>
          <NavLink to="/pedidos" className="nav-link" onClick={cerrar}>
            <Icon name="package" size={19} /> Pedidos
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          <button className="nav-link" style={{ width: '100%', border: 'none', background: 'none' }} onClick={toggle}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </aside>

      <div className={`backdrop ${menuAbierto ? 'show' : ''}`} onClick={cerrar} />

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn menu-toggle" onClick={() => setMenuAbierto((v) => !v)} aria-label="Menú">
            <Icon name="menu" size={20} />
          </button>
          <span className="topbar__title">{title}</span>
          <div className="topbar__spacer" />
          {actions}
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
