# Bitácora de IA — app

Formato por entrada: **propósito**, **evidencia**, **validación**, **decisión**.
Se agregan las entradas de cada sesión real; no se borran las correcciones.

## 2026-11-14 · Configuración inicial

- **Propósito**: crear el primer commit con reglas de IA, permisos, sandbox,
  hook, scripts de calidad y CI antes de generar código de la app.
- **Evidencia**: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`,
  `.claude/hooks/protect.mjs`, `eslint.config.mjs`, `tsconfig.json`,
  `.github/workflows/ci.yml`, `ia/`.
- **Validación**: `node --test .claude/hooks/protect.test.mjs` (10 pruebas) y
  revisión manual de la sintaxis contra la documentación de Claude Code.
- **Decisión**: se versiona todo en el primer commit. Las dependencias de la
  app se instalan después, con permiso, para no inventar versiones.

## 2026-11-14 · Caso rechazado 1: `next lint`

- **Propósito**: definir el script de lint de la API.
- **Evidencia**: la documentación de Next.js 16 indica que `next lint` se
  eliminó y que se usa el CLI de ESLint.
- **Validación**: `eslint.config.mjs` con `eslint-config-next/core-web-vitals`
  y `eslint-config-next/typescript`.
- **Decisión**: se rechazó `next lint`; el script es `eslint .`.

## 2026-11-14 · Caso rechazado 2: `.claudeignore`

- **Propósito**: impedir que la IA leyera `.env`.
- **Evidencia**: la documentación de Claude Code dice que `.claudeignore` no
  tiene efecto; las reglas `Read` son las que bloquean.
- **Validación**: `permissions.deny` con `Read(**/.env*)` y la excepción
  `Read(!.env.example)`.
- **Decisión**: se rechazó `.claudeignore`; se usan permisos + sandbox + hook.

## 2026-11-14 · Regla de Leitner

- **Propósito**: implementar la transición de cajas (acierto sube, fallo vuelve
  a la caja 1) como función pura, antes de la UI y de SQLite.
- **Evidencia**: `src/services/leitner.ts` y `src/services/leitner.test.ts`.
- **Validación**: revisión de la tabla de transiciones y de los límites 1..5.
  `npm test` queda pendiente hasta instalar las dependencias de la app.
- **Decisión**: no se mezcla con React Native ni con la base de datos; así se
  prueba aislada y se reutiliza en la sesión de estudio.

## 2026-11-14 · Caso rechazado 3: `Bash(curl *)` como frontera

- **Propósito**: bloquear la salida a internet con una regla simple.
- **Evidencia**: la misma documentación advierte que `Bash(curl *)` no detiene
  `/usr/bin/curl` ni `sh -c 'curl ...'`.
- **Validación**: el hook `protect.mjs` revisa el texto completo y el sandbox
  limita los dominios permitidos.
- **Decisión**: se mantiene `deny` como primera capa, pero no se presenta como
  frontera única; se documentan sus límites en `ia/CONFIGURACION.md`.

## 2026-11-15 · Puerta `npm run check` en verde

- **Propósito**: dejar la puerta completa en verde antes de empezar la
  interfaz, sin saltársela.
- **Evidencia**: `package.json` (dependencias del SDK 58), `tsconfig.json`
  (`"types": ["jest"]`), `eslint.config.mjs` (import `eslint-config-expo/flat.js`),
  `app.json` (4 plugins) y `package-lock.json`.
- **Validación**: `npx expo install --check` → «Dependencies are up to date»;
  `npm run check` pasa entero (typecheck + lint + formato + 6 pruebas,
  cobertura 100 % stmts/funcs, 92,85 % ramas); `npm run build` empaqueta
  Android con Metro.
- **Decisión**: cuatro arreglos de compatibilidad, cada uno con su causa
  medida antes de tocar nada:
  1. `tsc` no cargaba `@types/jest` → `"types": ["jest"]` en el `tsconfig`
     (comprobado quitándolo: sin eso, `describe`/`it`/`expect` no resuelven).
  2. `typescript@7.0.2` (compilador nativo, sin `TypeFlags`) rompía
     `typescript-eslint` → `typescript@~6.0.3`, la versión que pide el
     template de Expo SDK 58 (`npx expo install --check` lo confirma).
  3. `eslint@10` eliminó `context.getFilename()` y `eslint-plugin-react`
     7.37.5 (peer `^9.7`, lo más reciente que existe) todavía lo usa →
     `eslint@^9.39.5`, la línea de mantenimiento que ya usa la API hermana.
  4. `@typescript-eslint/parser` y `eslint-import-resolver-typescript`
     quedaron anidados bajo `eslint-config-expo` por el conflicto de peers
     anterior → se borraron sus dos entradas del lock y `npm install` los
     volvió a colocar en la raíz (`npm dedupe` no bastó).
     Además: import corregido a `eslint-config-expo/flat.js` (en ESM el
     directorio `flat/` no se puede importar) y `app.json` formateado.
- **Decisión extra**: se corrigió la puerta en lugar de salirse de ella;
  ninguna de las cuatro correcciones añade reglas ni relaja la calidad.

## 2026-11-15 · Base de Expo Router

- **Propósito**: crear la estructura de rutas con una prueba que falla
  primero, antes de construir pantallas.
- **Evidencia**: `app/_layout.tsx`, `app/index.tsx`,
  `src/components/inicio.tsx`, `src/components/inicio.test.tsx` y
  `app.json` (`scheme: tarjetas`, `android.package` e
  `ios.bundleIdentifier: tdea.tarjetas`).
- **Validación**: la prueba se escribió primero y falló (no existía
  `app/`); después pasa con `renderRouter()`. `npm run check` → 7 pruebas,
  cobertura 100 %; `npm run build` exporta Android y `npx expo config
--type public` muestra el scheme y los identificadores.
- **Decisión**: la pantalla vive en `src/components/inicio.tsx` y
  `app/index.tsx` solo la reexporta, para que la cobertura
  (`collectCoverageFrom: src/**`) la mida. Los tests de rutas van en
  `src/` y no en `app/`: Expo Router trataría `app/*.test.tsx` como una
  ruta más.
- **Decisión extra**: `renderRouter()` recibe timeout propio (30 s) porque
  compila expo-router con Babel en frío; sin eso, Jest falla a los 5 s.
  `expo-router/testing-library` ya viene en expo-router 58: no se instaló
  ningún paquete nuevo.

## 2026-11-16 · Pantalla de login y registro

- **Propósito**: conectar la interfaz de acceso con la API existente
  (solo el contrato del README, sin funcionalidades nuevas).
- **Evidencia**: `src/components/login.tsx` (formulario con `useAcceso`),
  `app/login.tsx` (reexport), `src/components/login.test.tsx` (5 pruebas),
  botón «Entrar» en `inicio.tsx` y la pantalla `login` en `_layout.tsx`.
- **Validación**: la prueba se escribió primero y falló (no existía la
  pantalla); después pasa. `npm run check` → typecheck + lint + formato +
  27 pruebas, cobertura 95 %.
- **Hallazgo**: en React Native Testing Library **v14 `render` y
  `fireEvent` son `async`**. Sin `await`, `screen` nunca registra el
  árbol (error «`render` function has not been called») y los eventos no
  se despachan (el `TextInput` conserva `value=""` y el botón no llega a
  llamar a la API). Se diagnosticó con una prueba temporal que imprimía
  `render.toString()` → `async function render(...)`, y con
  `fireEvent.changeText` seguido de lectura inmediata del `value`.
- **Decisión**: se descartó `renderRouter()` para este test (arrastraba
  estado global entre pruebas y provocaba llamadas `act()` solapadas) y
  se usó `render()` con `expo-router` mockeado (`useRouter` →
  `{ replace }`), que es más rápido y aísla cada prueba.
- **Decisión extra**: la lógica de envío vive en el hook `useAcceso()`
  para que el componente `Login` respete el límite de 50 líneas por
  función que exige ESLint.

## 2026-11-16 — Base de datos local, pantallas y sensor de voz

- **Propósito**: cerrar el Hito 2 (SQLite, CRUD, búsqueda y funcionamiento
  sin conexión) y el Hito 1 (pantallas navegables, formularios validados y
  un sensor), que era el hueco más grande del enunciado.
- **Evidencia**: `src/db/db.ts` (apertura y migraciones), `src/repositories/`
  (`mazos.ts`, `tarjetas.ts`, `tipos.ts` con SQL parametrizado),
  `src/services/` (`mazos.ts`, `tarjetas.ts`, `repaso.ts`, `vencidas.ts`,
  `fechas.ts`, `validaciones.ts` y `leitner.ts`), `src/sensors/use-voz.ts`,
  `src/components/` (`tarjeta-estudio.tsx`, `mazo-fila.tsx`,
  `formulario-mazo.tsx`, `formulario-tarjeta.tsx`, `lista-tarjetas.tsx`,
  `sesion-estudio.tsx`) y las rutas `app/(tabs)/index.tsx`,
  `app/mazo/[id].tsx`, `app/tarjeta/nueva.tsx` y `app/estudio/[id].tsx`.
- **Validación**: `npm run check` en verde con las pruebas nuevas de los
  servicios, los repositorios, la base de datos y los componentes. Los
  criterios de aceptación del enunciado tienen pruebas propias: una tarjeta
  en caja 2 que se acierta pasa a caja 3 con revisión posterior, un fallo
  vuelve a la caja 1, y sin tarjetas vencidas la lista queda vacía (la
  pantalla muestra «¡Todo al día!»). La tarjeta de estudio se voltea al
  tocarla y se anuncia por lector de pantalla.
- **Hallazgo**: `expo-speech` no tiene `isAvailableAsync` (a diferencia de
  los sensores); su comprobación equivalente es `getAvailableVoicesAsync()`.
  Con la lista de voces vacía el hook no lee y la app no se rompe.
- **Hallazgo**: en RNTL v14 `renderHook` también es asíncrono y `unmount()`
  devuelve una promesa: sin `await`, la limpieza del sensor no se ejecuta
  y la prueba falla. Además, un `TypeError` dentro de `waitFor` aborta los
  reintentos, así que las aserciones usan `result.current?.propiedad`.
- **Decisión**: la portada se sustituyó por la pestaña de mazos porque
  Expo Router no admite dos rutas para `/` (`app/index.tsx` y
  `app/(tabs)/index.tsx`); ahora la raíz redirige al login si no hay
  sesión. El borrado de un mazo pide confirmación indicando cuántas
  tarjetas se pierden, como exige el enunciado.
- **Decisión**: los gestos se apoyan siempre en botones equivalentes con
  `accessibilityLabel`, porque un lector de pantalla no ejecuta gestos
  complejos.
