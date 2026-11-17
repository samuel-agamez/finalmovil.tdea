import { Pressable, StyleSheet, Text } from 'react-native';

export type PropsTarjetaEstudio = {
  pregunta: string;
  respuesta: string;
  volteada: boolean;
  onVoltear: () => void;
};

export function TarjetaEstudio({ pregunta, respuesta, volteada, onVoltear }: PropsTarjetaEstudio) {
  const etiqueta = volteada
    ? `Respuesta: ${respuesta}`
    : `Pregunta: ${pregunta}. Toca para ver la respuesta`;

  return (
    <Pressable
      testID="tarjeta-estudio"
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityHint="Toca para voltear la tarjeta"
      style={styles.tarjeta}
      onPress={onVoltear}
    >
      <Text style={styles.texto}>{volteada ? respuesta : pregunta}</Text>
      <Text style={styles.pista}>{volteada ? 'Respuesta' : 'Toca para voltear'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cccccc',
    padding: 24,
    marginVertical: 12,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: 20,
    textAlign: 'center',
    color: '#111111',
  },
  pista: {
    marginTop: 16,
    fontSize: 13,
    color: '#666666',
  },
});
