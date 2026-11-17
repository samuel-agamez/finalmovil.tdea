import type { Db } from '../db/db';
import {
  actualizarMazo,
  aplicarCambioRemoto,
  borrarMazo,
  buscarMazos,
  contarTarjetasActivas,
  crearMazo,
  guardarRemoteId,
  listarMazos,
  listarPendientes,
  marcarBorradoEnviado,
  marcarSincronizado,
  obtenerMazo,
  obtenerPorRemoteId,
  remoteIdDeMazo,
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

describe('sincronización de mazos', () => {
  it('lista solo los mazos pendientes', async () => {
    const falso = dbFalso();
    falso.getAll.mockResolvedValue([]);

    await listarPendientes(falso.db);

    expect(falso.getAll.mock.calls[0]?.[0] as string).toContain('pending = 1');
  });

  it('guarda el identificador remoto generado por el cliente', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await guardarRemoteId(falso.db, 3, 'uuid-1');

    expect(falso.run).toHaveBeenCalledWith(expect.stringContaining('remote_id = ?'), ['uuid-1', 3]);
  });

  it('marca el mazo como sincronizado', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await marcarSincronizado(falso.db, 3, 'uuid-1', '2026-11-16T10:00:00.000Z');

    const [consulta, valores] = falso.run.mock.calls[0] ?? [];
    expect(consulta as string).toContain('pending = 0');
    expect(valores).toEqual(['uuid-1', '2026-11-16T10:00:00.000Z', 3]);
  });

  it('marca el borrado local como ya enviado', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue({ changes: 1 });

    await marcarBorradoEnviado(falso.db, 3, '2026-11-16T10:00:00.000Z');

    expect(falso.run.mock.calls[0]?.[0] as string).toContain('pending = 0');
  });

  it('busca un mazo por su identificador remoto', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ id: 3, nombre: 'Biología' });

    const mazo = await obtenerPorRemoteId(falso.db, 'uuid-1');

    expect(mazo?.id).toBe(3);
    expect(falso.getFirst).toHaveBeenCalledWith(expect.stringContaining('remote_id = ?'), [
      'uuid-1',
    ]);
  });

  it('devuelve el identificador remoto del mazo', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ remote_id: 'uuid-1' });

    await expect(remoteIdDeMazo(falso.db, 3)).resolves.toBe('uuid-1');
  });

  it('devuelve null si el mazo todavía no tiene identificador remoto', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ remote_id: null });

    await expect(remoteIdDeMazo(falso.db, 3)).resolves.toBeNull();
  });

  it('inserta el mazo que llega del servidor', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue(null);
    falso.run.mockResolvedValue({ lastInsertRowId: 9 });

    const aplicado = await aplicarCambioRemoto(falso.db, {
      id: 'uuid-1',
      nombre: 'Química',
      updated_at: '2026-11-16T10:00:00.000Z',
      deleted_at: null,
    });

    expect(aplicado).toBe(true);
    expect(falso.run.mock.calls[0]?.[0] as string).toContain('INSERT INTO mazo');
  });

  it('actualiza el mazo que ya existe en local', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ id: 3, pending: 0, updated_at: null });
    falso.run.mockResolvedValue({ changes: 1 });

    const aplicado = await aplicarCambioRemoto(falso.db, {
      id: 'uuid-1',
      nombre: 'Química',
      updated_at: '2026-11-16T10:00:00.000Z',
      deleted_at: null,
    });

    expect(aplicado).toBe(true);
    expect(falso.run.mock.calls[0]?.[0] as string).toContain('UPDATE mazo');
  });

  it('conserva el cambio local cuando es más nuevo que el del servidor', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({
      id: 3,
      pending: 1,
      updated_at: '2026-11-17T10:00:00.000Z',
    });

    const aplicado = await aplicarCambioRemoto(falso.db, {
      id: 'uuid-1',
      nombre: 'Química',
      updated_at: '2026-11-16T10:00:00.000Z',
      deleted_at: null,
    });

    expect(aplicado).toBe(false);
    expect(falso.run).not.toHaveBeenCalled();
  });

  it('reemplaza el mazo duplicado por nombre en vez de fallar', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue(null);
    falso.run
      .mockRejectedValueOnce(new Error('UNIQUE constraint failed: mazo.nombre'))
      .mockResolvedValueOnce({ changes: 1 });

    const aplicado = await aplicarCambioRemoto(falso.db, {
      id: 'uuid-1',
      nombre: 'Química',
      updated_at: '2026-11-16T10:00:00.000Z',
      deleted_at: null,
    });

    expect(aplicado).toBe(true);
    expect(falso.run).toHaveBeenCalledTimes(2);
    expect(falso.run.mock.calls[1]?.[0] as string).toContain('WHERE nombre = ?');
  });
});
