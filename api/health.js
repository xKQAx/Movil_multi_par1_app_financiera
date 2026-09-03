import { handleHealth } from '../src/server/routes/healthRoutes.js';
import { asVercelHandler } from '../src/server/vercelHandler.js';

export const config = { runtime: 'nodejs' };

export default asVercelHandler(handleHealth);
