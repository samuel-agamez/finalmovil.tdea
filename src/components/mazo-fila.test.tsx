import { fireEvent, render, screen } from '@testing-library/react-native';
import type { MazoConProgreso } from '../repositories/tipos';
import { MazoFila } from './mazo-fila';

const MAZO: MazoConProgreso = {
  id: 7,
  nombre: 'Historia de España',
  remote_id: null,
  updated_at: null,
  deleted: 0,
  pending: 0,
  total: 12,
  dominadas: 3,
  en_progreso: 5,
};

describe('fila de mazo', () => {
  it('muestra el nombre del mazo', async () => {
    await render(<MazoFila mazo={MAZO} onAbrir={() => undefined} onEstudiar={() => undefined} />);

    expect(screen.getByText('Historia de España')).toBeTruthy();
  });

  it('muestra el progreso de tarjetas', async () => {
    await render(<MazoFila mazo={MAZO} onAbrir={() => undefined} onEstudiar={() => undefined} />);

    expect(screen.getByText('3/12 dominadas')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('el botón Tarjetas abre el mazo con su id', async () => {
    const onAbrir = jest.fn();
    await render(<MazoFila mazo={MAZO} onAbrir={onAbrir} onEstudiar={() => undefined} />);

    await fireEvent.press(screen.getByText('Tarjetas'));

    expect(onAbrir).toHaveBeenCalledWith(7);
  });

  it('el botón Estudiar llama a onEstudiar con el id', async () => {
    const onEstudiar = jest.fn();
    await render(<MazoFila mazo={MAZO} onAbrir={() => undefined} onEstudiar={onEstudiar} />);

    await fireEvent.press(screen.getByText('Estudiar'));

    expect(onEstudiar).toHaveBeenCalledWith(7);
  });

  it('los botones tienen etiqueta accesible con el nombre del mazo', async () => {
    await render(<MazoFila mazo={MAZO} onAbrir={() => undefined} onEstudiar={() => undefined} />);

    expect(screen.getByLabelText('Ver tarjetas de Historia de España')).toBeTruthy();
    expect(screen.getByLabelText('Estudiar Historia de España')).toBeTruthy();
  });
});
