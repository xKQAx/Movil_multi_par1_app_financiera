const INCOME_VERBS = [
  'recibi', 'ingreso', 'gane', 'cobre', 'dieron', 'depositaron', 'pagaron',
];
const EXPENSE_VERBS = [
  'gaste', 'gasto', 'pague', 'compre', 'costo', 'sali',
];
const INCOME_HINTS = ['mesada', 'beca', 'sueldo', 'salario', 'freelance', 'trabajo'];
const EXPENSE_HINTS = [
  'almuerzo', 'comida', 'transporte', 'bus', 'taxi', 'uber', 'cine', 'salud',
];

const EXPENSE_CATEGORY_KEYWORDS = {
  alimentacion: 'Alimentación',
  comida: 'Alimentación',
  almuerzo: 'Alimentación',
  desayuno: 'Alimentación',
  cena: 'Alimentación',
  mercado: 'Alimentación',
  transporte: 'Transporte',
  bus: 'Transporte',
  taxi: 'Transporte',
  uber: 'Transporte',
  transmi: 'Transporte',
  entretenimiento: 'Entretenimiento',
  cine: 'Entretenimiento',
  netflix: 'Entretenimiento',
  salud: 'Salud',
  medicina: 'Salud',
  farmacia: 'Salud',
  educacion: 'Educación',
  universidad: 'Educación',
  matricula: 'Educación',
};

const INCOME_CATEGORY_KEYWORDS = {
  mesada: 'Mesada',
  beca: 'Beca',
  trabajo: 'Trabajo',
  sueldo: 'Trabajo',
  salario: 'Trabajo',
  freelance: 'Freelance',
  contrato: 'Freelance',
};

// Alineado con INCOME_CATEGORIES / EXPENSE_CATEGORIES en constants.js
const INCOME_CATEGORY_VALUES = new Set([...Object.values(INCOME_CATEGORY_KEYWORDS), 'Otro']);
const EXPENSE_CATEGORY_VALUES = new Set([...Object.values(EXPENSE_CATEGORY_KEYWORDS), 'Otro']);

const UNITS = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4,
  cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9,
};
const TEENS = {
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
};
const TENS = {
  veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
};
const HUNDREDS = {
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300,
  cuatrocientos: 400, quinientos: 500, seiscientos: 600,
  setecientos: 700, ochocientos: 800, novecientos: 900,
};
const VEINTI = {
  veintiun: 21, veintiuno: 21, veintiuna: 21,
  veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
  veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};

const FILLER_WORDS = new Set([
  'pesos', 'peso', 'cop', 'de', 'en', 'por', 'mi', 'mis', 'el', 'la', 'los', 'las',
  'un', 'una', 'del', 'al', 'y', 'a', 'con', 'me', 'mil', 'millon', 'millones',
  'que', 'para', 'hoy', 'ayer',
]);
const VERB_WORDS = new Set([...INCOME_VERBS, ...EXPENSE_VERBS]);

/** Quita artefactos típicos de Whisper (corchetes, comillas) sin tocar el comando. */
export function cleanTranscript(text) {
  return String(text || '')
    .replace(/\[.*?\]/g, ' ')
    .replace(/^\s*["'«»“”]+|["'«»“”]+\s*$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normaliza texto oral: minúsculas, sin tildes, miles con coma/punto, sin moneda. */
export function normalizeSpeechText(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[$€]/g, ' ')
    .replace(/\b\d{1,3}(?:[.,]\d{3})+\b/g, (match) => match.replace(/[.,]/g, ''))
    .trim();
}

export function tokenizeSpeech(text) {
  return normalizeSpeechText(text)
    .split(/[^a-z0-9.]+/)
    .filter(Boolean);
}

/** Elige la categoría válida para el tipo; si no calza, "Otro". */
export function categoryForType(category, type) {
  const valid = type === 'income' ? INCOME_CATEGORY_VALUES : EXPENSE_CATEGORY_VALUES;
  return valid.has(category) ? category : 'Otro';
}

function parseDigitToken(token) {
  if (/^\d{1,3}([.,]\d{3})+$/.test(token)) {
    return Number(token.replace(/[.,]/g, ''));
  }
  if (/^\d+$/.test(token)) return Number(token);
  if (/^\d+,\d{1,2}$/.test(token)) return parseFloat(token.replace(',', '.'));
  return null;
}

function wordValue(word) {
  if (UNITS[word] != null) return UNITS[word];
  if (TEENS[word] != null) return TEENS[word];
  if (TENS[word] != null) return TENS[word];
  if (HUNDREDS[word] != null) return HUNDREDS[word];
  if (VEINTI[word] != null) return VEINTI[word];
  return null;
}

/**
 * Parser de números en español colombiano (tokens completos, no substring).
 * "ocho mil", "doscientos mil", "ciento cincuenta mil".
 */
function parseSpanishNumberFromTokens(tokens, startIndex) {
  let i = startIndex;
  let total = 0;
  let current = 0;
  let consumed = 0;

  while (i < tokens.length) {
    const word = tokens[i];
    if (word === 'y') {
      i += 1;
      consumed += 1;
      continue;
    }

    const value = wordValue(word);
    if (value != null) {
      current += value;
      i += 1;
      consumed += 1;
      continue;
    }

    if (word === 'mil') {
      total += (current === 0 ? 1 : current) * 1000;
      current = 0;
      i += 1;
      consumed += 1;
      continue;
    }

    if (word === 'millon' || word === 'millones') {
      const group = current === 0 ? 1 : current;
      total = (total + group) * 1_000_000;
      current = 0;
      i += 1;
      consumed += 1;
      continue;
    }

    break;
  }

  const amount = total + current;
  return consumed > 0 && amount > 0 ? { value: amount, consumed } : null;
}

function pickBestAmount(candidates) {
  if (candidates.length === 0) return null;
  return candidates.reduce((best, item) => {
    if (item.span > best.span) return item;
    if (item.span === best.span && item.value > best.value) return item;
    return best;
  }).value;
}

/** Extrae monto: dígitos, miles con punto (8.000), "200 mil" y números en palabras. */
export function extractAmount(text) {
  const tokens = tokenizeSpeech(text);
  const candidates = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const digit = parseDigitToken(tokens[i]);
    if (digit != null) {
      let value = digit;
      let span = 1;
      const next = tokens[i + 1];
      if (next === 'mil' && value < 1000) {
        value *= 1000;
        span = 2;
      } else if (next === 'millon' || next === 'millones') {
        value *= 1_000_000;
        span = 2;
      }
      if (value > 0) candidates.push({ value, span });
      continue;
    }

    const parsed = parseSpanishNumberFromTokens(tokens, i);
    if (parsed) candidates.push({ value: parsed.value, span: parsed.consumed });
  }

  return pickBestAmount(candidates);
}

function matchKeywordMap(tokens, map) {
  for (const token of tokens) {
    if (map[token]) return map[token];
  }
  return null;
}

function extractCategory(tokens, type) {
  const primary = type === 'income' ? INCOME_CATEGORY_KEYWORDS : EXPENSE_CATEGORY_KEYWORDS;
  const found = matchKeywordMap(tokens, primary);
  if (found) return found;
  return 'Otro';
}

function detectType(tokens) {
  const isIncome = tokens.some((t) => INCOME_VERBS.includes(t));
  const isExpense = tokens.some((t) => EXPENSE_VERBS.includes(t));

  if (isIncome && !isExpense) return 'income';
  if (isExpense && !isIncome) return 'expense';
  if (isIncome && isExpense) return 'expense';

  if (tokens.some((t) => INCOME_HINTS.includes(t))) return 'income';
  if (tokens.some((t) => EXPENSE_HINTS.includes(t))) return 'expense';
  return 'expense';
}

function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function extractDescription(tokens, category) {
  const kept = tokens.filter((token) => {
    if (parseDigitToken(token) != null) return false;
    if (FILLER_WORDS.has(token)) return false;
    if (VERB_WORDS.has(token)) return false;
    if (wordValue(token) != null) return false;
    return true;
  });

  const joined = kept.join(' ').trim();
  return capitalize(joined) || category || 'Movimiento por voz';
}

/**
 * Parser tolerante para comandos de voz en español colombiano.
 * Puro: no usa `window`. El usuario siempre puede corregir el resultado en el form.
 */
export function parseSpeechCommand(text) {
  const cleaned = cleanTranscript(text);
  if (!cleaned) {
    return { success: false, error: 'Texto vacío. Dicta de nuevo o escribe los datos a mano.' };
  }

  const tokens = tokenizeSpeech(cleaned);
  const type = detectType(tokens);
  const amount = extractAmount(cleaned);
  const category = extractCategory(tokens, type);
  const description = extractDescription(tokens, category);
  const payload = { type, description, category, amount: amount || '' };

  if (!amount || amount <= 0) {
    return {
      success: false,
      error: 'No se pudo detectar el monto. Di por ejemplo “gasté ocho mil en transporte” o escríbelo a mano.',
      partial: payload,
    };
  }

  return {
    success: true,
    data: { ...payload, amount },
  };
}
