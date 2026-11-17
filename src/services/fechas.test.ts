import { ahoraIso, sumarDias } from './fechas';

describe('ahoraIso', () => {
  it('devuelve una fecha ISO 8601 UTC', () => {
    const ahora = ahoraIso();
    expect(ahora).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('sumarDias', () => {
  it('suma días en ISO 8601 UTC', () => {
    expect(sumarDias('2026-11-16T10:00:00.000Z', 4)).toBe('2026-11-20T10:00:00.000Z');
  });

  it('cruza de mes sin desbordar', () => {
    expect(sumarDias('2026-11-30T00:00:00.000Z', 1)).toBe('2026-12-01T00:00:00.000Z');
  });

  it('acepta dieciséis días para la caja 5', () => {
    expect(sumarDias('2026-01-01T00:00:00.000Z', 16)).toBe('2026-01-17T00:00:00.000Z');
  });

  it('rechaza una fecha inválida', () => {
    expect(() => sumarDias('no-es-fecha', 1)).toThrow(RangeError);
  });
});
