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
