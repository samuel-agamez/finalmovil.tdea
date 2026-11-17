import { pedir } from './cliente';
import { eliminar, guardar, listarDesde, type MazoRemoto } from './mazos';

jest.mock('./cliente', () => ({ pedir: jest.fn() }));

const pedirMock = jest.mocked(pedir);

const mazo: MazoRemoto = {
  id: '11111111-1111-4111-8111-111111111111',
  nombre: 'Biología',
  publico: false,
  created_at: '2026-11-16T00:00:00.000Z',
  updated_at: '2026-11-16T00:00:00.000Z',
  deleted_at: null,
};

describe('API de mazos', () => {
  beforeEach(() => {
    pedirMock.mockReset();
  });

  it('lista los cambios desde una fecha', async () => {
    pedirMock.mockResolvedValue({ items: [mazo], servidor_ahora: mazo.updated_at });

    const respuesta = await listarDesde('2026-11-15T00:00:00.000Z', 'token');

    expect(respuesta.items).toEqual([mazo]);
    expect(pedirMock).toHaveBeenCalledWith({
      ruta: '/api/mazos?since=2026-11-15T00%3A00%3A00.000Z',
      token: 'token',
    });
  });

  it('guarda un mazo con PUT y devuelve el ítem', async () => {
    pedirMock.mockResolvedValue({ item: mazo });

    await expect(
      guardar(mazo.id, { nombre: 'Biología', publico: false }, 'token'),
    ).resolves.toEqual(mazo);
    expect(pedirMock).toHaveBeenCalledWith({
      ruta: `/api/mazos/${mazo.id}`,
      metodo: 'PUT',
      cuerpo: { nombre: 'Biología', publico: false },
      token: 'token',
    });
  });

  it('elimina un mazo con DELETE', async () => {
    pedirMock.mockResolvedValue({ ok: true });

    await eliminar(mazo.id, 'token');

    expect(pedirMock).toHaveBeenCalledWith({
      ruta: `/api/mazos/${mazo.id}`,
      metodo: 'DELETE',
      token: 'token',
    });
  });
});
