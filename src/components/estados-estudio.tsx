import { Button, StyleSheet, Text, View } from 'react-native';

export function EstudioCargando() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.mensaje}>Cargando tus tarjetas…</Text>
    </View>
  );
}

export function EstudioAlDia() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>¡Todo al día!</Text>
      <Text style={styles.mensaje}>No hay tarjetas pendientes de repaso en este mazo.</Text>
    </View>
  );
}

export type PropsEstudioTerminado = {
  aciertos: number;
  fallos: number;
  onRepetir: () => void;
};

export function EstudioTerminado({ aciertos, fallos, onRepetir }: PropsEstudioTerminado) {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Repaso terminado</Text>
      <Text style={styles.mensaje}>
        {aciertos} aciertos y {fallos} fallos. Las tarjetas vuelven según su caja.
      </Text>
      <Button title="Repetir" accessibilityLabel="Repetir" onPress={onRepetir} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111111',
  },
  mensaje: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555555',
  },
});
