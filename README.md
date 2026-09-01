# Control Financiero — App móvil para estudiantes

Aplicación de control financiero mensual construida con **React + Vite**.

## Inicio rápido

```bash
cd control-financiero
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador (idealmente Chrome en móvil o modo responsive).

## Funcionalidades

- Registro de ingresos y egresos con validación de saldo
- Dashboard con alertas progresivas (Normal / Precaución / Crítico)
- Notificaciones locales en nivel crítico
- Registro por voz (Web Speech API)
- Tema claro/oscuro y colores de acento
- Persistencia en `localStorage`
- Datos de demostración para presentaciones

## Estructura

```
src/
├── components/     # UI reutilizable
├── pages/          # Pantallas principales
├── context/        # FinanceContext (estado global)
├── hooks/          # useLocalStorage
├── utils/          # Reglas financieras, parser de voz, formato
└── styles/         # CSS global con variables
```

## Reglas de negocio

Centralizadas en `src/utils/financeRules.js`:

- `calculateIncome`, `calculateExpenses`, `calculateBalance`
- `canAddExpense` — bloquea egresos que superen el saldo
- `getBudgetStatus` — NORMAL (>30%), WARNING (≤30%), CRITICAL (≤10%)

## Próximos pasos

- **Compañero:** Mejorar visualización gráfica de gastos por categoría (ver Ajustes)
- **Futuro:** Migración a Supabase para persistencia en la nube
- **Futuro:** PWA, historial mensual, exportación CSV/PDF

## Tecnologías

- React 19 + Vite
- react-router-dom
- lucide-react
- localStorage (Supabase pendiente)
