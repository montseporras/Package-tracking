// Rutas principales de la aplicación.
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Pedidos from './pages/Pedidos.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/pedidos" element={<Pedidos />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
