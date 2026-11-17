import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormularioTarjeta } from './formulario-tarjeta';

async function escribir(etiqueta: string, valor: string): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText(etiqueta), valor);
}

async function pulsarGuardar(): Promise<void> {
  await fireEvent.press(screen.getByText('Guardar tarjeta'));
}

describe('formulario de tarjeta', () => {
  it('muestra el contador de caracteres', async () => {
    await render(<FormularioTarjeta onGuardar={() => undefined} />);

    const contadores = screen.getAllByText('0/300');
    expect(contadores.length).toBe(2);
  });

  it('no guarda si faltan pregunta y respuesta', async () => {
    const onGuardar = jest.fn();
    await render(<FormularioTarjeta onGuardar={onGuardar} />);

    await pulsarGuardar();

    expect(await screen.findByText('La pregunta es obligatoria')).toBeTruthy();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('no guarda si falta la respuesta', async () => {
    const onGuardar = jest.fn();
    await render(<FormularioTarjeta onGuardar={onGuardar} />);

    await escribir('Pregunta', '¿Capital de Francia?');
    await pulsarGuardar();

    expect(await screen.findByText('La respuesta es obligatoria')).toBeTruthy();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('avisa si la pregunta es más larga de lo permitido', async () => {
    const onGuardar = jest.fn();
    await render(<FormularioTarjeta onGuardar={onGuardar} />);

    await escribir('Pregunta', 'a'.repeat(301));
    await escribir('Respuesta', 'París');
    await pulsarGuardar();

    expect(await screen.findByText('La pregunta debe tener máximo 300 caracteres')).toBeTruthy();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('guarda la tarjeta con los textos recortados', async () => {
    const onGuardar = jest.fn();
    await render(<FormularioTarjeta onGuardar={onGuardar} />);

    await escribir('Pregunta', '  ¿Capital de Francia?  ');
    await escribir('Respuesta', '  París  ');
    await pulsarGuardar();

    expect(onGuardar).toHaveBeenCalledWith('¿Capital de Francia?', 'París');
  });

  it('no muestra error cuando los datos son válidos', async () => {
    const onGuardar = jest.fn();
    await render(<FormularioTarjeta onGuardar={onGuardar} />);

    await escribir('Pregunta', '¿Capital de Francia?');
    await escribir('Respuesta', 'París');
    await pulsarGuardar();

    expect(onGuardar).toHaveBeenCalledWith('¿Capital de Francia?', 'París');
    expect(screen.queryByText('La pregunta es obligatoria')).toBeNull();
  });
});
