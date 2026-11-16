export type DetalleCampo = { campo: string; mensaje: string };

export class FalloApi extends Error {
  readonly status: number;
  readonly detalles: DetalleCampo[];

  constructor(status: number, mensaje: string, detalles: DetalleCampo[] = []) {
    super(mensaje);
    this.name = 'FalloApi';
    this.status = status;
    this.detalles = detalles;
  }
}
