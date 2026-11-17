import { act, renderHook } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { useVoz } from './use-voz';

jest.mock('expo-speech', () => ({
  getAvailableVoicesAsync: jest.fn(),
  speak: jest.fn(),
  stop: jest.fn(),
  VoiceQuality: { Default: 'Default', Enhanced: 'Enhanced' },
}));

const vocesMock = jest.mocked(Speech.getAvailableVoicesAsync);
const hablarMock = jest.mocked(Speech.speak);
const pararMock = jest.mocked(Speech.stop);

const VOZ = {
  identifier: 'es-ES',
  name: 'Elvira',
  language: 'es-ES',
  quality: Speech.VoiceQuality.Enhanced,
};

async function montar(conVoz: boolean) {
  vocesMock.mockResolvedValue(conVoz ? [VOZ] : []);
  const vista = await renderHook(() => useVoz());
  return vista;
}

describe('sensor de voz', () => {
  beforeEach(() => {
    vocesMock.mockReset();
    hablarMock.mockReset();
    pararMock.mockReset();
    pararMock.mockResolvedValue(undefined);
  });

  it('consulta las voces disponibles al montar', async () => {
    await montar(true);

    expect(vocesMock).toHaveBeenCalled();
  });

  it('lee la pregunta en voz alta', async () => {
    hablarMock.mockImplementation((_texto: string, opciones?: { onDone?: () => void }) => {
      opciones?.onDone?.();
    });
    const { result } = await montar(true);

    await act(async () => {
      await result.current?.leer('¿2+2?');
    });

    expect(hablarMock).toHaveBeenCalledWith(
      '¿2+2?',
      expect.objectContaining({ language: 'es-ES' }),
    );
    expect(result.current?.leyendo).toBe(false);
  });

  it('no lee nada si no hay voces instaladas', async () => {
    const { result } = await montar(false);

    await act(async () => {
      await result.current?.leer('¿2+2?');
    });

    expect(hablarMock).not.toHaveBeenCalled();
  });

  it('no rompe si la comprobación falla', async () => {
    vocesMock.mockRejectedValue(new Error('sin motor de voz'));
    const { result } = await montar(false);

    await act(async () => {
      await result.current?.leer('¿2+2?');
    });

    expect(hablarMock).not.toHaveBeenCalled();
  });

  it('no lee un texto vacío', async () => {
    const { result } = await montar(true);

    await act(async () => {
      await result.current?.leer('   ');
    });

    expect(hablarMock).not.toHaveBeenCalled();
  });

  it('detiene la lectura al salir de la pantalla', async () => {
    const { unmount } = await montar(true);

    await unmount();

    expect(pararMock).toHaveBeenCalled();
  });
});
