import http from 'node:http';
import { loadLocalEnv } from './loadEnv.mjs';
import { handleApiRequest } from '../src/server/router.js';

loadLocalEnv();

const PORT = Number(process.env.API_PORT) || 3001;

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en .env (solo servidor, nunca VITE_DATABASE_URL).');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev-only-local-jwt-secret-change-me';
  console.warn('Falta JWT_SECRET en .env. Usando un secreto local de desarrollo; en Vercel debes definir JWT_SECRET.');
}

const server = http.createServer((req, res) => {
  handleApiRequest(req, res).catch((error) => {
    console.error(error?.message || error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Error interno del servidor.' }));
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`API local en http://127.0.0.1:${PORT} (Vite hace proxy de /api)`);
});
