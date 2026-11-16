import { StyleSheet, Text, View } from 'react-native';

export function Inicio() {
  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Tarjetas de estudio</Text>
      <Text style={styles.texto}>Repaso espaciado con cajas de Leitner</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  texto: {
    fontSize: 16,
    textAlign: 'center',
    color: '#444444',
  },
});
