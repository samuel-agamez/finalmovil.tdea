import { login, refrescar, registro, yo } from './auth';
import { pedir } from './cliente';

jest.mock('./cliente', () => ({ pedir: jest.fn() }));

const pedirMock = pedir as jest.MockedFunction<typeof pedir>;

const SESION = {
  token: 'abc',
  refreshToken: 'r1',
  expiraEnSeg: 3600,
  usuario: { id: 'u1', email: 'ana@correo.co' },
};

describe('auth', () => {
  beforeEach(() => {
    pedirMock.mockReset();
  });

  it('login llama a POST /api/auth/login con email y password', async () => {
    pedirMock.mockResolvedValue(SESION);

    const resultado = await login('ana@correo.co', 'secreta');

    expect(pedirMock).toHaveBeenCalledWith({
      ruta: '/api/auth/login',
      metodo: 'POST',
      cuerpo: { email: 'ana@correo.co', password: 'secreta' },
    });
    expect(resultado).toEqual(SESION);
  });

  it('registro llama a POST /api/auth/registro', async () => {
    pedirMock.mockResolvedValue(SESION);

    await registro('ana@correo.co', 'secreta');

    expect(pedirMock).toHaveBeenCalledWith({
      ruta: '/api/auth/registro',
      metodo: 'POST',
      cuerpo: { email: 'ana@correo.co', password: 'secreta' },
    });
  });

  it('refrescar envía el refreshToken por el cuerpo', async () => {
    const tokens = { token: 'nuevo', refreshToken: 'r2', expiraEnSeg: 3600 };
    pedirMock.mockResolvedValue(tokens);

    const resultado = await refrescar('r1');

    expect(pedirMock).toHaveBeenCalledWith({
      ruta: '/api/auth/refresh',
      metodo: 'POST',
      cuerpo: { refreshToken: 'r1' },
    });
    expect(resultado).toEqual(tokens);
  });

  it('yo envía el token como Bearer', async () => {
    pedirMock.mockResolvedValue({ usuario: SESION.usuario });

    const usuario = await yo('abc');

    expect(pedirMock).toHaveBeenCalledWith({ ruta: '/api/auth/yo', token: 'abc' });
    expect(usuario).toEqual(SESION.usuario);
  });
});
