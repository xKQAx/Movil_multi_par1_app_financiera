import { DEFAULT_PREFERENCES } from '../../utils/constants.js';
import { requireUser } from '../auth.js';
import { getSql } from '../db.js';
import { allowMethods, parseJsonBody, sendJson, withErrorBoundary } from '../http.js';
import { toClientPreferences } from '../mappers.js';
import { parsePreferencesPayload } from '../payloads.js';

async function readOrCreatePreferences(sql, userId, fallbackName) {
  const rows = await sql`
    SELECT display_name, theme, accent_color, active_month_name
    FROM preferences
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  if (rows[0]) return toClientPreferences(rows[0], fallbackName);

  await sql`
    INSERT INTO preferences (user_id, display_name)
    VALUES (${userId}, ${fallbackName || DEFAULT_PREFERENCES.name})
    ON CONFLICT (user_id) DO NOTHING
  `;
  return { ...DEFAULT_PREFERENCES, name: fallbackName || DEFAULT_PREFERENCES.name };
}

export async function handlePreferences(req, res) {
  if (!allowMethods(req, res, ['GET', 'PUT'])) return;
  await withErrorBoundary(res, async () => {
    const user = await requireUser(req, res);
    if (!user) return;
    const sql = getSql();

    if (req.method === 'GET') {
      const preferences = await readOrCreatePreferences(sql, user.userId, user.name);
      sendJson(res, 200, { preferences });
      return;
    }

    const payload = parsePreferencesPayload(await parseJsonBody(req));
    await sql`
      INSERT INTO preferences (user_id, display_name, theme, accent_color, active_month_name, updated_at)
      VALUES (
        ${user.userId},
        ${payload.name},
        ${payload.theme},
        ${payload.accentColor},
        ${payload.activeMonthName},
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        theme = EXCLUDED.theme,
        accent_color = EXCLUDED.accent_color,
        active_month_name = EXCLUDED.active_month_name,
        updated_at = now()
    `;
    sendJson(res, 200, { preferences: payload });
  });
}
