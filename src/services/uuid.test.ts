import { generarUuid } from './uuid';

describe('generador de UUID', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('genera un UUID versión 4 con la variante correcta', () => {
    expect(generarUuid()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('produce identificadores distintos', () => {
    expect(generarUuid()).not.toBe(generarUuid());
  });

  it('es determinista con el generador aleatorio fijado', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    expect(generarUuid()).toBe('00000000-0000-4000-8000-000000000000');
  });
});
