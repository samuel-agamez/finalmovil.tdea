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

## 2026-11-17 — La app llama a la API aunque no exista `.env.local`

- **Propósito**: corregir el error 500 que la app mostraba al iniciar sesión
  y cargar los mazos.
- **Evidencia**: `src/api/cliente.ts` (`API_POR_DEFECTO` como valor por
  defecto de `base()`) y su prueba en `src/api/cliente.test.ts`.
- **Validación**: la prueba se escribió primero y falló con
  `Expected: "https://10-tarjetas-de-estudio-api.vercel.app/api/mazos"` frente
  a `Received: "/api/mazos"`; después `npm run check` quedó en verde (31
  suites, 183 pruebas, cobertura 92,4 % statements y 84,58 % ramas).
- **Hallazgo**: sin `.env.local`, `process.env.EXPO_PUBLIC_API_URL` era
  `undefined` y la app pedía rutas relativas (`/api/auth/login`); el
  servidor de Metro respondía 500 y ese era el error que se veía en el
  teléfono. La variable sigue siendo la única forma de cambiar el
  destino, pero ya no es obligatoria.
- **Decisión**: el valor por defecto es la URL pública del despliegue en
  Vercel, que no es un secreto; así la app funciona en el teléfono y en la
  compilación del APK sin copiar archivos `.env`.
- **Hallazgo**: el CLI de Expo reescribió `package.json` y
  `package-lock.json` al alinear las versiones con el SDK 58 (`expo`
  58.0.26, `expo-router` 58.0.32, `expo-sqlite` 58.0.18, `jest-expo`
  58.0.15) y también tocó `tsconfig.json`; `tsconfig.json` se restauró a
  `HEAD` porque el usuario pidió no modificarlo.
- **Hallazgo**: `npm audit` reporta avisos del árbol de herramientas de
  Expo, Jest y React Native (picomatch, tinyglobby, minimatch) cuya única
  "solución" es bajar de versión mayor (Expo 52, Jest 29); no afectan al
  código que viaja en el APK, así que no se cambian las dependencias.
- **Hallazgo**: un `jest` zombi de la sesión anterior seguía corriendo desde
  la noche anterior y saturaba la máquina, provocando timeouts falsos en dos
  suites; se cerró y las pruebas volvieron a ser estables.

## 2026-11-17 — Pantalla azul de Expo Go y `expo-font` faltante

- **Propósito**: diagnosticar la pantalla azul «Something went wrong» que
  aparecía al abrir la app desde Expo Go y dejar el proyecto listo para
  compilar el APK.
- **Evidencia**: `npx expo-doctor` (19/20 checks), `src/api/cliente.ts`
  (valor por defecto también cuando `EXPO_PUBLIC_API_URL` viene vacía),
  `src/api/cliente.test.ts` (prueba del caso vacío) y `app.json`
  (plugin `expo-font`).
- **Validación**: la prueba nueva falló primero con
  `Received: "   /api/mazos"`; después `npm run check` quedó en verde (31
  suites, 184 pruebas) y `npx expo-doctor` en 20/20.
- **Hallazgo**: el error de login no venía de que faltara la URL: el
  `.env.local` del proyecto ya exportaba
  `EXPO_PUBLIC_API_URL=https://10-tarjetas-de-estudio-api.vercel.app` y el
  bundle de Metro lo lleva embebido. El valor por defecto queda como red de
  seguridad, y además cubre el caso de la variable definida pero vacía, que
  `??` no detecta.
- **Hallazgo**: `expo-doctor` avisaba de que faltaba la dependencia peer
  `expo-font` (la exige `@expo/vector-icons`): dentro de Expo Go funciona
  porque Expo Go la trae, pero **fuera de Expo Go la app revienta al
  abrir**, es decir, el APK habría fallado al iniciar.
- **Decisión**: se instaló `expo-font` con permiso explícito del usuario y
  se añadió su plugin a `app.json`, porque sin eso la entrega final
  (APK) no arranca.
- **Hallazgo**: el teléfono no llegaba a conectarse al servidor de
  desarrollo tras reiniciarlo, y Expo Go solo admite SDK 58 desde la
  versión publicada en las tiendas; una versión anterior de Expo Go abre
  cualquier proyecto SDK 58 con esa misma pantalla genérica, sin detalle
  del error.
- **Decisión**: mientras el usuario actualiza Expo Go, el proyecto queda
  verificado con `expo-doctor`, la puerta de calidad y un bundle de
  producción compilado.

## 2026-11-17 — Proyecto enlazado con EAS y compilación del APK

- **Propósito**: generar la entrega final (APK de Android) con EAS Cloud y
  dejar documentado el proceso.
- **Evidencia**: `app.json` (`owner: samuel-velasquez` y
  `extra.eas.projectId`), `eas.json` (perfil `preview` con
  `buildType: apk`), `README.md` (sección «Generar el APK») y el build
  `417694d7-73e4-41ae-83d9-8f129924fec6` del proyecto
  `@samuel-velasquez/10-tarjetas-de-estudio-app`.
- **Validación**: `npm run check` en verde (31 suites, 184 pruebas) antes de
  subir; el proyecto quedó enlazado con `eas init --account
samuel-velasquez`, EAS creó el keystore remoto y el `versionCode` 1.
- **Hallazgo**: `eas build:configure` exige stdin interactivo (pregunta el
  propietario); en un entorno no interactivo falla y se resuelve con
  `eas init --account <cuenta> --non-interactive`, que hace lo mismo y
  escribe el `projectId` en `app.json`.
- **Hallazgo**: la primera subida del tarball falló con `ECONNRESET` contra
  el almacenamiento de Google (256 KB de 417 KB); es un error de red
  transitorio y el reintento subió bien. El comando en primer plano se
  quedó esperando hasta agotar el tiempo, pero el build sí se había
  creado: se comprobó con `eas build:list`.
- **Decisión**: el perfil `preview` genera un `.apk` instalable sin pasar
  por Play Store, que es lo que pide el enunciado. El perfil `production`
  queda en `.aab` para una publicación futura.
- **Decisión**: el build no necesita variables de entorno en EAS porque la
  URL de la API va embebida en el bundle; así la entrega no depende de
  subir archivos `.env` ni de configurar secretos en el panel de EAS.

## 2026-11-17 — APK de entrega compilado y verificado

- **Propósito**: cerrar la entrega del enunciado con el APK instalable y
  comprobar, sobre el archivo real, que no lleva secretos ni apunta a una
  dirección equivocada.
- **Evidencia**: build `417694d7-73e4-41ae-83d9-8f129924fec6` del proyecto
  `@samuel-velasquez/10-tarjetas-de-estudio-app` (perfil `preview`, estado
  `FINISHED`), artefacto
  `https://expo.dev/artifacts/eas/XlPtTm1VZ-iU27IyHwJUd8lmu5FLqxjipq9bVa4JvGI.apk`
  y `README.md` (sección «Build de entrega»).
- **Validación**: el `.apk` se descargó (94,7 MB, SHA-256
  `99D1B608692B1C29C2AC8CC80155863FD9B849359236535059110F72BBAC5AB6`) y se
  inspeccionó como archivo ZIP: 1330 entradas, `classes.dex`,
  `AndroidManifest.xml` y `assets/index.android.bundle` (3,2 MB). El bloque
  de firma APK v2 está presente (magic `APK Sig Block 42` justo antes del
  directorio central). El bundle **sí** contiene
  `https://10-tarjetas-de-estudio-api.vercel.app` y **no** contiene
  `firebaseConfig` ni ninguna clave con formato `AIza...`.
- **Hallazgo**: el magic de firma no aparece en los últimos 4 KB del
  archivo, porque el bloque de firma va antes del directorio central; hay
  que localizar el EOCD para leer el desplazamiento real.
- **Decisión**: se documenta en el README el enlace, el tamaño y el hash
  para que la entrega sea reproducible y verificable, y se deja constancia
  de que el APK no transporta credenciales: la app sigue hablando con la
  API, que es la única que conoce Firebase.

## 2026-11-18 — Revisión de la app y corrección de tres defectos

- **Propósito**: revisar la app entregada antes de enviarla al profesor y
  corregir los defectos encontrados al leer el código (la puerta de calidad
  y `expo-doctor` ya estaban en verde, así que ningún defecto era de
  compilación).
- **Evidencia**: `src/api/sesion.ts` (`ejecutarConSesion`),
  `src/hooks/use-mazos.ts`, `app/(tabs)/index.tsx`,
  `src/services/sincronizacion.ts` (`conError`) y
  `src/services/semillas.ts`; pruebas nuevas en `src/api/sesion.test.ts`,
  `src/hooks/use-mazos.test.tsx` y `src/services/sincronizacion.test.ts`.
- **Validación**: `npm run check` en verde con 32 suites y **200 pruebas**;
  cobertura 92,78 % statements / 85,17 % ramas. Antes de tocar el código se
  escribieron las pruebas que fallaban (5 en la sesión, 8 en el hook y 1 en
  la sincronización) y se comprobó el rojo. También se probó la API real:
  registro, login, `PUT` de mazo y tarjeta, `GET ?since=`, `DELETE`,
  `POST /api/auth/refresh` (200) y `401` sin token.
- **Hallazgo**: `refrescar()` existía y estaba probado, pero **nadie lo
  llamaba**. El token de Firebase dura 3600 s; pasada la hora la
  sincronización devolvía 401 y la app lo mostraba como «sin conexión».
- **Hallazgo**: `sincronizarEnFondo` vivía dentro de `cargar`, que dependía
  del término de búsqueda, así que **cada tecla del buscador** lanzaba las
  semillas y dos peticiones de red.
- **Hallazgo**: tras sincronizar no se releía SQLite, así que los cambios
  traídos del servidor no aparecían hasta volver a entrar a la pantalla.
- **Hallazgo**: `conError` envolvía el 401 en un `Error` genérico, de modo
  que la renovación de sesión nunca se habría disparado al subir un cambio
  pendiente; ahora el 401 se propaga tal cual.
- **Decisión**: `cargarDatosPrueba()` devuelve si sembró la base, para
  releer la lista solo cuando de verdad cambió algo. La sincronización
  corre una vez al abrir, con el token renovado y un solo reintento.
- **Pendiente conocido**: una doble inclinación muy rápida en «manos
  libres» puede contar dos veces la misma tarjeta; no afecta a la entrega.
