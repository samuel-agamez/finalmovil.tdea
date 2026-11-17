import { pedir } from './cliente';
import type { RespuestaItem, RespuestaLista, RespuestaOk } from './respuestas';

export type TarjetaRemota = {
  id: string;
  mazo_id: string;
  pregunta: string;
  respuesta: string;
  caja: number;
  proxima_revision: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CuerpoTarjeta = {
  mazo_id: string;
  pregunta: string;
  respuesta: string;
  caja: number;
  proxima_revision: string | null;
};

export async function listarDesde(
  desde: string,
  token: string,
): Promise<RespuestaLista<TarjetaRemota>> {
  return await pedir<RespuestaLista<TarjetaRemota>>({
    ruta: `/api/tarjetas?since=${encodeURIComponent(desde)}`,
    token,
  });
}

export async function guardar(
  id: string,
  cuerpo: CuerpoTarjeta,
  token: string,
): Promise<TarjetaRemota> {
  const respuesta = await pedir<RespuestaItem<TarjetaRemota>>({
    ruta: `/api/tarjetas/${id}`,
    metodo: 'PUT',
    cuerpo,
    token,
  });
  return respuesta.item;
}

export async function eliminar(id: string, token: string): Promise<void> {
  await pedir<RespuestaOk>({ ruta: `/api/tarjetas/${id}`, metodo: 'DELETE', token });
}
