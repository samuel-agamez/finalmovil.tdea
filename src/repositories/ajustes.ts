import type { Db } from '../db/db';

export async function leerAjuste(db: Db, clave: string): Promise<string | null> {
  const fila = await db.getFirstAsync<{ valor: string }>(
    'SELECT valor FROM ajuste WHERE clave = ?',
    [clave],
  );
  return fila?.valor ?? null;
}

export async function guardarAjuste(db: Db, clave: string, valor: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO ajuste (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor',
    [clave, valor],
  );
}
