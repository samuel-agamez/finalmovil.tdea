import type { Db } from '../db/db';
import type { CambioTarjeta, NuevaTarjeta, Tarjeta } from './tipos';

const COLUMNAS =
  'id, mazo_id, pregunta, respuesta, caja, proxima_revision, remote_id, updated_at, deleted, pending';

export async function listarPorMazo(db: Db, mazoId: number): Promise<Tarjeta[]> {
  return await db.getAllAsync<Tarjeta>(
    `SELECT ${COLUMNAS} FROM tarjeta WHERE mazo_id = ? AND deleted = 0 ORDER BY id`,
    [mazoId],
  );
}

export async function crearTarjeta(db: Db, datos: NuevaTarjeta): Promise<number> {
  const ahora = new Date().toISOString();
  const resultado = await db.runAsync(
    `INSERT INTO tarjeta (mazo_id, pregunta, respuesta, caja, proxima_revision, updated_at, pending)
     VALUES (?, ?, ?, 1, ?, ?, 1)`,
    [datos.mazo_id, datos.pregunta, datos.respuesta, ahora, ahora],
  );
  return resultado.lastInsertRowId;
}

export async function actualizarTarjeta(
  db: Db,
  id: number,
  cambios: Partial<Pick<Tarjeta, 'pregunta' | 'respuesta' | 'caja' | 'proxima_revision'>>,
): Promise<void> {
  const claves = Object.keys(cambios) as (keyof typeof cambios)[];
  if (claves.length === 0) return;
  const asignaciones = claves.map((clave) => `${clave} = ?`).join(', ');
  const valores = claves.map((clave) => cambios[clave] ?? null);
  const ahora = new Date().toISOString();
  await db.runAsync(
    `UPDATE tarjeta SET ${asignaciones}, updated_at = ?, pending = 1 WHERE id = ?`,
    [...valores, ahora, id],
  );
}

export async function borrarTarjeta(db: Db, id: number): Promise<void> {
  const ahora = new Date().toISOString();
  await db.runAsync('UPDATE tarjeta SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?', [
    ahora,
    id,
  ]);
}

export async function vencidasDelMazo(db: Db, mazoId: number, ahora: string): Promise<Tarjeta[]> {
  return await db.getAllAsync<Tarjeta>(
    `SELECT ${COLUMNAS} FROM tarjeta
      WHERE mazo_id = ? AND deleted = 0 AND proxima_revision <= ?
      ORDER BY proxima_revision`,
    [mazoId, ahora],
  );
}

export async function obtenerTarjeta(db: Db, id: number): Promise<Tarjeta | null> {
  return await db.getFirstAsync<Tarjeta>(
    `SELECT ${COLUMNAS} FROM tarjeta WHERE id = ? AND deleted = 0`,
    [id],
  );
}

/** Tarjetas con cambios locales pendientes de subir al servidor. */
export async function listarPendientes(db: Db): Promise<Tarjeta[]> {
  return await db.getAllAsync<Tarjeta>(
    `SELECT ${COLUMNAS} FROM tarjeta WHERE pending = 1 ORDER BY id`,
  );
}

/** Guarda el UUID generado por el cliente antes de enviarlo. */
export async function guardarRemoteId(db: Db, id: number, remoteId: string): Promise<void> {
  await db.runAsync('UPDATE tarjeta SET remote_id = ? WHERE id = ?', [remoteId, id]);
}

/** Marca la tarjeta como sincronizada y guarda los datos del servidor. */
export async function marcarSincronizado(
  db: Db,
  id: number,
  remoteId: string,
  updatedAt: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE tarjeta SET remote_id = ?, updated_at = ?, deleted = 0, pending = 0 WHERE id = ?',
    [remoteId, updatedAt, id],
  );
}

/** Marca la tarjeta localmente borrada como ya enviada al servidor. */
export async function marcarBorradoEnviado(db: Db, id: number, updatedAt: string): Promise<void> {
  await db.runAsync('UPDATE tarjeta SET updated_at = ?, pending = 0 WHERE id = ?', [updatedAt, id]);
}

/** Busca una tarjeta por su identificador remoto (UUID). */
export async function obtenerPorRemoteId(db: Db, remoteId: string): Promise<Tarjeta | null> {
  return await db.getFirstAsync<Tarjeta>(`SELECT ${COLUMNAS} FROM tarjeta WHERE remote_id = ?`, [
    remoteId,
  ]);
}

/**
 * Aplica un cambio del servidor sobre la tarjeta. Gana la última escritura:
 * si el cambio local es más nuevo que el remoto, se conserva lo local.
 */
export async function aplicarCambioRemoto(
  db: Db,
  cambio: CambioTarjeta,
  mazoLocalId: number,
): Promise<boolean> {
  const local = await db.getFirstAsync<Tarjeta>(
    `SELECT ${COLUMNAS} FROM tarjeta WHERE remote_id = ?`,
    [cambio.id],
  );
  if (local !== null && local.pending === 1 && local.updated_at !== null) {
    if (local.updated_at > cambio.updated_at) return false;
  }
  const borrado = cambio.deleted_at !== null ? 1 : 0;
  const revision = cambio.proxima_revision ?? cambio.updated_at;
  const caja = Math.min(5, Math.max(1, Math.trunc(cambio.caja)));
  if (local !== null) {
    await db.runAsync(
      `UPDATE tarjeta SET pregunta = ?, respuesta = ?, caja = ?, proxima_revision = ?,
        updated_at = ?, deleted = ?, pending = 0 WHERE id = ?`,
      [cambio.pregunta, cambio.respuesta, caja, revision, cambio.updated_at, borrado, local.id],
    );
    return true;
  }
  await db.runAsync(
    `INSERT INTO tarjeta (mazo_id, pregunta, respuesta, caja, proxima_revision,
      remote_id, updated_at, deleted, pending) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      mazoLocalId,
      cambio.pregunta,
      cambio.respuesta,
      caja,
      revision,
      cambio.id,
      cambio.updated_at,
      borrado,
    ],
  );
  return true;
}
