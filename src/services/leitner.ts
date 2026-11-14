export const CAJA_MIN = 1;
export const CAJA_MAX = 5;

export type ResultadoRepaso = 'acierto' | 'fallo';

const DIAS_POR_CAJA = [1, 2, 4, 8, 16] as const;

export function siguienteCaja(caja: number, resultado: ResultadoRepaso): number {
  if (!Number.isInteger(caja) || caja < CAJA_MIN || caja > CAJA_MAX) {
    throw new RangeError(`Caja inválida: ${caja}`);
  }
  if (resultado === 'fallo') return CAJA_MIN;
  return Math.min(CAJA_MAX, caja + 1);
}

export function diasHastaRevision(caja: number): number {
  if (!Number.isInteger(caja) || caja < CAJA_MIN || caja > CAJA_MAX) {
    throw new RangeError(`Caja inválida: ${caja}`);
  }
  return DIAS_POR_CAJA[caja - 1] ?? 1;
}
