import type { Db } from '../db/db';
import {
  actualizarMazo,
  borrarMazo,
  buscarMazos,
  contarTarjetasActivas,
  crearMazo,
  listarMazos,
  obtenerMazo,
} from './mazos';

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

describe('repositorio de mazos', () => {
  it('lista mazos con su progreso de cajas', async () => {
    const falso = dbFalso();
    const filas = [{ id: 1, nombre: 'Biología', total: 4, dominadas: 1, en_progreso: 3 }];
    falso.getAll.mockResolvedValue(filas);

    const resultado = await listarMazos(falso.db);

    expect(resultado).toEqual(filas);
    const consulta = falso.getAll.mock.calls[0]?.[0] as string;
    expect(consulta).toContain('LEFT JOIN tarjeta');
    expect(consulta).toContain('m.deleted = 0');
  });

  it('busca por nombre con comodines', async () => {
    const falso = dbFalso();
    falso.getAll.mockResolvedValue([]);

    await buscarMazos(falso.db, '  Bio  ');

    expect(falso.getAll).toHaveBeenCalledWith(expect.any(String), ['%Bio%']);
  });

  it('obtiene un mazo activo por id', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ id: 5, nombre: 'Química' });

    const mazo = await obtenerMazo(falso.db, 5);

    expect(mazo?.nombre).toBe('Química');
    expect(falso.getFirst).toHaveBeenCalledWith(expect.any(String), [5]);
  });

  it('crea un mazo y devuelve su id', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ lastInsertRowId: 9 });

    const id = await crearMazo(falso.db, 'Biología');

    expect(id).toBe(9);
    const consulta = falso.run.mock.calls[0]?.[0] as string;
    expect(consulta).toContain('VALUES (?, ?, 1)');
    expect(falso.run).toHaveBeenCalledWith(consulta, ['Biología', expect.any(String)]);
  });

  it('avisa cuando el nombre del mazo ya existe', async () => {
    const falso = dbFalso();
    falso.run.mockRejectedValue(new Error('UNIQUE constraint failed: mazo.nombre'));

    await expect(crearMazo(falso.db, 'Biología')).rejects.toThrow(
      'Ya existe un mazo con ese nombre',
    );
  });

  it('reenvía los otros errores de la base de datos', async () => {
    const falso = dbFalso();
    falso.run.mockRejectedValue(new Error('disco lleno'));

    await expect(crearMazo(falso.db, 'X')).rejects.toThrow('disco lleno');
  });

  it('actualiza el nombre y marca pendiente', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await actualizarMazo(falso.db, 3, 'Nuevo nombre');

    expect(falso.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE mazo'), [
      'Nuevo nombre',
      expect.any(String),
      3,
    ]);
  });

  it('borra el mazo y sus tarjetas de forma lógica', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await borrarMazo(falso.db, 3);

    expect(falso.run).toHaveBeenCalledTimes(2);
    expect(falso.run.mock.calls[0]?.[0]).toContain('UPDATE mazo');
    expect(falso.run.mock.calls[1]?.[0]).toContain('UPDATE tarjeta');
  });

  it('cuenta las tarjetas activas del mazo', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ total: 4 });

    expect(await contarTarjetasActivas(falso.db, 3)).toBe(4);
  });

  it('devuelve cero tarjetas si no hay fila', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue(null);

    expect(await contarTarjetasActivas(falso.db, 3)).toBe(0);
  });
});
