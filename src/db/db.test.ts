import * as SQLite from 'expo-sqlite';
import { abrirDb, cerrarDb } from './db';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
}));

const abrirMock = jest.mocked(SQLite.openDatabaseAsync);

type DbFalso = SQLite.SQLiteDatabase & { execAsync: jest.Mock; closeAsync: jest.Mock };

function dbFalso(): DbFalso {
  return {
    execAsync: jest.fn().mockResolvedValue(undefined),
    closeAsync: jest.fn().mockResolvedValue(undefined),
  } as unknown as DbFalso;
}

describe('apertura de la base de datos', () => {
  beforeEach(async () => {
    await cerrarDb();
    abrirMock.mockReset();
  });

  it('abre la base, activa claves foráneas y crea las tablas', async () => {
    const falso = dbFalso();
    abrirMock.mockResolvedValue(falso);

    const db = await abrirDb();

    expect(db).toBe(falso);
    expect(abrirMock).toHaveBeenCalledWith('tarjetas.db');
    expect(falso.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    const migracion = falso.execAsync.mock.calls[1]?.[0] as string;
    expect(migracion).toContain('CREATE TABLE IF NOT EXISTS mazo');
    expect(migracion).toContain('CREATE TABLE IF NOT EXISTS tarjeta');
    expect(migracion).toContain('CHECK (caja BETWEEN 1 AND 5)');
  });

  it('reutiliza la misma conexión en llamadas siguientes', async () => {
    const falso = dbFalso();
    abrirMock.mockResolvedValue(falso);

    const primera = await abrirDb();
    const segunda = await abrirDb();

    expect(primera).toBe(segunda);
    expect(abrirMock).toHaveBeenCalledTimes(1);
  });

  it('propaga el error si no puede abrir la base', async () => {
    abrirMock.mockRejectedValue(new Error('sin espacio'));

    await expect(abrirDb()).rejects.toThrow('sin espacio');
  });
});
