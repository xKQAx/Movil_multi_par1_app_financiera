# Control Financiero — App móvil para estudiantes

Aplicación de control financiero mensual con **React + Vite + Tailwind CSS**, persistencia en **Neon (Postgres)** y API **serverless en Vercel**.

## Inicio rápido (local)

Necesitas `DATABASE_URL` y `JWT_SECRET` en un archivo `.env` (nunca lo subas a git). Copia `.env.example` y rellena los valores.

```bash
npm install
npm run migrate    # crea las tablas en Neon (contra tu .env)
npm run db:tables  # confirma public.users y cuenta usuarios (sin correos)
npm run dev:full   # API en :3001 + Vite en :5173
```

`npm run dev` solo arranca Vite. Sin la API, login y movimientos no funcionan: usa `dev:full`, o dos terminales (`npm run dev:api` y `npm run dev`).

Abre `http://localhost:5173`. Vite hace proxy de `/api` hacia `http://127.0.0.1:3001`.

```bash
npm run test    # reglas financieras + parser de voz
npm run build   # comprobación de producción (no incluye secretos)
```

## Variables de entorno

Solo en **servidor**: `.env` local y el panel de Vercel → Settings → Environment Variables (Production, Preview y Development).

| Nombre | Dónde |
| --- | --- |
| `DATABASE_URL` | Vercel + `.env`. Connection string de Neon (pooled). **Nunca** `VITE_DATABASE_URL`. |
| `JWT_SECRET` | **Obligatorio en Vercel** (mínimo 16 caracteres). En local, si falta, hay fallback solo en desarrollo. |

Si Vercel y local deben compartir el mismo usuario, usa la **misma** `DATABASE_URL`. Si la migración local apuntó a otra rama, corre `npm run migrate` otra vez contra tu `.env`.

Después de crear o cambiar variables en Vercel, haz **Redeploy**. Sin `JWT_SECRET` en producción, el registro puede devolver 409 (el email ya está) pero el **login falla** al firmar la cookie.

Diagnóstico en el deploy: `GET /api/health` responde `{ "db": true/false, "jwtConfigured": true/false }` **sin** exponer la URL.

Las cuentas antiguas de `localStorage` **no se copian** a Neon: crea la cuenta de nuevo en `/registro`.

## Base de datos (desarrolladores)

`npm run migrate` crea las tablas. `npm run db:tables` confirma que existen (sin imprimir correos). La app **no** muestra instrucciones de Neon en Ajustes.

## Funcionalidades

- Landing pública y autenticación real (registro / login / cookie httpOnly)
- Rutas protegidas: dashboard, movimientos, agregar y ajustes
- Registro de ingresos y egresos con validación de saldo **según el mes de la fecha** del movimiento (cliente y servidor)
- Dashboard con alertas progresivas (Normal / Precaución 30 % / Crítico 10 %)
- Aviso crítico in-app (banner) + Notification API si el usuario concede permiso con un toque
- Registro por voz (Whisper **base** en el navegador; Chrome o Edge recomendados)
- Tema claro/oscuro, 3 acentos, alias y nombre/emoji del mes (se guardan en Neon)
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

## Autenticación

La sesión es una cookie **httpOnly** (`SameSite=Lax; Path=/`; `Secure` en HTTPS/Vercel) emitida por `/api/auth/login` y `/api/auth/register`. No se fija un `Domain` incorrecto. El navegador la envía con `credentials: 'include'`. En producción, SPA y `/api` son el mismo origen en Vercel. `/api/auth/me` responde **401** si no hay cookie (por ejemplo, si el login falló): es normal.

Contraseñas: **bcryptjs** en el servidor. JWT: **jose**.

## Estructura

```
api/                # Handlers Vercel (nodejs); reexportan src/server
db/migrations/      # SQL de Neon
scripts/            # migrate, API local, dev:full
src/
├── components/     # UI reutilizable
├── pages/          # Landing, Login, Registro y pantallas de la app
├── context/        # AuthContext (API) y FinanceContext (API + reglas)
├── hooks/
├── lib/            # apiClient (fetch al backend)
├── server/         # db, auth, rutas (una sola implementación)
├── utils/          # Reglas financieras, parser de voz, formato
└── styles/
```

## Reglas de negocio

Centralizadas en `src/utils/financeRules.js` y revalidadas en la API al crear/editar/borrar:

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

## Instalar la app (PWA)

En **Ajustes → Instalar app** hay instrucciones para Chrome (computador y Android) y Safari (iPhone). Hace falta un **redeploy en Vercel** para que el dominio de producción registre el service worker. En local, `npm run dev:full` también lo registra.

## Tecnologías

- React 19 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- react-router-dom
- lucide-react
- `@huggingface/transformers` (Whisper **base**, transcripción en el cliente)
- Neon (`@neondatabase/serverless`) + API Vercel (`bcryptjs`, `jose`)
