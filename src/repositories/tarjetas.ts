import type { Db } from '../db/db';
import type { NuevaTarjeta, Tarjeta } from './tipos';

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
