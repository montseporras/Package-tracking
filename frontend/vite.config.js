import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite.
// El proxy redirige las llamadas /api al backend (Express en :4000),
// así el frontend puede llamar a "/api/..." sin problemas de CORS en desarrollo.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
