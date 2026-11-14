import { diasHastaRevision, siguienteCaja } from './leitner';

describe('siguienteCaja', () => {
  it('sube de caja al acertar', () => {
    expect(siguienteCaja(2, 'acierto')).toBe(3);
  });

  it('no pasa de la caja máxima', () => {
    expect(siguienteCaja(5, 'acierto')).toBe(5);
  });

  it('vuelve a la caja 1 al fallar', () => {
    expect(siguienteCaja(4, 'fallo')).toBe(1);
  });

  it('rechaza cajas fuera de rango', () => {
    expect(() => siguienteCaja(0, 'acierto')).toThrow(RangeError);
    expect(() => siguienteCaja(6, 'fallo')).toThrow(RangeError);
  });
});

describe('diasHastaRevision', () => {
  it('crece con la caja', () => {
    expect(diasHastaRevision(1)).toBe(1);
    expect(diasHastaRevision(5)).toBe(16);
  });

  it('rechaza cajas fuera de rango', () => {
    expect(() => diasHastaRevision(3.5)).toThrow(RangeError);
  });
});
