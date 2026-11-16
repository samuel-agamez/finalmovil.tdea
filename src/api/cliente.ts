import { FalloApi, type DetalleCampo } from './errores';

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Peticion = {
  ruta: string;
  metodo?: Metodo;
  cuerpo?: unknown;
  token?: string | null;
};

export async function pedir<T>(peticion: Peticion): Promise<T> {
  const { ruta, metodo = 'GET', cuerpo, token } = peticion;
  const opciones: RequestInit = { method: metodo, headers: cabeceras(token) };
  if (cuerpo !== undefined) opciones.body = JSON.stringify(cuerpo);
  const respuesta = await fetch(`${base()}${ruta}`, opciones);
  return await leer<T>(respuesta);
}

function base(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? '';
}

function cabeceras(token: string | null | undefined): Record<string, string> {
  const cabeceras: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  return cabeceras;
}

async function leer<T>(respuesta: Response): Promise<T> {
  const cuerpo = parsear(await respuesta.text());
  if (!respuesta.ok) throw falloDe(respuesta.status, cuerpo);
  return cuerpo as T;
}

function parsear(texto: string): unknown {
  if (texto === '') return null;
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return null;
  }
}

function falloDe(status: number, cuerpo: unknown): FalloApi {
  const mensaje = typeof cuerpo === 'object' && cuerpo !== null ? mensajeDe(cuerpo) : null;
  return new FalloApi(status, mensaje ?? `Error ${status}`, detallesDe(cuerpo));
}

function mensajeDe(cuerpo: object): string | null {
  const error = (cuerpo as { error?: unknown }).error;
  return typeof error === 'string' ? error : null;
}

function detallesDe(cuerpo: unknown): DetalleCampo[] {
  if (typeof cuerpo !== 'object' || cuerpo === null) return [];
  const crudos = (cuerpo as { detalles?: unknown }).detalles;
  if (!Array.isArray(crudos)) return [];
  return crudos.filter(esDetalle).map((detalle) => ({
    campo: detalle.campo,
    mensaje: detalle.mensaje,
  }));
}

function esDetalle(valor: unknown): valor is DetalleCampo {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as { campo?: unknown; mensaje?: unknown };
  return typeof posible.campo === 'string' && typeof posible.mensaje === 'string';
}
