import { handlePreferences } from '../src/server/routes/preferenceRoutes.js';
import { asVercelHandler } from '../src/server/vercelHandler.js';

export const config = { runtime: 'nodejs' };

export default asVercelHandler(handlePreferences);
