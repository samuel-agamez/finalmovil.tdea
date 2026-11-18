import * as SecureStore from 'expo-secure-store';
import { refrescar } from './auth';
import { FalloApi } from './errores';
import type { Sesion } from './tipos';

const CLAVE = 'sesion';

export async function guardarSesion(sesion: Sesion): Promise<void> {
  await SecureStore.setItemAsync(CLAVE, JSON.stringify(sesion));
}

export async function cargarSesion(): Promise<Sesion | null> {
  const guardado = await SecureStore.getItemAsync(CLAVE);
  if (guardado === null) return null;
  return parsear(guardado);
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE);
}

/**
 * Ejecuta `accion` con el token guardado. Si la API responde 401 (el token
 * dura una hora), renueva la sesión, la guarda y reintenta una vez.
 */
export async function ejecutarConSesion<T>(accion: (token: string) => Promise<T>): Promise<T> {
  const sesion = await cargarSesion();
  if (sesion === null) throw new Error('No hay sesión iniciada');
  try {
    return await accion(sesion.token);
  } catch (fallo) {
    if (!(fallo instanceof FalloApi && fallo.status === 401)) throw fallo;
    const tokens = await refrescar(sesion.refreshToken);
    await guardarSesion({ ...sesion, ...tokens });
    return await accion(tokens.token);
  }
}

function parsear(guardado: string): Sesion | null {
  try {
    const crudo: unknown = JSON.parse(guardado);
    return esSesion(crudo) ? crudo : null;
  } catch {
    return null;
  }
}

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  const usuario = posible.usuario as Record<string, unknown> | null | undefined;
  return (
    typeof posible.token === 'string' &&
    typeof posible.refreshToken === 'string' &&
    typeof posible.expiraEnSeg === 'number' &&
    typeof usuario === 'object' &&
    usuario !== null &&
    typeof usuario.id === 'string' &&
    typeof usuario.email === 'string'
  );
}
