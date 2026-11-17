import { esVencida, filtrarVencidas } from './vencidas';

const AHORA = '2026-11-16T10:00:00.000Z';

function tarjeta(deleted: number, proxima_revision: string) {
  return { proxima_revision, deleted };
}

describe('consulta de tarjetas vencidas', () => {
  it('una tarjeta con revisión pasada está vencida', () => {
    expect(esVencida(tarjeta(0, '2026-11-15T10:00:00.000Z'), AHORA)).toBe(true);
  });

  it('una tarjeta con revisión futura no está vencida', () => {
    expect(esVencida(tarjeta(0, '2026-11-17T10:00:00.000Z'), AHORA)).toBe(false);
  });

  it('en el borde exacto ya está vencida', () => {
    expect(esVencida(tarjeta(0, AHORA), AHORA)).toBe(true);
  });

  it('una tarjeta borrada nunca está vencida', () => {
    expect(esVencida(tarjeta(1, '2026-01-01T00:00:00.000Z'), AHORA)).toBe(false);
  });

  it('una fecha ilegible no se considera vencida', () => {
    expect(esVencida(tarjeta(0, 'fecha-rota'), AHORA)).toBe(false);
  });

  it('filtra la lista dejando solo las vencidas', () => {
    const lista = [
      tarjeta(0, '2026-11-01T00:00:00.000Z'),
      tarjeta(0, '2027-01-01T00:00:00.000Z'),
      tarjeta(0, '2026-11-16T09:59:59.000Z'),
    ];
    expect(filtrarVencidas(lista, AHORA)).toEqual([
      tarjeta(0, '2026-11-01T00:00:00.000Z'),
      tarjeta(0, '2026-11-16T09:59:59.000Z'),
    ]);
  });

  it('sin vencidas la lista queda vacía («¡Todo al día!»)', () => {
    const lista = [tarjeta(0, '2027-01-01T00:00:00.000Z')];
    expect(filtrarVencidas(lista, AHORA)).toEqual([]);
  });
});
