import { pedir } from './cliente';
import type { RespuestaItem, RespuestaLista, RespuestaOk } from './respuestas';

export type MazoRemoto = {
  id: string;
  nombre: string;
  publico: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CuerpoMazo = {
  nombre: string;
  publico: boolean;
};

export async function listarDesde(
  desde: string,
  token: string,
): Promise<RespuestaLista<MazoRemoto>> {
  return await pedir<RespuestaLista<MazoRemoto>>({
    ruta: `/api/mazos?since=${encodeURIComponent(desde)}`,
    token,
  });
}

export async function guardar(id: string, cuerpo: CuerpoMazo, token: string): Promise<MazoRemoto> {
  const respuesta = await pedir<RespuestaItem<MazoRemoto>>({
    ruta: `/api/mazos/${id}`,
    metodo: 'PUT',
    cuerpo,
    token,
  });
  return respuesta.item;
}

export async function eliminar(id: string, token: string): Promise<void> {
  await pedir<RespuestaOk>({ ruta: `/api/mazos/${id}`, metodo: 'DELETE', token });
}
