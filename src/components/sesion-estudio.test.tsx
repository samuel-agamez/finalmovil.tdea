import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SesionEstudio } from './sesion-estudio';

jest.mock('./gesto-tarjeta', () => ({
  GestoTarjeta: ({ children }: { children: ReactNode }) => children,
}));

const props = {
  pregunta: '¿Capital de Francia?',
  respuesta: 'París',
  volteada: false,
  posicion: 2,
  total: 5,
  puedeLeer: true,
  puedeInclinar: true,
  manosLibres: false,
  onVoltear: jest.fn(),
  onAcierto: jest.fn(),
  onFallo: jest.fn(),
  onLeer: jest.fn(),
  onAlternarManosLibres: jest.fn(),
};

describe('sesión de estudio', () => {
  beforeEach(() => {
    props.onVoltear.mockReset();
    props.onAcierto.mockReset();
    props.onFallo.mockReset();
    props.onLeer.mockReset();
    props.onAlternarManosLibres.mockReset();
  });

  it('muestra la posición y la tarjeta', async () => {
    await render(<SesionEstudio {...props} />);

    expect(screen.getByText('2 de 5')).toBeTruthy();
    expect(screen.getByText('¿Capital de Francia?')).toBeTruthy();
  });

  it('voltea la tarjeta al tocarla', async () => {
    await render(<SesionEstudio {...props} />);

    await fireEvent.press(screen.getByTestId('tarjeta-estudio'));

    expect(props.onVoltear).toHaveBeenCalledTimes(1);
  });

  it('marca acierto y fallo con botones equivalentes al gesto', async () => {
    await render(<SesionEstudio {...props} />);

    await fireEvent.press(screen.getByText('Lo sabía'));
    await fireEvent.press(screen.getByText('No lo sabía'));

    expect(props.onAcierto).toHaveBeenCalledTimes(1);
    expect(props.onFallo).toHaveBeenCalledTimes(1);
  });

  it('lee la pregunta en voz alta', async () => {
    await render(<SesionEstudio {...props} />);

    await fireEvent.press(screen.getByLabelText('Leer en voz alta'));

    expect(props.onLeer).toHaveBeenCalledTimes(1);
  });

  it('deshabilita la voz si no hay voces disponibles', async () => {
    await render(<SesionEstudio {...props} puedeLeer={false} />);

    expect(screen.getByLabelText('Leer en voz alta')).toBeDisabled();
  });

  it('activa y desactiva el modo manos libres', async () => {
    await render(<SesionEstudio {...props} />);

    await fireEvent.press(screen.getByLabelText('Modo manos libres'));
    expect(props.onAlternarManosLibres).toHaveBeenCalledTimes(1);

    await screen.rerender(<SesionEstudio {...props} manosLibres />);
    expect(screen.getByText('✨ Activo')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Modo manos libres'));
    expect(props.onAlternarManosLibres).toHaveBeenCalledTimes(2);
  });

  it('deshabilita manos libres si el sensor no está disponible', async () => {
    await render(<SesionEstudio {...props} puedeInclinar={false} />);

    expect(screen.getByLabelText('Modo manos libres')).toBeDisabled();
  });
});
