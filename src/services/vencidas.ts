import type { Tarjeta } from '../repositories/tipos';

type Candidata = Pick<Tarjeta, 'proxima_revision' | 'deleted'>;

export function esVencida(tarjeta: Candidata, ahora: string): boolean {
  if (tarjeta.deleted === 1) return false;
  const revision = Date.parse(tarjeta.proxima_revision);
  const limite = Date.parse(ahora);
  if (Number.isNaN(revision) || Number.isNaN(limite)) return false;
  return revision <= limite;
}

export function filtrarVencidas<T extends Candidata>(tarjetas: T[], ahora: string): T[] {
  return tarjetas.filter((tarjeta) => esVencida(tarjeta, ahora));
}
