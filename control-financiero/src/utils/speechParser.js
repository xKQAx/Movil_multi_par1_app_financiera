const INCOME_KEYWORDS = ['recibí', 'recibi', 'ingreso', 'gané', 'gane', 'cobré', 'cobre', 'mesada', 'beca'];
const EXPENSE_KEYWORDS = ['gasté', 'gaste', 'gasto', 'pagué', 'pague', 'compré', 'compre'];

const CATEGORY_MAP = {
  alimentacion: 'Alimentación',
  alimentación: 'Alimentación',
  comida: 'Alimentación',
  almuerzo: 'Alimentación',
  transporte: 'Transporte',
  bus: 'Transporte',
  taxi: 'Transporte',
  entretenimiento: 'Entretenimiento',
  cine: 'Entretenimiento',
  salud: 'Salud',
  medicina: 'Salud',
  educacion: 'Educación',
  educación: 'Educación',
  mesada: 'Mesada',
  beca: 'Beca',
  trabajo: 'Trabajo',
  freelance: 'Freelance',
};

const NUMBER_WORDS = {
  cero: 0, uno: 1, un: 1, una: 1, dos: 2, tres: 3, cuatro: 4,
  cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
  veinte: 20, treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
  cien: 100, ciento: 100, doscientos: 200, trescientos: 300,
  cuatrocientos: 400, quinientos: 500, seiscientos: 600,
  setecientos: 700, ochocientos: 800, novecientos: 900,
  mil: 1000, 'dos mil': 2000, 'tres mil': 3000,
};

/** Extrae monto numérico del texto reconocido */
function extractAmount(text) {
  const lower = text.toLowerCase();

  // Buscar números digitales con posible separador de miles
  const digitMatch = lower.match(/(\d[\d.,]*)\s*(?:pesos|cop|mil)?/);
  if (digitMatch) {
    const num = parseFloat(digitMatch[1].replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num)) {
      if (lower.includes('mil') && num < 1000) return num * 1000;
      return num;
    }
  }

  // Buscar palabras numéricas
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (lower.includes(word)) {
      if (lower.includes('mil') && value < 1000) return value * 1000;
      return value;
    }
  }

  return null;
}

/** Detecta categoría por palabras clave en el texto */
function extractCategory(text, type) {
  const lower = text.toLowerCase();

  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }

  return type === 'income' ? 'Otro' : 'Otro';
}

/** Detecta tipo de movimiento (ingreso o egreso) */
function detectType(text) {
  const lower = text.toLowerCase();
  const isIncome = INCOME_KEYWORDS.some((k) => lower.includes(k));
  const isExpense = EXPENSE_KEYWORDS.some((k) => lower.includes(k));

  if (isIncome && !isExpense) return 'income';
  if (isExpense && !isIncome) return 'expense';
  return 'expense';
}

/** Extrae descripción a partir del texto */
function extractDescription(text, category) {
  const cleaned = text
    .replace(/\d[\d.,]*/g, '')
    .replace(/pesos|cop|mil|recibí|recibi|gasté|gaste|de|mi|en|por/gi, '')
    .trim();

  return cleaned || category || 'Movimiento por voz';
}

/**
 * Parser tolerante para comandos de voz en español.
 * Retorna objeto parcial que el usuario puede corregir.
 */
export function parseSpeechCommand(text) {
  if (!text || typeof text !== 'string') {
    return { success: false, error: 'Texto vacío' };
  }

  const type = detectType(text);
  const amount = extractAmount(text);
  const category = extractCategory(text, type);
  const description = extractDescription(text, category);

  if (!amount || amount <= 0) {
    return {
      success: false,
      error: 'No se pudo detectar el monto',
      partial: { type, description, category, amount: '' },
    };
  }

  return {
    success: true,
    data: { type, description, category, amount },
  };
}

/** Verifica soporte de Speech Recognition */
export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
