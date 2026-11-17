import type { Db } from '../db/db';
import type { CambioMazo, Mazo, MazoConProgreso } from './tipos';

const CONSULTA_PROGRESO = `
  SELECT m.id, m.nombre, m.remote_id, m.updated_at, m.deleted, m.pending,
         COUNT(t.id) AS total,
         SUM(CASE WHEN t.caja = 5 THEN 1 ELSE 0 END) AS dominadas,
         SUM(CASE WHEN t.caja < 5 THEN 1 ELSE 0 END) AS en_progreso
    FROM mazo m
    LEFT JOIN tarjeta t ON t.mazo_id = m.id AND t.deleted = 0`;

export async function listarMazos(db: Db): Promise<MazoConProgreso[]> {
  return await db.getAllAsync<MazoConProgreso>(
    `${CONSULTA_PROGRESO} WHERE m.deleted = 0 GROUP BY m.id ORDER BY m.nombre COLLATE NOCASE`,
  );
}

export async function buscarMazos(db: Db, termino: string): Promise<MazoConProgreso[]> {
  const patron = `%${termino.trim()}%`;
  return await db.getAllAsync<MazoConProgreso>(
    `${CONSULTA_PROGRESO} WHERE m.deleted = 0 AND m.nombre LIKE ? GROUP BY m.id ORDER BY m.nombre COLLATE NOCASE`,
    [patron],
  );
}

export async function obtenerMazo(db: Db, id: number): Promise<Mazo | null> {
  return await db.getFirstAsync<Mazo>(
    'SELECT id, nombre, remote_id, updated_at, deleted, pending FROM mazo WHERE id = ? AND deleted = 0',
    [id],
  );
}

export async function crearMazo(db: Db, nombre: string): Promise<number> {
  const ahora = new Date().toISOString();
  try {
    const resultado = await db.runAsync(
      'INSERT INTO mazo (nombre, updated_at, pending) VALUES (?, ?, 1)',
      [nombre, ahora],
    );
    return resultado.lastInsertRowId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Ya existe un mazo con ese nombre');
    }
    throw error;
  }
}

export async function actualizarMazo(db: Db, id: number, nombre: string): Promise<void> {
  const ahora = new Date().toISOString();
  try {
    await db.runAsync('UPDATE mazo SET nombre = ?, updated_at = ?, pending = 1 WHERE id = ?', [
      nombre,
      ahora,
      id,
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('Ya existe un mazo con ese nombre');
    }
    throw error;
  }
}

export async function borrarMazo(db: Db, id: number): Promise<void> {
  const ahora = new Date().toISOString();
  await db.runAsync('UPDATE mazo SET deleted = 1, updated_at = ?, pending = 1 WHERE id = ?', [
    ahora,
    id,
  ]);
  await db.runAsync(
    'UPDATE tarjeta SET deleted = 1, updated_at = ?, pending = 1 WHERE mazo_id = ? AND deleted = 0',
    [ahora, id],
  );
}

export async function contarTarjetasActivas(db: Db, mazoId: number): Promise<number> {
  const fila = await db.getFirstAsync<{ total: number }>(
    'SELECT COUNT(*) AS total FROM tarjeta WHERE mazo_id = ? AND deleted = 0',
    [mazoId],
  );
  return fila?.total ?? 0;
}

/** Mazos con cambios locales pendientes de subir al servidor. */
export async function listarPendientes(db: Db): Promise<Mazo[]> {
  return await db.getAllAsync<Mazo>(
    'SELECT id, nombre, remote_id, updated_at, deleted, pending FROM mazo WHERE pending = 1 ORDER BY id',
  );
}

/** Guarda el UUID generado por el cliente antes de enviarlo. */
export async function guardarRemoteId(db: Db, id: number, remoteId: string): Promise<void> {
  await db.runAsync('UPDATE mazo SET remote_id = ? WHERE id = ?', [remoteId, id]);
}

/** Marca el mazo como sincronizado y guarda los datos del servidor. */
export async function marcarSincronizado(
  db: Db,
  id: number,
  remoteId: string,
  updatedAt: string,
): Promise<void> {
  await db.runAsync(
    'UPDATE mazo SET remote_id = ?, updated_at = ?, deleted = 0, pending = 0 WHERE id = ?',
    [remoteId, updatedAt, id],
  );
}

/** Marca el mazo localmente borrado como ya enviado al servidor. */
export async function marcarBorradoEnviado(db: Db, id: number, updatedAt: string): Promise<void> {
  await db.runAsync('UPDATE mazo SET updated_at = ?, pending = 0 WHERE id = ?', [updatedAt, id]);
}

/** Busca un mazo por su identificador remoto (UUID). */
export async function obtenerPorRemoteId(db: Db, remoteId: string): Promise<Mazo | null> {
  return await db.getFirstAsync<Mazo>(
    'SELECT id, nombre, remote_id, updated_at, deleted, pending FROM mazo WHERE remote_id = ?',
    [remoteId],
  );
}

/** Devuelve el UUID remoto del mazo, o null si todavía no tiene. */
export async function remoteIdDeMazo(db: Db, id: number): Promise<string | null> {
  const fila = await db.getFirstAsync<{ remote_id: string | null }>(
    'SELECT remote_id FROM mazo WHERE id = ?',
    [id],
  );
  return fila?.remote_id ?? null;
}

/**
 * Aplica un cambio del servidor. Gana la última escritura: si el cambio local
 * es más nuevo que el del servidor, se conserva lo local.
 */
export async function aplicarCambioRemoto(db: Db, cambio: CambioMazo): Promise<boolean> {
  const local = await db.getFirstAsync<Mazo>(
    'SELECT id, nombre, remote_id, updated_at, deleted, pending FROM mazo WHERE remote_id = ?',
    [cambio.id],
  );
  if (local !== null && local.pending === 1 && local.updated_at !== null) {
    if (local.updated_at > cambio.updated_at) return false;
  }
  const borrado = cambio.deleted_at !== null ? 1 : 0;
  if (local !== null) {
    await db.runAsync(
      'UPDATE mazo SET nombre = ?, updated_at = ?, deleted = ?, pending = 0 WHERE id = ?',
      [cambio.nombre, cambio.updated_at, borrado, local.id],
    );
    return true;
  }
  return await insertarRemoto(db, cambio, borrado);
}

async function insertarRemoto(db: Db, cambio: CambioMazo, borrado: number): Promise<boolean> {
  try {
    await db.runAsync(
      'INSERT INTO mazo (nombre, remote_id, updated_at, deleted, pending) VALUES (?, ?, ?, ?, 0)',
      [cambio.nombre, cambio.id, cambio.updated_at, borrado],
    );
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      await db.runAsync(
        'UPDATE mazo SET remote_id = ?, updated_at = ?, deleted = ?, pending = 0 WHERE nombre = ?',
        [cambio.id, cambio.updated_at, borrado, cambio.nombre],
      );
      return true;
    }
    throw error;
  }
}
