import {
  canAddExpense,
  canApplyMovementChange,
  generateId,
} from '../../utils/financeRules.js';
import { getMonthYearFromDate } from '../../utils/formatCurrency.js';
import { requireUser } from '../auth.js';
import { getSql } from '../db.js';
import { allowMethods, movementIdFromReq, parseJsonBody, sendJson, withErrorBoundary } from '../http.js';
import { toClientMovement } from '../mappers.js';
import { demoMovementsForToday, parseMovementPayload } from '../payloads.js';

async function listUserMovements(sql, userId) {
  const rows = await sql`
    SELECT id, type, description, category, amount, date
    FROM movements
    WHERE user_id = ${userId}
    ORDER BY date DESC, id DESC
  `;
  return rows.map(toClientMovement);
}

function denyFromRules(res, validation) {
  const messages = {
    no_income: 'Registra primero un ingreso en ese mes para poder registrar gastos.',
    exceeds_balance: 'Este gasto supera el saldo de ese mes.',
    would_exceed_expenses:
      'Este cambio dejaría los gastos de ese mes por encima de los ingresos.',
    invalid_amount: 'El monto no es válido.',
  };
  sendJson(res, 409, {
    error: messages[validation.reason] || 'No se pudo aplicar el movimiento.',
    reason: validation.reason,
    maxAllowed: validation.maxAllowed,
  });
}

export async function handleMovementsCollection(req, res) {
  if (!allowMethods(req, res, ['GET', 'POST', 'DELETE'])) return;
  await withErrorBoundary(res, async () => {
    const user = await requireUser(req, res);
    if (!user) return;
    const sql = getSql();

    if (req.method === 'GET') {
      const movements = await listUserMovements(sql, user.userId);
      sendJson(res, 200, { movements });
      return;
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM movements WHERE user_id = ${user.userId}`;
      sendJson(res, 200, { movements: [] });
      return;
    }

    const parsed = parseMovementPayload(await parseJsonBody(req));
    if (parsed.error) {
      sendJson(res, parsed.status, { error: parsed.error });
      return;
    }

    const current = await listUserMovements(sql, user.userId);
    const { type, description, category, amount, date } = parsed.data;

    if (type === 'expense') {
      const { month, year } = getMonthYearFromDate(date);
      const validation = canAddExpense(current, month, year, amount);
      if (!validation.allowed) {
        denyFromRules(res, validation);
        return;
      }
    }

    const id = generateId();
    const rows = await sql`
      INSERT INTO movements (id, user_id, type, description, category, amount, date)
      VALUES (${id}, ${user.userId}, ${type}, ${description}, ${category}, ${amount}, ${date})
      RETURNING id, type, description, category, amount, date
    `;
    sendJson(res, 201, { movement: toClientMovement(rows[0]) });
  });
}

export async function handleMovementById(req, res) {
  if (!allowMethods(req, res, ['PUT', 'DELETE'])) return;
  await withErrorBoundary(res, async () => {
    const user = await requireUser(req, res);
    if (!user) return;

    const id = movementIdFromReq(req);
    if (!id) {
      sendJson(res, 400, { error: 'Falta el id del movimiento.' });
      return;
    }

    const sql = getSql();
    const current = await listUserMovements(sql, user.userId);
    const existing = current.find((item) => item.id === id);
    if (!existing) {
      sendJson(res, 404, { error: 'Movimiento no encontrado.' });
      return;
    }

    if (req.method === 'DELETE') {
      if (existing.type === 'income') {
        const next = current.filter((item) => item.id !== id);
        const balanceCheck = canApplyMovementChange(next, [existing.date]);
        if (!balanceCheck.allowed) {
          denyFromRules(res, balanceCheck);
          return;
        }
      }
      await sql`DELETE FROM movements WHERE id = ${id} AND user_id = ${user.userId}`;
      sendJson(res, 200, { ok: true });
      return;
    }

    const parsed = parseMovementPayload(await parseJsonBody(req));
    if (parsed.error) {
      sendJson(res, parsed.status, { error: parsed.error });
      return;
    }

    const updates = parsed.data;
    const next = current.map((item) => (item.id === id ? { ...item, ...updates } : item));

    if (existing.type === 'expense' || updates.type === 'expense') {
      const { month, year } = getMonthYearFromDate(updates.date);
      const validation = canAddExpense(current, month, year, updates.amount, id);
      if (!validation.allowed) {
        denyFromRules(res, validation);
        return;
      }
    }

    if (existing.type === 'income') {
      const balanceCheck = canApplyMovementChange(next, [existing.date, updates.date]);
      if (!balanceCheck.allowed) {
        denyFromRules(res, balanceCheck);
        return;
      }
    }

    const rows = await sql`
      UPDATE movements
      SET
        type = ${updates.type},
        description = ${updates.description},
        category = ${updates.category},
        amount = ${updates.amount},
        date = ${updates.date}
      WHERE id = ${id} AND user_id = ${user.userId}
      RETURNING id, type, description, category, amount, date
    `;
    if (!rows[0]) {
      sendJson(res, 404, { error: 'Movimiento no encontrado.' });
      return;
    }
    sendJson(res, 200, { movement: toClientMovement(rows[0]) });
  });
}

export async function handleDemoMovements(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  await withErrorBoundary(res, async () => {
    const user = await requireUser(req, res);
    if (!user) return;

    const sql = getSql();
    const demo = demoMovementsForToday();

    await sql.transaction([
      sql`DELETE FROM movements WHERE user_id = ${user.userId}`,
      ...demo.map(
        (movement) => sql`
          INSERT INTO movements (id, user_id, type, description, category, amount, date)
          VALUES (
            ${movement.id},
            ${user.userId},
            ${movement.type},
            ${movement.description},
            ${movement.category},
            ${movement.amount},
            ${movement.date}
          )
        `
      ),
    ]);

    sendJson(res, 200, { movements: demo });
  });
}
