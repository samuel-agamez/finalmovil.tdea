import { MAX_CARACTERES, validarNombreMazo, validarTextoTarjeta } from './validaciones';

describe('validación de tarjetas', () => {
  it('exige pregunta y respuesta', () => {
    expect(validarTextoTarjeta('', '   ')).toEqual([
      'La pregunta es obligatoria',
      'La respuesta es obligatoria',
    ]);
  });

  it('rechaza más de 300 caracteres', () => {
    const larga = 'x'.repeat(MAX_CARACTERES + 1);
    expect(validarTextoTarjeta(larga, 'respuesta')).toEqual([
      'La pregunta debe tener máximo 300 caracteres',
    ]);
  });

  it('acepta exactamente 300 caracteres', () => {
    const justa = 'x'.repeat(MAX_CARACTERES);
    expect(validarTextoTarjeta(justa, justa)).toEqual([]);
  });

  it('ignora espacios en los bordes', () => {
    expect(validarTextoTarjeta('  ¿2+2?  ', ' 4 ')).toEqual([]);
  });
});

describe('validación del nombre del mazo', () => {
  it('exige un nombre', () => {
    expect(validarNombreMazo('   ')).toBe('El nombre del mazo es obligatorio');
  });

  it('acepta un nombre con texto', () => {
    expect(validarNombreMazo('Biología')).toBeNull();
  });
});
