import { FalloApi } from '../api/errores';
import * as apiMazos from '../api/mazos';
import * as apiTarjetas from '../api/tarjetas';
import { abrirDb, type Db } from '../db/db';
import * as repoAjustes from '../repositories/ajustes';
import * as repoMazos from '../repositories/mazos';
import * as repoTarjetas from '../repositories/tarjetas';
import type { Mazo, Tarjeta } from '../repositories/tipos';
import { ahoraIso } from './fechas';
import { generarUuid } from './uuid';

const LIMITE_PAGINA = 500;
const MAX_PAGINAS = 20;
const CLAVE_CURSOR = 'ultima_sincronizacion';
const INICIO = '1970-01-01T00:00:00.000Z';

/** Sube al servidor los cambios locales pendientes. Devuelve cuántos se enviaron. */
export async function enviarPendientes(token: string): Promise<number> {
  const db = await abrirDb();
  const mazos = await repoMazos.listarPendientes(db);
  const tarjetas = await repoTarjetas.listarPendientes(db);
  let enviados = 0;
  for (const mazo of mazos) {
    await enviarMazo(db, mazo, token);
    enviados += 1;
  }
  for (const tarjeta of tarjetas) {
    const enviado = await enviarTarjeta(db, tarjeta, token);
    if (enviado) enviados += 1;
  }
  return enviados;
}

/**
 * Sube lo pendiente y baja los cambios del servidor.
 * La app sigue funcionando sin conexión: si la API falla, el error se propaga
 * y los datos locales no se pierden.
 */
export async function sincronizar(token: string): Promise<number> {
  const db = await abrirDb();
  const enviados = await enviarPendientes(token);
  let cursor = (await repoAjustes.leerAjuste(db, CLAVE_CURSOR)) ?? INICIO;
  let cambios = 0;
  for (let vuelta = 0; vuelta < MAX_PAGINAS; vuelta += 1) {
    const pagina = await aplicarPagina(db, token, cursor);
    cambios += pagina.cambios;
    cursor = pagina.cursor;
    if (!pagina.completos) break;
  }
  await repoAjustes.guardarAjuste(db, CLAVE_CURSOR, cursor);
  return enviados + cambios;
}

/** Trae los cambios del servidor y los aplica en local. Devuelve cuántos aplicó. */
export async function traerCambios(token: string, desde: string): Promise<number> {
  const db = await abrirDb();
  const pagina = await aplicarPagina(db, token, desde);
  return pagina.cambios;
}

type Pagina = { cambios: number; completos: boolean; cursor: string };

async function aplicarPagina(db: Db, token: string, desde: string): Promise<Pagina> {
  const mazos = await apiMazos.listarDesde(desde, token);
  const tarjetas = await apiTarjetas.listarDesde(desde, token);
  let cambios = 0;
  for (const mazo of mazos.items) {
    const aplicado = await repoMazos.aplicarCambioRemoto(db, {
      id: mazo.id,
      nombre: mazo.nombre,
      updated_at: mazo.updated_at,
      deleted_at: mazo.deleted_at,
    });
    if (aplicado) cambios += 1;
  }
  for (const tarjeta of tarjetas.items) {
    const aplicado = await aplicarTarjetaRemota(db, tarjeta);
    if (aplicado) cambios += 1;
  }
  const completo = mazos.items.length >= LIMITE_PAGINA || tarjetas.items.length >= LIMITE_PAGINA;
  const ultimo = ultimoCambio([...mazos.items, ...tarjetas.items]);
  const cursor =
    completo && ultimo !== null
      ? ultimo
      : masReciente(mazos.servidor_ahora, tarjetas.servidor_ahora);
  return { cambios, completos: completo, cursor };
}

function ultimoCambio(items: { updated_at: string }[]): string | null {
  let ultimo: string | null = null;
  for (const item of items) {
    if (ultimo === null || item.updated_at > ultimo) ultimo = item.updated_at;
  }
  return ultimo;
}

function masReciente(uno: string, otro: string): string {
  return uno > otro ? uno : otro;
}

async function enviarMazo(db: Db, mazo: Mazo, token: string): Promise<void> {
  if (mazo.deleted === 1) {
    await borrarMazoRemoto(db, mazo, token);
    return;
  }
  const remoteId = await asegurarRemoteId(db, mazo);
  const item = await conError(
    () => apiMazos.guardar(remoteId, { nombre: mazo.nombre, publico: false }, token),
    `No se pudo subir el mazo "${mazo.nombre}"`,
  );
  await repoMazos.marcarSincronizado(db, mazo.id, item.id, item.updated_at);
}

async function borrarMazoRemoto(db: Db, mazo: Mazo, token: string): Promise<void> {
  if (mazo.remote_id === null) {
    await repoMazos.marcarBorradoEnviado(db, mazo.id, ahoraIso());
    return;
  }
  await conError(
    () => apiMazos.eliminar(mazo.remote_id as string, token),
    `No se pudo borrar el mazo "${mazo.nombre}" en el servidor`,
  );
  await repoMazos.marcarBorradoEnviado(db, mazo.id, ahoraIso());
}

async function enviarTarjeta(db: Db, tarjeta: Tarjeta, token: string): Promise<boolean> {
  if (tarjeta.deleted === 1) {
    await borrarTarjetaRemota(db, tarjeta, token);
    return true;
  }
  const mazoId = await repoMazos.remoteIdDeMazo(db, tarjeta.mazo_id);
  if (mazoId === null) {
    throw new Error('La tarjeta pertenece a un mazo que todavía no se ha sincronizado');
  }
  const remoteId = await asegurarRemoteIdTarjeta(db, tarjeta);
  const item = await conError(
    () =>
      apiTarjetas.guardar(
        remoteId,
        {
          mazo_id: mazoId,
          pregunta: tarjeta.pregunta,
          respuesta: tarjeta.respuesta,
          caja: tarjeta.caja,
          proxima_revision: tarjeta.proxima_revision,
        },
        token,
      ),
    `No se pudo subir la tarjeta "${tarjeta.pregunta}"`,
  );
  await repoTarjetas.marcarSincronizado(db, tarjeta.id, item.id, item.updated_at);
  return true;
}

async function borrarTarjetaRemota(db: Db, tarjeta: Tarjeta, token: string): Promise<void> {
  if (tarjeta.remote_id === null) {
    await repoTarjetas.marcarBorradoEnviado(db, tarjeta.id, ahoraIso());
    return;
  }
  await conError(
    () => apiTarjetas.eliminar(tarjeta.remote_id as string, token),
    `No se pudo borrar la tarjeta "${tarjeta.pregunta}" en el servidor`,
  );
  await repoTarjetas.marcarBorradoEnviado(db, tarjeta.id, ahoraIso());
}

async function asegurarRemoteId(db: Db, mazo: Mazo): Promise<string> {
  if (mazo.remote_id !== null) return mazo.remote_id;
  const remoteId = generarUuid();
  await repoMazos.guardarRemoteId(db, mazo.id, remoteId);
  return remoteId;
}

async function asegurarRemoteIdTarjeta(db: Db, tarjeta: Tarjeta): Promise<string> {
  if (tarjeta.remote_id !== null) return tarjeta.remote_id;
  const remoteId = generarUuid();
  await repoTarjetas.guardarRemoteId(db, tarjeta.id, remoteId);
  return remoteId;
}

async function aplicarTarjetaRemota(db: Db, cambio: apiTarjetas.TarjetaRemota): Promise<boolean> {
  const mazo = await repoMazos.obtenerPorRemoteId(db, cambio.mazo_id);
  if (mazo === null) return false;
  return await repoTarjetas.aplicarCambioRemoto(
    db,
    {
      id: cambio.id,
      mazo_id: cambio.mazo_id,
      pregunta: cambio.pregunta,
      respuesta: cambio.respuesta,
      caja: cambio.caja,
      proxima_revision: cambio.proxima_revision,
      updated_at: cambio.updated_at,
      deleted_at: cambio.deleted_at,
    },
    mazo.id,
  );
}

async function conError<T>(accion: () => Promise<T>, mensaje: string): Promise<T> {
  try {
    return await accion();
  } catch (error) {
    // El 401 lo resuelve la capa de sesión renovando el token y reintentando.
    if (error instanceof FalloApi && error.status === 401) throw error;
    if (error instanceof FalloApi && error.status === 404) {
      throw new Error(`${mensaje}: el recurso no existe en el servidor`);
    }
    const detalle = error instanceof Error ? error.message : 'error desconocido';
    throw new Error(`${mensaje}: ${detalle}`);
  }
}
