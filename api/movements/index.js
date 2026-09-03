import { handleMovementsCollection } from '../../src/server/routes/movementRoutes.js';
import { asVercelHandler } from '../../src/server/vercelHandler.js';

export const config = { runtime: 'nodejs' };

export default asVercelHandler(handleMovementsCollection);
