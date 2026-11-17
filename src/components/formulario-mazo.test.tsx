import { fireEvent, render, screen } from '@testing-library/react-native';
import { FormularioMazo } from './formulario-mazo';

describe('formulario de mazo', () => {
  it('crea el mazo con el nombre escrito', async () => {
    const onCrear = jest.fn();
    await render(<FormularioMazo onCrear={onCrear} />);

    await fireEvent.changeText(screen.getByLabelText('Nombre del mazo'), 'Inglés');
    await fireEvent.press(screen.getByText('Crear mazo'));

    expect(onCrear).toHaveBeenCalledWith('Inglés');
  });

  it('el botón está deshabilitado mientras está ocupado', async () => {
    await render(<FormularioMazo onCrear={() => undefined} ocupado />);

    expect(screen.getByLabelText('Crear mazo')).toBeDisabled();
  });

  it('el botón se habilita cuando no está ocupado', async () => {
    await render(<FormularioMazo onCrear={() => undefined} />);

    expect(screen.getByLabelText('Crear mazo')).toBeEnabled();
  });
});
