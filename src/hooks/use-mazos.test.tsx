import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { cargarSesion, ejecutarConSesion } from '../api/sesion';
import type { MazoConProgreso } from '../repositories/tipos';
import { buscarMazos, crearMazo, listarMazos } from '../services/mazos';
import { cargarDatosPrueba } from '../services/semillas';
import { sincronizar } from '../services/sincronizacion';
import { useMazos } from './use-mazos';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../api/sesion', () => ({ cargarSesion: jest.fn(), ejecutarConSesion: jest.fn() }));
jest.mock('../services/mazos', () => ({
  listarMazos: jest.fn(),
  buscarMazos: jest.fn(),
  crearMazo: jest.fn(),
}));
jest.mock('../services/semillas', () => ({ cargarDatosPrueba: jest.fn() }));
jest.mock('../services/sincronizacion', () => ({ sincronizar: jest.fn() }));

const reemplazar = jest.fn();
const cargarSesionMock = jest.mocked(cargarSesion);
const ejecutarMock = jest.mocked(ejecutarConSesion);
const listarMock = jest.mocked(listarMazos);
const buscarMock = jest.mocked(buscarMazos);
const crearMock = jest.mocked(crearMazo);
const semillasMock = jest.mocked(cargarDatosPrueba);
const sincronizarMock = jest.mocked(sincronizar);

const SESION = {
  token: 'abc',
  refreshToken: 'r1',
  expiraEnSeg: 3600,
  usuario: { id: 'u1', email: 'ana@correo.co' },
};

const MAZO: MazoConProgreso = {
  id: 7,
  nombre: 'Biología',
  remote_id: null,
  updated_at: null,
  deleted: 0,
  pending: 0,
  total: 3,
  dominadas: 1,
  en_progreso: 2,
};

describe('hook de mazos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useRouter).mockReturnValue({ replace: reemplazar } as never);
    cargarSesionMock.mockResolvedValue(SESION);
    ejecutarMock.mockImplementation((accion) => accion('abc'));
    listarMock.mockResolvedValue([MAZO]);
    buscarMock.mockResolvedValue([]);
    crearMock.mockResolvedValue(9);
    semillasMock.mockResolvedValue(false);
    sincronizarMock.mockResolvedValue(0);
  });

  it('muestra los mazos locales', async () => {
    const { result } = await renderHook(() => useMazos());

    await waitFor(() => expect(result.current.mazos).toEqual([MAZO]));
    expect(result.current.cargando).toBe(false);
  });

  it('sincroniza una sola vez aunque se escriba en el buscador', async () => {
    const { result } = await renderHook(() => useMazos());

    await waitFor(() => expect(sincronizarMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      result.current.setTermino('bio');
    });
    await act(async () => {
      result.current.setTermino('biol');
    });

    expect(sincronizarMock).toHaveBeenCalledTimes(1);
  });

  it('busca en local sin volver a sincronizar', async () => {
    const { result } = await renderHook(() => useMazos());

    await act(async () => {
      result.current.setTermino('bio');
    });

    await waitFor(() => expect(buscarMock).toHaveBeenCalledWith('bio'));
    expect(sincronizarMock).toHaveBeenCalledTimes(1);
  });

  it('vuelve a leer la lista local cuando la sincronización trae cambios', async () => {
    sincronizarMock.mockResolvedValue(3);

    const { result } = await renderHook(() => useMazos());

    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
    expect(result.current.sinConexion).toBe(false);
  });

  it('vuelve a leer la lista local cuando carga las semillas', async () => {
    semillasMock.mockResolvedValue(true);

    await renderHook(() => useMazos());

    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
  });

  it('no relee la lista si la sincronización no trae cambios', async () => {
    await renderHook(() => useMazos());

    await waitFor(() => expect(sincronizarMock).toHaveBeenCalled());

    expect(listarMock).toHaveBeenCalledTimes(1);
  });

  it('marca sin conexión cuando la sincronización falla', async () => {
    sincronizarMock.mockRejectedValue(new Error('sin red'));

    const { result } = await renderHook(() => useMazos());

    await waitFor(() => expect(result.current.sinConexion).toBe(true));
  });

  it('redirige al login cuando no hay sesión y no sincroniza', async () => {
    cargarSesionMock.mockResolvedValue(null);

    await renderHook(() => useMazos());

    await waitFor(() => expect(reemplazar).toHaveBeenCalledWith('/login'));
    expect(sincronizarMock).not.toHaveBeenCalled();
  });

  it('crea el mazo y recarga la lista sin sincronizar de nuevo', async () => {
    const { result } = await renderHook(() => useMazos());

    await waitFor(() => expect(sincronizarMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.crear('Química');
    });

    expect(crearMock).toHaveBeenCalledWith('Química');
    expect(sincronizarMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(listarMock).toHaveBeenCalledTimes(2));
  });

  it('expone el mensaje de error si crear falla', async () => {
    crearMock.mockRejectedValue(new Error('El nombre del mazo es obligatorio'));

    const { result } = await renderHook(() => useMazos());

    await act(async () => {
      await result.current.crear('  ');
    });

    expect(result.current.error).toBe('El nombre del mazo es obligatorio');
  });
});
