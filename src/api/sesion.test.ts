import { cargarSesion, cerrarSesion, guardarSesion } from './sesion';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

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
