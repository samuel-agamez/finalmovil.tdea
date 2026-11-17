import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Tarjeta } from '../repositories/tipos';
import { ListaTarjetas } from './lista-tarjetas';

const TARJETA: Tarjeta = {
  id: 4,
  mazo_id: 1,
  pregunta: '¿Capital de Francia?',
  respuesta: 'París',
  caja: 2,
  proxima_revision: '2026-01-01T00:00:00.000Z',
  remote_id: null,
  updated_at: null,
  deleted: 0,
  pending: 0,
};

describe('lista de tarjetas', () => {
  it('muestra las tarjetas del mazo', async () => {
    await render(<ListaTarjetas tarjetas={[TARJETA]} onBorrar={() => undefined} />);

    expect(screen.getByText('¿Capital de Francia?')).toBeTruthy();
    expect(screen.getByText('París')).toBeTruthy();
    expect(screen.getByText('Caja 2')).toBeTruthy();
  });

  it('borra la tarjeta con su id', async () => {
    const onBorrar = jest.fn();
    await render(<ListaTarjetas tarjetas={[TARJETA]} onBorrar={onBorrar} />);

    await fireEvent.press(screen.getByLabelText('Borrar tarjeta ¿Capital de Francia?'));

    expect(onBorrar).toHaveBeenCalledWith(4);
  });

  it('avisa cuando el mazo no tiene tarjetas', async () => {
    await render(<ListaTarjetas tarjetas={[]} onBorrar={() => undefined} />);

    expect(screen.getByText('Este mazo aún no tiene tarjetas')).toBeTruthy();
  });
});
