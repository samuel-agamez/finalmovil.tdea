import * as SQLite from 'expo-sqlite';

export type Db = SQLite.SQLiteDatabase;

const NOMBRE_ARCHIVO = 'tarjetas.db';

let instancia: Db | null = null;

const MIGRACION = `
  CREATE TABLE IF NOT EXISTS mazo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS tarjeta (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mazo_id INTEGER NOT NULL REFERENCES mazo(id) ON DELETE CASCADE,
    pregunta TEXT NOT NULL,
    respuesta TEXT NOT NULL,
    caja INTEGER NOT NULL DEFAULT 1 CHECK (caja BETWEEN 1 AND 5),
    proxima_revision TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remote_id TEXT,
    updated_at TEXT,
    deleted INTEGER NOT NULL DEFAULT 0,
    pending INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_tarjeta_mazo ON tarjeta (mazo_id);
  CREATE INDEX IF NOT EXISTS idx_tarjeta_revision ON tarjeta (proxima_revision);
`;

export async function abrirDb(): Promise<Db> {
  if (instancia !== null) return instancia;
  const db = await SQLite.openDatabaseAsync(NOMBRE_ARCHIVO);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(MIGRACION);
  instancia = db;
  return instancia;
}

/** Cierra la conexión y permite volver a abrirla. */
export async function cerrarDb(): Promise<void> {
  if (instancia === null) return;
  await instancia.closeAsync();
  instancia = null;
}
