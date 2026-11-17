import type { Db } from '../db/db';
import { guardarAjuste, leerAjuste } from './ajustes';

function dbFalso() {
  const getFirst = jest.fn();
  const run = jest.fn();
  return {
    db: { getFirstAsync: getFirst, runAsync: run } as unknown as Db,
    getFirst,
    run,
  };
}

describe('repositorio de ajustes', () => {
  it('lee un ajuste guardado', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue({ valor: '2026-11-16T00:00:00.000Z' });

    await expect(leerAjuste(falso.db, 'cursor')).resolves.toBe('2026-11-16T00:00:00.000Z');
    expect(falso.getFirst).toHaveBeenCalledWith('SELECT valor FROM ajuste WHERE clave = ?', [
      'cursor',
    ]);
  });

  it('devuelve null si el ajuste no existe', async () => {
    const falso = dbFalso();
    falso.getFirst.mockResolvedValue(null);

    await expect(leerAjuste(falso.db, 'cursor')).resolves.toBeNull();
  });

  it('guarda o reemplaza un ajuste', async () => {
    const falso = dbFalso();
    falso.run.mockResolvedValue(undefined);

    await guardarAjuste(falso.db, 'cursor', 'ayer');

    const [consulta, parametros] = falso.run.mock.calls[0] ?? [];
    expect(consulta).toContain('ON CONFLICT(clave) DO UPDATE');
    expect(parametros).toEqual(['cursor', 'ayer']);
  });
});
