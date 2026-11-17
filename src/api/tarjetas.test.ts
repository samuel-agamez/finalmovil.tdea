import { pedir } from './cliente';
import { eliminar, guardar, listarDesde, type TarjetaRemota } from './tarjetas';

jest.mock('./cliente', () => ({ pedir: jest.fn() }));

const pedirMock = jest.mocked(pedir);

const tarjeta: TarjetaRemota = {
  id: '22222222-2222-4222-8222-222222222222',
  mazo_id: '11111111-1111-4111-8111-111111111111',
  pregunta: '¿Capital de Francia?',
  respuesta: 'París',
  caja: 2,
  proxima_revision: '2026-11-20T00:00:00.000Z',
  created_at: '2026-11-16T00:00:00.000Z',
  updated_at: '2026-11-16T00:00:00.000Z',
  deleted_at: null,
};

describe('API de tarjetas', () => {
  beforeEach(() => {
    pedirMock.mockReset();
  });

  it('lista los cambios desde una fecha', async () => {
    pedirMock.mockResolvedValue({ items: [tarjeta], servidor_ahora: tarjeta.updated_at });

    const respuesta = await listarDesde('2026-11-15T00:00:00.000Z', 'token');

    expect(respuesta.items).toEqual([tarjeta]);
    expect(pedirMock).toHaveBeenCalledWith({
      ruta: '/api/tarjetas?since=2026-11-15T00%3A00%3A00.000Z',
      token: 'token',
    });
  });

  it('guarda una tarjeta con PUT y devuelve el ítem', async () => {
    pedirMock.mockResolvedValue({ item: tarjeta });
    const cuerpo = {
      mazo_id: tarjeta.mazo_id,
      pregunta: tarjeta.pregunta,
      respuesta: tarjeta.respuesta,
      caja: tarjeta.caja,
      proxima_revision: tarjeta.proxima_revision,
    };

    await expect(guardar(tarjeta.id, cuerpo, 'token')).resolves.toEqual(tarjeta);
    expect(pedirMock).toHaveBeenCalledWith({
      ruta: `/api/tarjetas/${tarjeta.id}`,
      metodo: 'PUT',
      cuerpo,
      token: 'token',
    });
  });

  it('elimina una tarjeta con DELETE', async () => {
    pedirMock.mockResolvedValue({ ok: true });

    await eliminar(tarjeta.id, 'token');

    expect(pedirMock).toHaveBeenCalledWith({
      ruta: `/api/tarjetas/${tarjeta.id}`,
      metodo: 'DELETE',
      token: 'token',
    });
  });
});
