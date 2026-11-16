import * as SecureStore from 'expo-secure-store';
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
