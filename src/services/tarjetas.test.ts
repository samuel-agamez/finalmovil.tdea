import { abrirDb } from '../db/db';
import {
  borrarTarjeta as borrar,
  crearTarjeta as crear,
  listarPorMazo as listar,
  vencidasDelMazo as vencidas,
} from '../repositories/tarjetas';
import { borrarTarjeta, crearTarjeta, listarTarjetas, tarjetasVencidas } from './tarjetas';

jest.mock('../db/db', () => ({ abrirDb: jest.fn() }));
jest.mock('../repositories/tarjetas', () => ({
  listarPorMazo: jest.fn(),
  crearTarjeta: jest.fn(),
  borrarTarjeta: jest.fn(),
  vencidasDelMazo: jest.fn(),
}));

const abrirMock = jest.mocked(abrirDb);
const listarMock = jest.mocked(listar);
const crearMock = jest.mocked(crear);
const borrarMock = jest.mocked(borrar);
const vencidasMock = jest.mocked(vencidas);

describe('servicio de tarjetas', () => {
  beforeEach(() => {
    abrirMock.mockReset();
    abrirMock.mockResolvedValue({} as Awaited<ReturnType<typeof abrirDb>>);
    listarMock.mockReset();
    crearMock.mockReset();
    borrarMock.mockReset();
    vencidasMock.mockReset();
  });

  it('lista las tarjetas de un mazo', async () => {
    listarMock.mockResolvedValue([]);

    await expect(listarTarjetas(2)).resolves.toEqual([]);
    expect(listarMock).toHaveBeenCalledWith({}, 2);
  });

  it('crea una tarjeta recortando pregunta y respuesta', async () => {
    crearMock.mockResolvedValue(9);

    await expect(
      crearTarjeta({ mazo_id: 2, pregunta: '  ¿Capital?  ', respuesta: '  Madrid  ' }),
    ).resolves.toBe(9);
    expect(crearMock).toHaveBeenCalledWith(
      {},
      {
        mazo_id: 2,
        pregunta: '¿Capital?',
        respuesta: 'Madrid',
      },
    );
  });

  it('rechaza datos vacíos sin tocar la base', async () => {
    await expect(crearTarjeta({ mazo_id: 2, pregunta: ' ', respuesta: ' ' })).rejects.toThrow(
      'La pregunta es obligatoria',
    );
    expect(crearMock).not.toHaveBeenCalled();
  });

  it('rechaza textos de más de 300 caracteres', async () => {
    const largo = 'a'.repeat(301);

    await expect(crearTarjeta({ mazo_id: 2, pregunta: largo, respuesta: 'ok' })).rejects.toThrow(
      'La pregunta debe tener máximo 300 caracteres',
    );
    expect(crearMock).not.toHaveBeenCalled();
  });

  it('borra una tarjeta', async () => {
    borrarMock.mockResolvedValue(undefined);

    await borrarTarjeta(4);
    expect(borrarMock).toHaveBeenCalledWith({}, 4);
  });

  it('pide las tarjetas vencidas con la hora actual', async () => {
    vencidasMock.mockResolvedValue([]);

    await expect(tarjetasVencidas(2)).resolves.toEqual([]);
    const [, mazoId, ahora] = vencidasMock.mock.calls[0] ?? [];
    expect(mazoId).toBe(2);
    expect(typeof ahora).toBe('string');
  });
});
