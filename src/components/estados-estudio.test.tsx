import { fireEvent, render, screen } from '@testing-library/react-native';
import { EstudioAlDia, EstudioCargando, EstudioTerminado } from './estados-estudio';

describe('estados de la pantalla de estudio', () => {
  it('muestra que está cargando', async () => {
    await render(<EstudioCargando />);

    expect(screen.getByText('Cargando tus tarjetas…')).toBeTruthy();
  });

  it('avisa que todo está al día', async () => {
    await render(<EstudioAlDia />);

    expect(screen.getByText('¡Todo al día!')).toBeTruthy();
  });

  it('resume el repaso terminado y permite repetir', async () => {
    const onRepetir = jest.fn();
    await render(<EstudioTerminado aciertos={3} fallos={1} onRepetir={onRepetir} />);

    expect(
      screen.getByText('3 aciertos y 1 fallos. Las tarjetas vuelven según su caja.'),
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Repetir'));

    expect(onRepetir).toHaveBeenCalledTimes(1);
  });
});
