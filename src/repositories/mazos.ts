import type { Db } from '../db/db';
import type { Mazo, MazoConProgreso } from './tipos';

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
