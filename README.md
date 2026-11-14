# 10 · Tarjetas de estudio (app)

Mazos de tarjetas pregunta/respuesta con repaso espaciado simple (cajas de
Leitner). App móvil en **Expo + React Native + TypeScript + Expo Router**.

Repositorio hermano: `10-tarjetas-de-estudio-api` (Next.js + Firebase).

## Estado

- `a9c49b5`: **configuración de IA y de calidad** (primer commit).
- `278f55f`: regla pura de Leitner y sus pruebas.

La interfaz, SQLite y la sincronización se construyen en los siguientes
commits.

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

Dependencias de la app (siguiente paso, con permiso):

```bash
npx expo install expo-router expo-sqlite expo-secure-store \
  react-native-gesture-handler react-native-reanimated \
  expo-speech expo-notifications expo-haptics expo-sensors
```

## Scripts

| Script                 | Qué hace                                                   |
| ---------------------- | ---------------------------------------------------------- |
| `npm run check`        | typecheck + lint + formato + pruebas (puerta obligatoria). |
| `npm run typecheck`    | `tsc --noEmit`.                                            |
| `npm run lint`         | ESLint con `--max-warnings 0`.                             |
| `npm run format:check` | Prettier en modo verificación.                             |
| `npm test`             | Jest + jest-expo con cobertura.                            |
| `npm start`            | Expo.                                                      |

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
