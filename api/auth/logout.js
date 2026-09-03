import { handleLogout } from '../../src/server/routes/authRoutes.js';
import { asVercelHandler } from '../../src/server/vercelHandler.js';

export const config = { runtime: 'nodejs' };

export default asVercelHandler(handleLogout);
