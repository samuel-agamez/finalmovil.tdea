import { pedir } from './cliente';
import { FalloApi } from './errores';

const BASE = 'https://api.test';

function respuesta(status: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('cliente HTTP', () => {
  const fetchOriginal = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = BASE;
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('envía método, URL, cabeceras y cuerpo', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { item: null }));

    await pedir({
      ruta: '/api/mazos/1',
      metodo: 'PUT',
      cuerpo: { nombre: 'Biología' },
      token: 'abc',
    });

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/mazos/1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer abc' },
      body: JSON.stringify({ nombre: 'Biología' }),
    });
  });

  it('no envía Authorization sin token ni cuerpo sin datos', async () => {
    fetchMock.mockResolvedValue(respuesta(200, { items: [] }));

    await pedir({ ruta: '/api/mazos/publicos' });

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/api/mazos/publicos`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('devuelve el JSON de una respuesta correcta', async () => {
    fetchMock.mockResolvedValue(respuesta(201, { token: 'nuevo', expiraEnSeg: 3600 }));

    const dato = await pedir<{ token: string; expiraEnSeg: number }>({ ruta: '/api/auth/login' });

    expect(dato).toEqual({ token: 'nuevo', expiraEnSeg: 3600 });
  });

  it('lanza FalloApi con el estado y el mensaje del cuerpo', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(respuesta(401, { error: 'Token inválido' })),
    );

    const fallo = pedir({ ruta: '/api/auth/yo', token: 'malo' });

    await expect(fallo).rejects.toBeInstanceOf(FalloApi);
    await expect(pedir({ ruta: '/api/auth/yo', token: 'malo' })).rejects.toMatchObject({
      status: 401,
      message: 'Token inválido',
    });
  });

  it('conserva los detalles por campo del error de validación', async () => {
    fetchMock.mockResolvedValue(
      respuesta(400, {
        error: 'Datos inválidos',
        detalles: [{ campo: 'nombre', mensaje: 'Requerido' }],
      }),
    );

    await expect(pedir({ ruta: '/api/mazos/1', metodo: 'PUT', cuerpo: {} })).rejects.toMatchObject({
      status: 400,
      detalles: [{ campo: 'nombre', mensaje: 'Requerido' }],
    });
  });

  it('no revienta con una respuesta que no es JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Página no encontrada</html>', { status: 404 }));

    await expect(pedir({ ruta: '/api/inexistente' })).rejects.toMatchObject({
      status: 404,
      message: 'Error 404',
      detalles: [],
    });
  });

  it('usa la API de producción cuando no hay EXPO_PUBLIC_API_URL', async () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    fetchMock.mockResolvedValue(respuesta(200, { items: [] }));

    await pedir({ ruta: '/api/mazos' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://10-tarjetas-de-estudio-api.vercel.app/api/mazos',
      expect.anything(),
    );
  });
});
