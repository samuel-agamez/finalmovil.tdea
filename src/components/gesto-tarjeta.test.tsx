import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { GestoTarjeta } from './gesto-tarjeta';

type EventoDeslizamiento = { translationX: number };

const mockManejadores: {
  onUpdate?: ((evento: EventoDeslizamiento) => void) | undefined;
  onEnd?: ((evento: EventoDeslizamiento) => void) | undefined;
} = {};

jest.mock('react-native-gesture-handler', () => ({
  Gesture: {
    Pan: () => {
      const api = {
        onUpdate: (cb: (evento: EventoDeslizamiento) => void) => {
          mockManejadores.onUpdate = cb;
          return api;
        },
        onEnd: (cb: (evento: EventoDeslizamiento) => void) => {
          mockManejadores.onEnd = cb;
          return api;
        },
      };
      return api;
    },
  },
  GestureDetector: ({ children }: { children: ReactNode }) => children,
}));

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (valor: number) => ({ value: valor, get: () => valor, set: jest.fn() }),
    useAnimatedStyle: (calcular: () => object) => calcular(),
    withSpring: (valor: number) => valor,
    runOnJS: (fn: () => void) => fn,
  };
});

function deslizar(translationX: number) {
  mockManejadores.onEnd?.({ translationX });
}

describe('gesto de tarjeta', () => {
  beforeEach(() => {
    mockManejadores.onUpdate = undefined;
    mockManejadores.onEnd = undefined;
  });

  it('muestra la tarjeta que envuelve', async () => {
    await render(
      <GestoTarjeta onAcierto={jest.fn()} onFallo={jest.fn()}>
        <Text>¿Capital de Francia?</Text>
      </GestoTarjeta>,
    );

    expect(screen.getByText('¿Capital de Francia?')).toBeTruthy();
  });

  it('marca acierto al deslizar a la derecha', async () => {
    const onAcierto = jest.fn();
    const onFallo = jest.fn();
    await render(
      <GestoTarjeta onAcierto={onAcierto} onFallo={onFallo}>
        <Text>Tarjeta</Text>
      </GestoTarjeta>,
    );

    deslizar(120);

    expect(onAcierto).toHaveBeenCalledTimes(1);
    expect(onFallo).not.toHaveBeenCalled();
  });

  it('marca fallo al deslizar a la izquierda', async () => {
    const onAcierto = jest.fn();
    const onFallo = jest.fn();
    await render(
      <GestoTarjeta onAcierto={onAcierto} onFallo={onFallo}>
        <Text>Tarjeta</Text>
      </GestoTarjeta>,
    );

    deslizar(-120);

    expect(onFallo).toHaveBeenCalledTimes(1);
    expect(onAcierto).not.toHaveBeenCalled();
  });

  it('no hace nada si el deslizamiento es corto', async () => {
    const onAcierto = jest.fn();
    const onFallo = jest.fn();
    await render(
      <GestoTarjeta onAcierto={onAcierto} onFallo={onFallo}>
        <Text>Tarjeta</Text>
      </GestoTarjeta>,
    );

    deslizar(20);

    expect(onAcierto).not.toHaveBeenCalled();
    expect(onFallo).not.toHaveBeenCalled();
  });

  it('explica el gesto a los lectores de pantalla', async () => {
    await render(
      <GestoTarjeta onAcierto={jest.fn()} onFallo={jest.fn()}>
        <Text>Tarjeta</Text>
      </GestoTarjeta>,
    );

    expect(screen.getByTestId('gesto-tarjeta').props.accessibilityHint).toBe(
      'Desliza la tarjeta a la derecha si lo sabías y a la izquierda si no lo sabías',
    );
  });
});
