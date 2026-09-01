# Control Financiero — App móvil para estudiantes

Aplicación de control financiero mensual construida con **React + Vite + Tailwind CSS**.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador (idealmente Chrome en móvil o modo responsive).

```bash
npm run test    # reglas financieras + parser de voz
npm run build   # comprobación de producción
```

## Funcionalidades

- Landing pública y autenticación **local** (login / registro en este dispositivo)
- Rutas protegidas: dashboard, movimientos, agregar y ajustes
- Registro de ingresos y egresos con validación de saldo **según el mes de la fecha** del movimiento
- Dashboard con alertas progresivas (Normal / Precaución 30 % / Crítico 10 %)
- Aviso crítico in-app (banner) + Notification API si el usuario concede permiso con un toque
- Registro por voz (Whisper **base** en el navegador; Chrome o Edge recomendados)
- Tema claro/oscuro, 3 acentos, alias y nombre/emoji del mes (pantalla Ajustes)
- Persistencia en `localStorage` (por usuario en esta instalación)
- Datos de demostración para presentaciones

## Rutas

| Ruta | Acceso |
| --- | --- |
| `/` | Landing (pública). Si hay sesión, redirige a `/dashboard` |
| `/login` | Iniciar sesión |
| `/registro` | Crear cuenta |
| `/dashboard` | Inicio (requiere sesión) |
| `/movimientos` | Listado del mes activo |
| `/agregar/:type` | Nuevo ingreso, gasto o voz (`ingreso` / `gasto` / `voz`) |
| `/ajustes` | Preferencias, notificaciones y cierre de sesión |

## Autenticación local

La sesión se guarda en `localStorage` (`cf_session`, `cf_users`). Las contraseñas se almacenan con hash SHA-256 **solo para la demo**; no es un backend seguro.

Crea una cuenta en `/registro` (nombre, correo y contraseña de al menos 6 caracteres) y úsala en `/login`. El alias del registro se copia al perfil si aún no lo has cambiado en Ajustes.

## Estructura

```
src/
├── components/     # UI reutilizable (rutas, banner crítico, formularios)
├── pages/          # Landing, Login, Registro y pantallas de la app
├── context/        # AuthContext (sesión) y FinanceContext (dinero)
├── hooks/          # useLocalStorage, toasts globales
├── lib/            # Stub de Supabase para la compañera
├── utils/          # Reglas financieras, parser de voz, formato, validación auth
└── styles/         # Tokens + componentes (Tailwind v4)
```

## Reglas de negocio

Centralizadas en `src/utils/financeRules.js`:

- `calculateIncome`, `calculateExpenses`, `calculateBalance`
- `canAddExpense` — bloquea egresos que superen el saldo **del mes de la fecha del movimiento**
- `canApplyMovementChange` — impide borrar/editar un ingreso si los gastos de ese mes quedarían por encima
- `getBudgetStatus` — NORMAL (>30%), WARNING (≤30%), CRITICAL (≤10%)

El dashboard y los listados siguen filtrando por el **mes calendario actual**. Si registras un movimiento con fecha de otro mes, el formulario avisa que cuenta para ese mes.

## Registro por voz

La voz **no usa Web Speech API** (el dictado nativo de Chrome). Ese motor suele fallar con `error: network` —el mensaje “necesita conexión a internet”— aunque el micrófono esté permitido y haya red, sobre todo con `es-CO`.

En su lugar, la app **graba el audio** (`getUserMedia` + `MediaRecorder`) y lo transcribe **en el navegador** con Whisper (`@huggingface/transformers`, modelo **`Xenova/whisper-base`**, multilingual). No hace falta API key ni backend. Base reconoce mucho mejor el español que `whisper-tiny`, sin bajar el modelo small (~244 MB).

Mientras grabas, el texto **aparece en vivo** (como subtítulos): cada ~1 s se transcribe el audio acumulado o, si ya va largo, una ventana de los últimos ~7 s. Al **Detener**, se transcribe el audio **completo** y eso es lo que rellena el formulario.

### Cómo grabar

1. Abre `/agregar/voz` o el botón **Grabar** al registrar un ingreso/gasto (Chrome o Edge recomendados).
2. Acepta el permiso del micrófono si el navegador lo pide.
3. Toca **Grabar** y habla: en pantalla verás **Grabando — te escucho** y el texto en vivo. Si Whisper tarda en arrancar, un medidor de volumen confirma que el micrófono sí captura.
4. Toca **Detener**. El texto final se copia al formulario; revísalo y guarda.

Ejemplos: “Gasté ocho mil pesos en transporte”, “Recibí 200 mil de mesada”, “Pagué veinte mil de almuerzo”.

### Primera carga del modelo

La primera vez **descarga el reconocedor (mejor modelo, ~75 MB)** desde Hugging Face (hace falta internet esa vez) y lo deja en la caché del navegador. Las siguientes veces reutiliza esa caché. Si no hay WebGPU, corre en WASM (más lento; la UI lo avisa). Puedes escribir el movimiento a mano si niegas el micrófono o si la transcripción falla. El botón pasa a **Reintentar**.

## Tarea pendiente — Compañera

No hace falta instalar `@supabase/supabase-js` hasta que ella lo conecte. Hay un stub en `src/lib/supabase.js`. **No conectar Supabase en este parcial.**

1. Crear proyecto Supabase y tablas `profiles`, `movements`, `preferences` con RLS
2. Reemplazar `AuthContext` local por Supabase Auth (`signInWithPassword` / `signUp`)
3. Persistir movimientos y preferencias en Postgres
4. (Opcional) PWA con service worker

El gráfico de gastos por categoría y el pulido de UI de este parcial **ya están** en la app.

## Tecnologías

- React 19 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- react-router-dom
- lucide-react
- `@huggingface/transformers` (Whisper **base**, transcripción en el cliente)
- localStorage (Supabase pendiente — compañera)
