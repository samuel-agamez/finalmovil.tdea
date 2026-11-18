import { cargarSesion, cerrarSesion, ejecutarConSesion, guardarSesion } from './sesion';
import * as SecureStore from 'expo-secure-store';
import { refrescar } from './auth';
import { FalloApi } from './errores';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('./auth', () => ({ refrescar: jest.fn() }));

const refrescarMock = jest.mocked(refrescar);

const getItemAsync = SecureStore.getItemAsync as jest.MockedFunction<
  typeof SecureStore.getItemAsync
>;
const setItemAsync = SecureStore.setItemAsync as jest.MockedFunction<
  typeof SecureStore.setItemAsync
>;
const deleteItemAsync = SecureStore.deleteItemAsync as jest.MockedFunction<
  typeof SecureStore.deleteItemAsync
>;

const SESION = {
  token: 'abc',
  refreshToken: 'r1',
  expiraEnSeg: 3600,
  usuario: { id: 'u1', email: 'ana@correo.co' },
};

describe('sesión en secure store', () => {
  beforeEach(() => {
    getItemAsync.mockReset();
    setItemAsync.mockReset();
    deleteItemAsync.mockReset();
  });

  it('guarda la sesión serializada bajo su clave', async () => {
    setItemAsync.mockResolvedValue();

    await guardarSesion(SESION);

    expect(setItemAsync).toHaveBeenCalledWith('sesion', JSON.stringify(SESION));
  });

  it('carga la sesión guardada', async () => {
    getItemAsync.mockResolvedValue(JSON.stringify(SESION));

    await expect(cargarSesion()).resolves.toEqual(SESION);
  });

  it('devuelve null si no hay sesión guardada', async () => {
    getItemAsync.mockResolvedValue(null);

    await expect(cargarSesion()).resolves.toBeNull();
  });

  it('devuelve null si el guardado está corrupto o incompleto', async () => {
    getItemAsync.mockResolvedValue('{no-es-json');

    await expect(cargarSesion()).resolves.toBeNull();

    getItemAsync.mockResolvedValue(JSON.stringify({ token: 'solo-token' }));

    await expect(cargarSesion()).resolves.toBeNull();
  });

  it('borra la sesión al cerrar', async () => {
    deleteItemAsync.mockResolvedValue();

    await cerrarSesion();

    expect(deleteItemAsync).toHaveBeenCalledWith('sesion');
  });
});

describe('peticiones con la sesión vigente', () => {
  beforeEach(() => {
    getItemAsync.mockReset();
    setItemAsync.mockReset();
    refrescarMock.mockReset();
  });

  it('usa el token guardado sin renovarlo', async () => {
    getItemAsync.mockResolvedValue(JSON.stringify(SESION));
    const accion = jest.fn().mockResolvedValue('hecho');

    await expect(ejecutarConSesion(accion)).resolves.toBe('hecho');

    expect(accion).toHaveBeenCalledWith('abc');
    expect(refrescarMock).not.toHaveBeenCalled();
  });

  it('renueva el token y reintenta cuando la API responde 401', async () => {
    getItemAsync.mockResolvedValue(JSON.stringify(SESION));
    refrescarMock.mockResolvedValue({ token: 'nuevo', refreshToken: 'r2', expiraEnSeg: 3600 });
    const accion = jest
      .fn()
      .mockRejectedValueOnce(new FalloApi(401, 'Token vencido'))
      .mockResolvedValueOnce('hecho');

    await expect(ejecutarConSesion(accion)).resolves.toBe('hecho');

    expect(refrescarMock).toHaveBeenCalledWith('r1');
    expect(accion).toHaveBeenLastCalledWith('nuevo');
    expect(setItemAsync).toHaveBeenCalledWith(
      'sesion',
      JSON.stringify({ ...SESION, token: 'nuevo', refreshToken: 'r2', expiraEnSeg: 3600 }),
    );
  });

  it('no renueva el token si el fallo no es 401', async () => {
    getItemAsync.mockResolvedValue(JSON.stringify(SESION));
    const accion = jest.fn().mockRejectedValue(new FalloApi(500, 'Error del servidor'));

    await expect(ejecutarConSesion(accion)).rejects.toMatchObject({ status: 500 });

    expect(refrescarMock).not.toHaveBeenCalled();
    expect(accion).toHaveBeenCalledTimes(1);
  });

  it('propaga el fallo del refresco', async () => {
    getItemAsync.mockResolvedValue(JSON.stringify(SESION));
    refrescarMock.mockRejectedValue(new FalloApi(401, 'Token de refresco vencido'));
    const accion = jest.fn().mockRejectedValue(new FalloApi(401, 'Token vencido'));

    await expect(ejecutarConSesion(accion)).rejects.toMatchObject({ status: 401 });

    expect(accion).toHaveBeenCalledTimes(1);
    expect(setItemAsync).not.toHaveBeenCalled();
  });

  it('falla sin tocar la red si no hay sesión', async () => {
    getItemAsync.mockResolvedValue(null);
    const accion = jest.fn();

    await expect(ejecutarConSesion(accion)).rejects.toThrow('No hay sesión iniciada');

    expect(accion).not.toHaveBeenCalled();
  });
});
