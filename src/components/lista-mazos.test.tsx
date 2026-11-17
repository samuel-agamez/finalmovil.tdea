import { fireEvent, render, screen } from '@testing-library/react-native';
import type { MazoConProgreso } from '../repositories/tipos';
import { ListaMazos } from './lista-mazos';

const mazo: MazoConProgreso = {
  id: 7,
  nombre: 'Biología',
  remote_id: null,
  updated_at: null,
  deleted: 0,
  pending: 0,
  total: 3,
  dominadas: 1,
  en_progreso: 2,
};

describe('lista de mazos', () => {
  it('muestra el mensaje de lista vacía', async () => {
    await render(
      <ListaMazos
        mazos={[]}
        error={null}
        sinConexion={false}
        onAbrir={jest.fn()}
        onEstudiar={jest.fn()}
      />,
    );

    expect(screen.getByText('Todavía no tienes mazos')).toBeTruthy();
  });

  it('muestra el error y el aviso de sin conexión', async () => {
    await render(
      <ListaMazos
        mazos={[]}
        error="No se pudo crear el mazo"
        sinConexion
        onAbrir={jest.fn()}
        onEstudiar={jest.fn()}
      />,
    );

    expect(screen.getByText('No se pudo crear el mazo')).toBeTruthy();
    expect(screen.getByText('Sin conexión: se muestran solo los datos guardados.')).toBeTruthy();
  });

  it('abre y estudia el mazo pulsado', async () => {
    const onAbrir = jest.fn();
    const onEstudiar = jest.fn();
    await render(
      <ListaMazos
        mazos={[mazo]}
        error={null}
        sinConexion={false}
        onAbrir={onAbrir}
        onEstudiar={onEstudiar}
      />,
    );

    await fireEvent.press(screen.getByLabelText('Ver tarjetas de Biología'));
    await fireEvent.press(screen.getByLabelText('Estudiar Biología'));

    expect(onAbrir).toHaveBeenCalledWith(7);
    expect(onEstudiar).toHaveBeenCalledWith(7);
  });
});
