import { abrirDb } from '../db/db';
import {
  buscarMazos as buscar,
  borrarMazo as borrar,
  contarTarjetasActivas,
  crearMazo as crear,
  listarMazos as listar,
  obtenerMazo as obtener,
} from '../repositories/mazos';
import {
  buscarMazos,
  borrarMazo,
  contarTarjetas,
  crearMazo,
  listarMazos,
  obtenerMazo,
} from './mazos';

jest.mock('../db/db', () => ({ abrirDb: jest.fn() }));
jest.mock('../repositories/mazos', () => ({
  listarMazos: jest.fn(),
  buscarMazos: jest.fn(),
  obtenerMazo: jest.fn(),
  crearMazo: jest.fn(),
  borrarMazo: jest.fn(),
  contarTarjetasActivas: jest.fn(),
}));

const abrirMock = jest.mocked(abrirDb);
const listarMock = jest.mocked(listar);
const buscarMock = jest.mocked(buscar);
const obtenerMock = jest.mocked(obtener);
const crearMock = jest.mocked(crear);
const borrarMock = jest.mocked(borrar);
const contarMock = jest.mocked(contarTarjetasActivas);

describe('servicio de mazos', () => {
  beforeEach(() => {
    abrirMock.mockReset();
    abrirMock.mockResolvedValue({} as Awaited<ReturnType<typeof abrirDb>>);
    listarMock.mockReset();
    buscarMock.mockReset();
    obtenerMock.mockReset();
    crearMock.mockReset();
    borrarMock.mockReset();
    contarMock.mockReset();
  });

  it('lista los mazos con progreso', async () => {
    const filas = [
      {
        id: 1,
        nombre: 'Biología',
        remote_id: null,
        updated_at: null,
        deleted: 0,
        pending: 0,
        dominadas: 0,
        en_progreso: 0,
        total: 0,
      },
    ];
    listarMock.mockResolvedValue(filas);

    await expect(listarMazos()).resolves.toEqual(filas);
    expect(listarMock).toHaveBeenCalledWith({});
  });

  it('busca mazos por término', async () => {
    buscarMock.mockResolvedValue([]);

    await expect(buscarMazos('bio')).resolves.toEqual([]);
    expect(buscarMock).toHaveBeenCalledWith({}, 'bio');
  });

  it('obtiene un mazo por id', async () => {
    obtenerMock.mockResolvedValue(null);

    await expect(obtenerMazo(5)).resolves.toBeNull();
    expect(obtenerMock).toHaveBeenCalledWith({}, 5);
  });

  it('crea un mazo recortando el nombre', async () => {
    crearMock.mockResolvedValue(3);

    await expect(crearMazo('  Inglés  ')).resolves.toBe(3);
    expect(crearMock).toHaveBeenCalledWith({}, 'Inglés');
  });

  it('rechaza un nombre vacío sin tocar la base', async () => {
    await expect(crearMazo('   ')).rejects.toThrow('El nombre del mazo es obligatorio');
    expect(crearMock).not.toHaveBeenCalled();
  });

  it('borra un mazo', async () => {
    borrarMock.mockResolvedValue(undefined);

    await borrarMazo(8);
    expect(borrarMock).toHaveBeenCalledWith({}, 8);
  });

  it('cuenta las tarjetas activas del mazo', async () => {
    contarMock.mockResolvedValue(4);

    await expect(contarTarjetas(8)).resolves.toBe(4);
    expect(contarMock).toHaveBeenCalledWith({}, 8);
  });
});
