import { fireEvent, render, screen } from '@testing-library/react-native';
import { TarjetaEstudio } from './tarjeta-estudio';

describe('tarjeta de estudio', () => {
  it('muestra la pregunta al principio', async () => {
    await render(
      <TarjetaEstudio
        pregunta="¿Capital de Francia?"
        respuesta="París"
        volteada={false}
        onVoltear={() => undefined}
      />,
    );

    expect(screen.getByText('¿Capital de Francia?')).toBeTruthy();
    expect(screen.queryByText('París')).toBeNull();
  });

  it('se voltea al tocarla', async () => {
    const onVoltear = jest.fn();
    await render(
      <TarjetaEstudio
        pregunta="¿Capital de Francia?"
        respuesta="París"
        volteada={false}
        onVoltear={onVoltear}
      />,
    );

    await fireEvent.press(screen.getByTestId('tarjeta-estudio'));

    expect(onVoltear).toHaveBeenCalled();
  });

  it('es accesible por lector de pantalla', async () => {
    await render(
      <TarjetaEstudio
        pregunta="¿Capital de Francia?"
        respuesta="París"
        volteada={false}
        onVoltear={() => undefined}
      />,
    );

    expect(screen.getByLabelText('Pregunta: ¿Capital de Francia?')).toBeTruthy();
    expect(screen.getByTestId('tarjeta-estudio').props.accessibilityHint).toBe(
      'Toca para voltear la tarjeta',
    );
  });

  it('anuncia la respuesta cuando ya está volteada', async () => {
    await render(
      <TarjetaEstudio
        pregunta="¿Capital de Francia?"
        respuesta="París"
        volteada
        onVoltear={() => undefined}
      />,
    );

    expect(screen.getByText('París')).toBeTruthy();
    expect(screen.getByLabelText('Respuesta: París')).toBeTruthy();
  });
});
