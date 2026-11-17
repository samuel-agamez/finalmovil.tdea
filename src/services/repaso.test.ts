import type { Db } from '../db/db';
import { actualizarTarjeta, obtenerTarjeta } from '../repositories/tarjetas';
import { registrarRepaso } from './repaso';

jest.mock('../repositories/tarjetas', () => ({
  obtenerTarjeta: jest.fn(),
  actualizarTarjeta: jest.fn(),
}));

const obtenerMock = jest.mocked(obtenerTarjeta);
const actualizarMock = jest.mocked(actualizarTarjeta);
const db = {} as unknown as Db;
const AHORA = '2026-11-16T10:00:00.000Z';

function tarjetaEnCaja(caja: number) {
  return {
    id: 7,
    mazo_id: 1,
    pregunta: '¿2+2?',
    respuesta: '4',
    caja,
    proxima_revision: '2026-11-10T10:00:00.000Z',
    remote_id: null,
    updated_at: null,
    deleted: 0,
    pending: 0,
  };
}

describe('registrar repaso (cajas de Leitner)', () => {
  beforeEach(() => {
    obtenerMock.mockReset();
    actualizarMock.mockReset();
    actualizarMock.mockResolvedValue();
  });

  it('criterio 1: acierto en caja 2 pasa a caja 3 con revisión posterior', async () => {
    obtenerMock.mockResolvedValue(tarjetaEnCaja(2));

    await registrarRepaso(db, 7, 'acierto', AHORA);

    expect(actualizarMock).toHaveBeenCalledWith(db, 7, {
      caja: 3,
      proxima_revision: '2026-11-20T10:00:00.000Z',
    });
    const cambios = actualizarMock.mock.calls[0]?.[2];
    expect(cambios?.proxima_revision !== undefined).toBe(true);
    expect(Date.parse(cambios?.proxima_revision ?? '')).toBeGreaterThan(Date.parse(AHORA));
  });

  it('criterio 2: fallo vuelve a la caja 1', async () => {
    obtenerMock.mockResolvedValue(tarjetaEnCaja(3));

    await registrarRepaso(db, 7, 'fallo', AHORA);

    expect(actualizarMock).toHaveBeenCalledWith(db, 7, {
      caja: 1,
      proxima_revision: '2026-11-17T10:00:00.000Z',
    });
  });

  it('un acierto en caja 5 se queda en caja 5', async () => {
    obtenerMock.mockResolvedValue(tarjetaEnCaja(5));

    await registrarRepaso(db, 7, 'acierto', AHORA);

    expect(actualizarMock).toHaveBeenCalledWith(db, 7, {
      caja: 5,
      proxima_revision: '2026-12-02T10:00:00.000Z',
    });
  });

  it('sin fecha usa el momento actual y calcula en UTC', async () => {
    obtenerMock.mockResolvedValue(tarjetaEnCaja(1));

    await registrarRepaso(db, 7, 'acierto');

    const cambios = actualizarMock.mock.calls[0]?.[2];
    expect(cambios?.caja).toBe(2);
    expect(cambios?.proxima_revision).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('falla si la tarjeta no existe', async () => {
    obtenerMock.mockResolvedValue(null);

    await expect(registrarRepaso(db, 99, 'acierto', AHORA)).rejects.toThrow('La tarjeta no existe');
    expect(actualizarMock).not.toHaveBeenCalled();
  });
});
