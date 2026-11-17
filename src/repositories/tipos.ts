export type Mazo = {
  id: number;
  nombre: string;
  remote_id: string | null;
  updated_at: string | null;
  deleted: number;
  pending: number;
};

export type MazoConProgreso = Mazo & {
  total: number;
  dominadas: number;
  en_progreso: number;
};

export type Tarjeta = {
  id: number;
  mazo_id: number;
  pregunta: string;
  respuesta: string;
  caja: number;
  proxima_revision: string;
  remote_id: string | null;
  updated_at: string | null;
  deleted: number;
  pending: number;
};

export type NuevaTarjeta = Pick<Tarjeta, 'mazo_id' | 'pregunta' | 'respuesta'>;

/** Cambio recebido del servidor para un mazo. */
export type CambioMazo = {
  id: string;
  nombre: string;
  updated_at: string;
  deleted_at: string | null;
};

/** Cambio recebido del servidor para una tarjeta. */
export type CambioTarjeta = {
  id: string;
  mazo_id: string;
  pregunta: string;
  respuesta: string;
  caja: number;
  proxima_revision: string | null;
  updated_at: string;
  deleted_at: string | null;
};
