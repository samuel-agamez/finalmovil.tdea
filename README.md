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

Estado actual: la puerta está en verde (typecheck + lint + formato + 7
pruebas, cobertura 100 % de statements y funciones) y existe la base de
rutas (`app/_layout.tsx` + `app/index.tsx`). Faltan la interfaz de
autenticación, los mazos, SQLite y la sincronización.

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
