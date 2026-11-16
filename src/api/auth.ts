import { pedir } from './cliente';
import type { Sesion, TokensRefresco, Usuario } from './tipos';

export async function registro(email: string, password: string): Promise<Sesion> {
  return await pedir<Sesion>({
    ruta: '/api/auth/registro',
    metodo: 'POST',
    cuerpo: { email, password },
  });
}

export async function login(email: string, password: string): Promise<Sesion> {
  return await pedir<Sesion>({
    ruta: '/api/auth/login',
    metodo: 'POST',
    cuerpo: { email, password },
  });
}

export async function refrescar(refreshToken: string): Promise<TokensRefresco> {
  return await pedir<TokensRefresco>({
    ruta: '/api/auth/refresh',
    metodo: 'POST',
    cuerpo: { refreshToken },
  });
}

export async function yo(token: string): Promise<Usuario> {
  const respuesta = await pedir<{ usuario: Usuario }>({ ruta: '/api/auth/yo', token });
  return respuesta.usuario;
}
