export type RespuestaItem<T> = { item: T };

export type RespuestaLista<T> = {
  items: T[];
  servidor_ahora: string;
};

export type RespuestaOk = { ok: true };
