# 10 · Tarjetas de estudio (app)

Mazos de tarjetas pregunta/respuesta con repaso espaciado simple (cajas de
Leitner). App móvil en **Expo + React Native + TypeScript + Expo Router**.

Repositorio: https://github.com/samuel-agamez/finalmovil.tdea

Repositorio hermano: [`repositario_de_prueba`](https://github.com/samuel-agamez/repositario_de_prueba)
(API en Next.js + Firebase).

## Estado

- `78ddcbf`: **configuración de IA y de calidad** (primer commit).
- `05c20f3`: regla pura de Leitner y sus pruebas.
- `a4a34b3`: enlaces y hashes del README.
- `0001142`: puerta `npm run check` en verde con las versiones del SDK 58.
- `96f6df9`: base de Expo Router y pantalla de inicio.
- `c860220`: cliente HTTP de la API (`pedir`, `FalloApi`).
- `28f9729`: autenticación y sesión en `expo-secure-store`.
- `b16acb8`: pantalla de **registro** separada de la de login.
- `82c8495`: **SQLite local** (migraciones), repositorios de mazos y
  tarjetas y servicios puros (Leitner, vencidas, validaciones).
- `f267092`: tarjeta de estudio que voltea y **sensor de voz** (`expo-speech`).

Estado actual: la puerta está en verde (typecheck + lint + formato + pruebas
con cobertura ≥ 80 % en statements, ramas, líneas y funciones) con:

- **Autenticación**: login y registro contra la API, sesión en
  `expo-secure-store`.
- **Datos locales**: SQLite con `mazo` y `tarjeta` (más `remote_id`,
  `updated_at`, `deleted` y `pending` para sincronizar), migraciones
  automáticas y repositorios con SQL parametrizado.
- **Pantallas**: mazos con progreso y búsqueda, tarjetas del mazo, alta de
  tarjeta y sesión de repaso con volteo, cajas de Leitner, «¡Todo al día!» y
  lectura en voz alta.
- **Gestos y sensores**: deslizar a la derecha o izquierda para marcar
  acierto o fallo (con botones equivalentes), e inclinación del teléfono
  (DeviceMotion) como alternativa al gesto.

## Rutas y pantallas

| Ruta            | Contenido                                              |
| --------------- | ------------------------------------------------------ |
| `(tabs)/index`  | Mazos con progreso, buscador y alta de mazo            |
| `mazo/[id]`     | Tarjetas del mazo, añadir, estudiar y eliminar         |
| `estudio/[id]`  | Sesión de repaso: volteo, acierto/fallo y voz          |
| `tarjeta/nueva` | Alta de tarjeta con validación (máximo 300 caracteres) |
| `login`         | Iniciar sesión                                         |
| `registro`      | Crear cuenta                                           |

La raíz `/` muestra los mazos y, si no hay sesión guardada, redirige al
login.

## Base de datos local

`src/db/db.ts` abre `tarjetas.db` y aplica las migraciones al arrancar:

```sql
CREATE TABLE mazo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  remote_id TEXT, updated_at TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE tarjeta (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mazo_id INTEGER NOT NULL REFERENCES mazo(id) ON DELETE CASCADE,
  pregunta TEXT NOT NULL, respuesta TEXT NOT NULL,
  caja INTEGER NOT NULL DEFAULT 1 CHECK (caja BETWEEN 1 AND 5),
  proxima_revision TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remote_id TEXT, updated_at TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  pending INTEGER NOT NULL DEFAULT 0
);
```

`pending = 1` marca lo que falta por subir a la API y `remote_id` guarda el
UUID del documento en Firestore para que reintentar una escritura no duplique.

## Requisitos

- Node.js 22 o superior.
- Para el sandbox de Claude Code en Windows: **WSL2 (Ubuntu)** con
  `bubblewrap` y `socat` (`sudo apt-get install bubblewrap socat`).

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # ajusta EXPO_PUBLIC_API_URL
npm start
```

La variable `EXPO_PUBLIC_API_URL` es **pública** (no es un secreto) y solo
apunta al despliegue de la API. Si no defines ninguna, la app usa por defecto
`https://10-tarjetas-de-estudio-api.vercel.app`, así que funciona sin
`.env.local` tanto en el teléfono como en la compilación del APK.

Dependencias instaladas con `npx expo install` (versiones del SDK 58) más
tres fijadas a mano por compatibilidad:

- `typescript@~6.0.3`: Expo 58 espera esta versión; la 7 ya no expone la
  API que `typescript-eslint` necesita y rompe `npm run lint`.
- `eslint@^9.39.5`: `eslint-plugin-react` (vía `eslint-config-expo`) todavía
  no soporta ESLint 10.
- `react-native-web@~0.21.4` y `react-native-worklets` como dependencia
  directa, como pide el checklist.

## Scripts

| Script                 | Qué hace                                                   |
| ---------------------- | ---------------------------------------------------------- |
| `npm run check`        | typecheck + lint + formato + pruebas (puerta obligatoria). |
| `npm run typecheck`    | `tsc --noEmit`.                                            |
| `npm run lint`         | ESLint con `--max-warnings 0`.                             |
| `npm run format:check` | Prettier en modo verificación.                             |
| `npm test`             | Jest + jest-expo con cobertura.                            |
| `npm start`            | Expo.                                                      |
| `npm run build`        | `expo export --platform android`.                          |

## Configuración de IA

- `AGENTS.md`: reglas del proyecto (≤ 100 líneas).
- `CLAUDE.md`: solo `@AGENTS.md`.
- `.claude/settings.json`: permisos, sandbox, red y hook.
- `.claude/hooks/protect.mjs`: hook `PreToolUse` que bloquea con código 2.
- `ia/`: configuración, pruebas de contención y bitácora.

Prueba rápida del hook:

```bash
node --test .claude/hooks/protect.test.mjs
```

## Seguridad

- La app **no** contiene `firebaseConfig` ni claves: solo conoce
  `EXPO_PUBLIC_API_URL` y los tokens del usuario.
- Los tokens se guardan en `expo-secure-store`, nunca en `AsyncStorage`.
- `.env*` está ignorado; `.env.example` solo tiene valores falsos.
