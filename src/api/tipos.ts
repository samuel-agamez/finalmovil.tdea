export type Usuario = { id: string; email: string };

export type Sesion = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: Usuario;
};

export type TokensRefresco = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
};
