import { Wallet, Bell, Mic, Palette, Cloud } from 'lucide-react';

/** Copy y datos decorativos de la landing (sin FinanceContext). */

export const TRUST_ITEMS = [
  { icon: Cloud, label: 'Se guarda en tu cuenta' },
  { icon: Bell, label: 'Alertas al 30 % y 10 %' },
  { icon: Mic, label: 'Registro por voz' },
  { icon: Palette, label: 'Tema claro u oscuro' },
];

export const STEPS = [
  {
    title: 'Registra tus ingresos',
    text: 'Mesada, beca o freelance. Ese monto es el tope del mes: no puedes gastar de más.',
  },
  {
    title: 'Anota tus gastos',
    text: 'Almuerzo, bus, salidas. Cada movimiento actualiza el saldo al instante.',
  },
  {
    title: 'Recibe alertas',
    text: 'Precaución al 30 % y crítico al 10 %, con aviso dentro de la app.',
  },
];

export const FEATURES = [
  {
    icon: Wallet,
    title: 'Presupuesto con tope',
    text: 'El saldo no puede quedar en negativo. Si no hay ingreso, no hay gasto: así de simple.',
  },
  {
    icon: Bell,
    title: 'Alertas a tiempo',
    text: 'Te avisamos cuando queda poco, aunque el sistema no envíe notificaciones.',
  },
  {
    icon: Mic,
    title: 'Dicta y listo',
    text: 'Di “gasté veinte mil en almuerzo” y el formulario se completa solo.',
  },
  {
    icon: Palette,
    title: 'A tu estilo',
    text: 'Tema claro u oscuro y color de acento. Se ve bien en el celular y en el portátil.',
  },
];

export const PREVIEW_SNAPSHOT = {
  monthLabel: 'Septiembre 2026',
  income: 800000,
  expenses: 576000,
  balance: 224000,
  remainingPercent: 28,
  movements: [
    { emoji: '🍔', description: 'Almuerzo', category: 'Alimentación', amount: 25000 },
    { emoji: '🚌', description: 'Transporte', category: 'Transporte', amount: 8000 },
  ],
};
