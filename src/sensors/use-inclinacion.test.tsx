import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PermissionStatus, type PermissionResponse } from 'expo';
import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import { Button, Text } from 'react-native';
import { useInclinacion } from './use-inclinacion';

jest.mock('expo-sensors', () => ({
  DeviceMotion: {
    isAvailableAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(),
  },
}));

const disponibleMock = jest.mocked(DeviceMotion.isAvailableAsync);
const permisoMock = jest.mocked(DeviceMotion.requestPermissionsAsync);
const intervaloMock = jest.mocked(DeviceMotion.setUpdateInterval);
const escucharMock = jest.mocked(DeviceMotion.addListener);

type Oyente = (datos: DeviceMotionMeasurement) => void;

const quitarMock = jest.fn();

function permiso(status: PermissionStatus): PermissionResponse {
  return {
    status,
    expires: 'never',
    granted: status === PermissionStatus.GRANTED,
    canAskAgain: true,
  };
}

function medicion(gamma: number): DeviceMotionMeasurement {
  return {
    acceleration: null,
    accelerationIncludingGravity: { x: 0, y: 0, z: 0, timestamp: 0 },
    rotation: { alpha: 0, beta: 0.2, gamma, timestamp: 0 },
    rotationRate: null,
    interval: 100,
    orientation: 0,
  };
}

function Anfitrion() {
  const { disponible, inclinacion, activar, desactivar } = useInclinacion();
  const texto =
    inclinacion === null
      ? 'sin datos'
      : `${inclinacion.roll}|${inclinacion.pitch}|${inclinacion.aLaDerecha}`;
  return (
    <>
      <Text testID="disponible">{String(disponible)}</Text>
      <Text testID="inclinacion">{texto}</Text>
      <Button title="Activar" onPress={() => void activar()} />
      <Button title="Desactivar" onPress={desactivar} />
    </>
  );
}

async function montar() {
  return await render(<Anfitrion />);
}

describe('sensor de inclinación', () => {
  let oyente: Oyente | null = null;

  beforeEach(() => {
    oyente = null;
    quitarMock.mockReset();
    disponibleMock.mockReset();
    permisoMock.mockReset();
    intervaloMock.mockReset();
    escucharMock.mockReset();
    disponibleMock.mockResolvedValue(true);
    permisoMock.mockResolvedValue(permiso(PermissionStatus.GRANTED));
    intervaloMock.mockImplementation(() => undefined);
    escucharMock.mockImplementation((cb: Oyente) => {
      oyente = cb;
      return { remove: quitarMock } as unknown as ReturnType<typeof DeviceMotion.addListener>;
    });
  });

  it('no se suscribe si el sensor no está disponible', async () => {
    disponibleMock.mockResolvedValue(false);
    await montar();

    await fireEvent.press(screen.getByText('Activar'));

    expect(screen.getByTestId('disponible')).toHaveTextContent('false');
    expect(escucharMock).not.toHaveBeenCalled();
  });

  it('no se suscribe si el usuario no da permiso', async () => {
    permisoMock.mockResolvedValue(permiso(PermissionStatus.DENIED));
    await montar();

    await fireEvent.press(screen.getByText('Activar'));

    expect(escucharMock).not.toHaveBeenCalled();
  });

  it('no rompe si el sensor falla', async () => {
    disponibleMock.mockRejectedValue(new Error('sin sensor'));
    await montar();

    await fireEvent.press(screen.getByText('Activar'));

    expect(screen.getByTestId('disponible')).toHaveTextContent('false');
  });

  it('entrega la inclinación y si el móvil está a la derecha', async () => {
    await montar();

    await fireEvent.press(screen.getByText('Activar'));
    await waitFor(() => expect(oyente).not.toBeNull());

    oyente?.(medicion(0.4));

    await waitFor(() =>
      expect(screen.getByTestId('inclinacion')).toHaveTextContent('0.4|0.2|true'),
    );
  });

  it('marca que no está a la derecha si el roll es negativo', async () => {
    await montar();

    await fireEvent.press(screen.getByText('Activar'));
    await waitFor(() => expect(oyente).not.toBeNull());

    oyente?.(medicion(-0.4));

    await waitFor(() =>
      expect(screen.getByTestId('inclinacion')).toHaveTextContent('-0.4|0.2|false'),
    );
  });

  it('desactiva el sensor y limpia la suscripción', async () => {
    await montar();

    await fireEvent.press(screen.getByText('Activar'));
    await fireEvent.press(screen.getByText('Desactivar'));

    expect(quitarMock).toHaveBeenCalled();
    expect(screen.getByTestId('inclinacion')).toHaveTextContent('sin datos');
  });

  it('cancela la suscripción al salir de la pantalla', async () => {
    const { unmount } = await montar();

    await fireEvent.press(screen.getByText('Activar'));
    await unmount();

    expect(quitarMock).toHaveBeenCalled();
  });
});
