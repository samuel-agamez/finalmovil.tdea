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
