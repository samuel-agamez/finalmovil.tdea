import type { Db } from '../db/db';
import {
  actualizarTarjeta,
  borrarTarjeta,
  crearTarjeta,
  listarPorMazo,
  obtenerTarjeta,
  vencidasDelMazo,
} from './tarjetas';

type DbFalso = {
  db: Db;
  getAll: jest.Mock;
  getFirst: jest.Mock;
  run: jest.Mock;
};

function dbFalso(): DbFalso {
  const getAll = jest.fn();
  const getFirst = jest.fn();
  const run = jest.fn();
  return {
    db: { getAllAsync: getAll, getFirstAsync: getFirst, runAsync: run } as unknown as Db,
    getAll,
    getFirst,
    run,
  };
}

const AHORA = '2026-11-16T10:00:00.000Z';

describe('repositorio de tarjetas', () => {
  it('lista las tarjetas activas de un mazo', async () => {
    const falso = dbFalso();
    const filas = [{ id: 1, pregunta: '¿2+2?', caja: 1 }];
    falso.getAll.mockResolvedValue(filas);

    const resultado = await listarPorMazo(falso.db, 3);

    expect(resultado).toEqual(filas);
    expect(falso.getAll).toHaveBeenCalledWith(expect.any(String), [3]);
    expect(falso.getAll.mock.calls[0]?.[0] as string).toContain('deleted = 0');
  });

  it('crea una tarjeta nueva en la caja 1', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ lastInsertRowId: 12 });

    const id = await crearTarjeta(falso.db, {
      mazo_id: 3,
      pregunta: '¿2+2?',
      respuesta: '4',
    });

    expect(id).toBe(12);
    const consulta = falso.run.mock.calls[0]?.[0] as string;
    expect(consulta).toContain('VALUES (?, ?, ?, 1, ?, ?, 1)');
    expect(falso.run).toHaveBeenCalledWith(consulta, [
      3,
      '¿2+2?',
      '4',
      expect.any(String),
      expect.any(String),
    ]);
  });

  it('actualiza los campos dados y marca pendiente', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await actualizarTarjeta(falso.db, 12, { caja: 3, proxima_revision: AHORA });

    const consulta = falso.run.mock.calls[0]?.[0] as string;
    expect(consulta).toContain('caja = ?');
    expect(consulta).toContain('proxima_revision = ?');
    expect(consulta).toContain('pending = 1');
    expect(falso.run.mock.calls[0]?.[1]).toEqual([3, AHORA, expect.any(String), 12]);
  });

  it('no toca la base si no hay cambios', async () => {
    const falso = dbFalso();

    await actualizarTarjeta(falso.db, 12, {});

    expect(falso.run).not.toHaveBeenCalled();
  });

  it('borra de forma lógica', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await borrarTarjeta(falso.db, 12);

    expect(falso.run.mock.calls[0]?.[0]).toContain('deleted = 1');
    expect(falso.run.mock.calls[0]?.[1]).toEqual([expect.any(String), 12]);
  });

  it('consulta las vencidas de un mazo hasta una fecha', async () => {
    const falso = dbFalso();
    falso.getAll.mockResolvedValue([]);

    await vencidasDelMazo(falso.db, 3, AHORA);

    expect(falso.getAll).toHaveBeenCalledWith(expect.stringContaining('proxima_revision <= ?'), [
      3,
      AHORA,
    ]);
  });

  it('obtiene una tarjeta activa por id', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ id: 12, caja: 2 });

    const tarjeta = await obtenerTarjeta(falso.db, 12);

    expect(tarjeta?.caja).toBe(2);
    expect(falso.getFirst).toHaveBeenCalledWith(expect.any(String), [12]);
  });
});
