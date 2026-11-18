import { pedir } from '../api/cliente';
import { FalloApi } from '../api/errores';
import { abrirDb, type Db } from '../db/db';
import * as repoAjustes from '../repositories/ajustes';
import * as repoMazos from '../repositories/mazos';
import * as repoTarjetas from '../repositories/tarjetas';
import type { Mazo, Tarjeta } from '../repositories/tipos';
import { enviarPendientes, sincronizar, traerCambios } from './sincronizacion';

jest.mock('../api/cliente', () => ({ pedir: jest.fn() }));
jest.mock('../db/db', () => ({ abrirDb: jest.fn() }));
jest.mock('../repositories/ajustes', () => ({
  leerAjuste: jest.fn(),
  guardarAjuste: jest.fn(),
}));
jest.mock('../repositories/mazos', () => ({
  listarPendientes: jest.fn(),
  guardarRemoteId: jest.fn(),
  marcarSincronizado: jest.fn(),
  marcarBorradoEnviado: jest.fn(),
  remoteIdDeMazo: jest.fn(),
  obtenerPorRemoteId: jest.fn(),
  aplicarCambioRemoto: jest.fn(),
}));
jest.mock('../repositories/tarjetas', () => ({
  listarPendientes: jest.fn(),
  guardarRemoteId: jest.fn(),
  marcarSincronizado: jest.fn(),
  marcarBorradoEnviado: jest.fn(),
  aplicarCambioRemoto: jest.fn(),
}));

const pedirMock = pedir as jest.MockedFunction<typeof pedir>;
const abrirMock = abrirDb as jest.MockedFunction<typeof abrirDb>;
const mazosMock = repoMazos as jest.Mocked<typeof repoMazos>;
const tarjetasMock = repoTarjetas as jest.Mocked<typeof repoTarjetas>;
const ajustesMock = repoAjustes as jest.Mocked<typeof repoAjustes>;

const UUID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const DB = {} as Db;

function mazo(extra: Partial<Mazo> = {}): Mazo {
  return {
    id: 1,
    nombre: 'Biología',
    remote_id: null,
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted: 0,
    pending: 1,
    ...extra,
  };
}

function tarjeta(extra: Partial<Tarjeta> = {}): Tarjeta {
  return {
    id: 7,
    mazo_id: 1,
    pregunta: '¿Qué es la mitosis?',
    respuesta: 'División celular',
    caja: 2,
    proxima_revision: '2024-02-01T00:00:00.000Z',
    remote_id: null,
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted: 0,
    pending: 1,
    ...extra,
  };
}

describe('sincronización', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    abrirMock.mockResolvedValue(DB);
    mazosMock.listarPendientes.mockResolvedValue([]);
    tarjetasMock.listarPendientes.mockResolvedValue([]);
    ajustesMock.leerAjuste.mockResolvedValue(null);
    ajustesMock.guardarAjuste.mockResolvedValue(undefined);
  });

  it('sube un mazo pendiente con PUT y guarda el remote_id', async () => {
    mazosMock.listarPendientes.mockResolvedValue([mazo()]);
    pedirMock.mockResolvedValue({
      item: {
        id: 'srv-1',
        nombre: 'Biología',
        publico: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-03-01T00:00:00.000Z',
        deleted_at: null,
      },
    });

    const enviados = await enviarPendientes('token');

    expect(enviados).toBe(1);
    const peticion = pedirMock.mock.calls[0]?.[0];
    expect(peticion?.metodo).toBe('PUT');
    expect(peticion?.ruta).toMatch(/^\/api\/mazos\/[0-9a-f-]{36}$/);
    expect(peticion?.cuerpo).toEqual({ nombre: 'Biología', publico: false });
    expect(mazosMock.guardarRemoteId).toHaveBeenCalledWith(
      DB,
      1,
      expect.stringMatching(/^[0-9a-f-]{36}$/),
    );
    expect(mazosMock.marcarSincronizado).toHaveBeenCalledWith(
      DB,
      1,
      'srv-1',
      '2024-03-01T00:00:00.000Z',
    );
  });

  it('reutiliza el remote_id existente para no duplicar', async () => {
    mazosMock.listarPendientes.mockResolvedValue([mazo({ remote_id: UUID })]);
    pedirMock.mockResolvedValue({
      item: {
        id: UUID,
        nombre: 'Biología',
        publico: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-03-01T00:00:00.000Z',
        deleted_at: null,
      },
    });

    await enviarPendientes('token');

    expect(pedirMock.mock.calls[0]?.[0].ruta).toBe(`/api/mazos/${UUID}`);
    expect(mazosMock.guardarRemoteId).not.toHaveBeenCalled();
  });

  it('manda DELETE cuando el registro está borrado localmente', async () => {
    mazosMock.listarPendientes.mockResolvedValue([mazo({ deleted: 1, remote_id: UUID })]);
    pedirMock.mockResolvedValue({ ok: true });

    await enviarPendientes('token');

    const peticion = pedirMock.mock.calls[0]?.[0];
    expect(peticion?.metodo).toBe('DELETE');
    expect(peticion?.ruta).toBe(`/api/mazos/${UUID}`);
    expect(mazosMock.marcarBorradoEnviado).toHaveBeenCalledWith(DB, 1, expect.any(String));
    expect(mazosMock.marcarSincronizado).not.toHaveBeenCalled();
  });

  it('sube una tarjeta pendiente con el mazo_id remoto', async () => {
    tarjetasMock.listarPendientes.mockResolvedValue([tarjeta()]);
    mazosMock.remoteIdDeMazo.mockResolvedValue(UUID);
    pedirMock.mockResolvedValue({
      item: {
        id: 'srv-t',
        mazo_id: UUID,
        pregunta: '¿Qué es la mitosis?',
        respuesta: 'División celular',
        caja: 2,
        proxima_revision: '2024-02-01T00:00:00.000Z',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-03-01T00:00:00.000Z',
        deleted_at: null,
      },
    });

    const enviados = await enviarPendientes('token');

    expect(enviados).toBe(1);
    const peticion = pedirMock.mock.calls[0]?.[0];
    expect(peticion?.metodo).toBe('PUT');
    expect(peticion?.ruta).toMatch(/^\/api\/tarjetas\/[0-9a-f-]{36}$/);
    expect(peticion?.cuerpo).toEqual({
      mazo_id: UUID,
      pregunta: '¿Qué es la mitosis?',
      respuesta: 'División celular',
      caja: 2,
      proxima_revision: '2024-02-01T00:00:00.000Z',
    });
  });

  it('trae cambios y los aplica en local', async () => {
    pedirMock.mockImplementation(async ({ ruta }) => {
      if (ruta.startsWith('/api/mazos')) {
        return {
          items: [
            {
              id: 'srv-1',
              nombre: 'Química',
              publico: false,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-04-01T00:00:00.000Z',
              deleted_at: null,
            },
          ],
          servidor_ahora: '2024-04-01T00:00:00.000Z',
        };
      }
      return { items: [], servidor_ahora: '2024-04-01T00:00:00.000Z' };
    });
    mazosMock.aplicarCambioRemoto.mockResolvedValue(true);

    const cambios = await traerCambios('token', '2024-03-01T00:00:00.000Z');

    expect(cambios).toBe(1);
    expect(pedirMock.mock.calls[0]?.[0].ruta).toBe('/api/mazos?since=2024-03-01T00%3A00%3A00.000Z');
    expect(mazosMock.aplicarCambioRemoto).toHaveBeenCalledWith(DB, {
      id: 'srv-1',
      nombre: 'Química',
      updated_at: '2024-04-01T00:00:00.000Z',
      deleted_at: null,
    });
  });

  it('propaga el error cuando la API falla', async () => {
    mazosMock.listarPendientes.mockResolvedValue([mazo()]);
    pedirMock.mockRejectedValue(new Error('sin conexión'));

    await expect(enviarPendientes('token')).rejects.toThrow(
      'No se pudo subir el mazo "Biología": sin conexión',
    );
  });

  it('explica cuando el recurso ya no existe en el servidor', async () => {
    mazosMock.listarPendientes.mockResolvedValue([mazo()]);
    pedirMock.mockRejectedValue(new FalloApi(404, 'No encontrado'));

    await expect(enviarPendientes('token')).rejects.toThrow(
      'No se pudo subir el mazo "Biología": el recurso no existe en el servidor',
    );
  });

  it('deja pasar el 401 sin envolverlo para que la sesión se renueve', async () => {
    mazosMock.listarPendientes.mockResolvedValue([mazo()]);
    pedirMock.mockRejectedValue(new FalloApi(401, 'Token vencido'));

    await expect(enviarPendientes('token')).rejects.toBeInstanceOf(FalloApi);
  });

  it('avisa si la tarjeta pertenece a un mazo que aún no está en el servidor', async () => {
    tarjetasMock.listarPendientes.mockResolvedValue([tarjeta()]);
    mazosMock.remoteIdDeMazo.mockResolvedValue(null);

    await expect(enviarPendientes('token')).rejects.toThrow(
      'La tarjeta pertenece a un mazo que todavía no se ha sincronizado',
    );
  });

  it('ignora una tarjeta remota cuyo mazo no existe en local', async () => {
    pedirMock.mockImplementation(async ({ ruta }) => {
      if (ruta.startsWith('/api/mazos')) {
        return { items: [], servidor_ahora: '2024-04-01T00:00:00.000Z' };
      }
      return {
        items: [
          {
            id: 'srv-t',
            mazo_id: 'uuid-ajeno',
            pregunta: '¿Qué es la mitosis?',
            respuesta: 'División celular',
            caja: 2,
            proxima_revision: '2024-02-01T00:00:00.000Z',
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-03-01T00:00:00.000Z',
            deleted_at: null,
          },
        ],
        servidor_ahora: '2024-04-01T00:00:00.000Z',
      };
    });
    mazosMock.obtenerPorRemoteId.mockResolvedValue(null);

    await expect(traerCambios('token', '2024-03-01T00:00:00.000Z')).resolves.toBe(0);
    expect(tarjetasMock.aplicarCambioRemoto).not.toHaveBeenCalled();
  });
});

describe('sincronización completa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    abrirMock.mockResolvedValue(DB);
    mazosMock.listarPendientes.mockResolvedValue([]);
    tarjetasMock.listarPendientes.mockResolvedValue([]);
    ajustesMock.leerAjuste.mockResolvedValue(null);
    ajustesMock.guardarAjuste.mockResolvedValue(undefined);
  });

  it('sube lo pendiente, baja los cambios y guarda el cursor', async () => {
    pedirMock.mockImplementation(async ({ ruta }) => {
      if (ruta.startsWith('/api/mazos')) {
        return {
          items: [
            {
              id: 'srv-1',
              nombre: 'Química',
              publico: false,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-04-01T00:00:00.000Z',
              deleted_at: null,
            },
          ],
          servidor_ahora: '2024-04-02T00:00:00.000Z',
        };
      }
      return { items: [], servidor_ahora: '2024-04-03T00:00:00.000Z' };
    });
    mazosMock.aplicarCambioRemoto.mockResolvedValue(true);

    const total = await sincronizar('token');

    expect(total).toBe(1);
    expect(ajustesMock.guardarAjuste).toHaveBeenCalledWith(
      DB,
      'ultima_sincronizacion',
      '2024-04-03T00:00:00.000Z',
    );
  });

  it('reutiliza el cursor guardado en la base local', async () => {
    ajustesMock.leerAjuste.mockResolvedValue('2024-02-01T00:00:00.000Z');
    pedirMock.mockResolvedValue({ items: [], servidor_ahora: '2024-04-01T00:00:00.000Z' });

    await sincronizar('token');

    expect(pedirMock.mock.calls[0]?.[0].ruta).toBe('/api/mazos?since=2024-02-01T00%3A00%3A00.000Z');
  });
});
