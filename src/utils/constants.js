import { getTodayISO } from './formatCurrency.js';

export const ROUTES = {
  landing: '/',
  login: '/login',
  register: '/registro',
  dashboard: '/dashboard',
  movements: '/movimientos',
  settings: '/ajustes',
  add: (type) => `/agregar/${type}`,
};

export const ADD_MOVEMENT_TYPES = ['ingreso', 'gasto', 'voz'];

export const INCOME_CATEGORIES = ['Beca', 'Mesada', 'Trabajo', 'Freelance', 'Otro'];
export const EXPENSE_CATEGORIES = [
  'Alimentación',
  'Transporte',
  'Entretenimiento',
  'Salud',
  'Educación',
  'Otro',
];

export const CATEGORY_EMOJIS = {
  Alimentación: '🍔',
  Transporte: '🚌',
  Entretenimiento: '🎮',
  Salud: '💊',
  Educación: '📚',
  Beca: '🎓',
  Mesada: '💰',
  Trabajo: '💼',
  Freelance: '💻',
  Otro: '📌',
};

export const ACCENT_COLORS = {
  blue: { primary: '#3b82f6', primaryDark: '#2563eb', primaryLight: '#dbeafe' },
  green: { primary: '#22c55e', primaryDark: '#16a34a', primaryLight: '#dcfce7' },
  purple: { primary: '#a855f7', primaryDark: '#9333ea', primaryLight: '#f3e8ff' },
};

export const DEFAULT_PREFERENCES = {
  name: 'Estudiante',
  theme: 'light',
  accentColor: 'blue',
  activeMonthName: '',
};

/** Referencias estables para useLocalStorage (evitan recreación por render) */
export const EMPTY_MOVEMENTS = [];
export const EMPTY_CRITICAL_NOTIFIED = {};
export const EMPTY_USERS = [];

export const DEMO_MOVEMENTS = [
  { id: 'demo-1', type: 'income', description: 'Mesada', category: 'Mesada', amount: 500000, date: getTodayISO() },
  { id: 'demo-2', type: 'income', description: 'Trabajo freelance', category: 'Freelance', amount: 300000, date: getTodayISO() },
  { id: 'demo-3', type: 'expense', description: 'Almuerzo', category: 'Alimentación', amount: 25000, date: getTodayISO() },
  { id: 'demo-4', type: 'expense', description: 'Transporte', category: 'Transporte', amount: 40000, date: getTodayISO() },
  { id: 'demo-5', type: 'expense', description: 'Entretenimiento', category: 'Entretenimiento', amount: 80000, date: getTodayISO() },
];
