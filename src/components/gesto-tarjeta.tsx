import { useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export const UMBRAL_DESLIZAMIENTO = 80;

export type PropsGestoTarjeta = {
  children: ReactNode;
  onAcierto: () => void;
  onFallo: () => void;
};

export function GestoTarjeta({ children, onAcierto, onFallo }: PropsGestoTarjeta) {
  const desplazamiento = useSharedValue(0);

  const gesto = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((evento) => {
          desplazamiento.set(evento.translationX);
        })
        .onEnd((evento) => {
          if (evento.translationX >= UMBRAL_DESLIZAMIENTO) {
            runOnJS(onAcierto)();
          } else if (evento.translationX <= -UMBRAL_DESLIZAMIENTO) {
            runOnJS(onFallo)();
          }
          desplazamiento.set(withSpring(0));
        }),
    [desplazamiento, onAcierto, onFallo],
  );

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: desplazamiento.get() }],
  }));

  return (
    <GestureDetector gesture={gesto}>
      <Animated.View
        testID="gesto-tarjeta"
        style={[styles.contenedor, estilo]}
        accessibilityHint="Desliza la tarjeta a la derecha si lo sabías y a la izquierda si no lo sabías"
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    width: '100%',
  },
});
