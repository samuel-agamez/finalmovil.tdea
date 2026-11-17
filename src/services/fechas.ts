const MILIS_POR_DIA = 86_400_000;

export function ahoraIso(): string {
  return new Date().toISOString();
}

export function sumarDias(base: string, dias: number): string {
  const fecha = new Date(base);
  if (Number.isNaN(fecha.getTime())) {
    throw new RangeError(`Fecha inválida: ${base}`);
  }
  return new Date(fecha.getTime() + dias * MILIS_POR_DIA).toISOString();
}
