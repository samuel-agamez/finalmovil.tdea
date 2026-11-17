import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';

export type PropsTarjetaEstudio = {
  pregunta: string;
  respuesta: string;
  volteada: boolean;
  onVoltear: () => void;
};

export function TarjetaEstudio({ pregunta, respuesta, volteada, onVoltear }: PropsTarjetaEstudio) {
  return (
    <Pressable
      testID="tarjeta-estudio"
      accessibilityRole="button"
      accessibilityLabel={volteada ? `Respuesta: ${respuesta}` : `Pregunta: ${pregunta}`}
      accessibilityHint="Toca para voltear la tarjeta"
      style={[styles.card, volteada ? styles.cardRespuesta : styles.cardPregunta]}
      onPress={onVoltear}
    >
      <View style={styles.contenido}>
        <Text style={styles.etiqueta}>{volteada ? 'RESPUESTA' : 'PREGUNTA'}</Text>
        <Text style={styles.texto}>{volteada ? respuesta : pregunta}</Text>
      </View>
      <Text style={styles.pista}>
        {volteada ? 'Toca para volver' : 'Toca para ver la respuesta'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.l,
    padding: SPACING.l,
    marginVertical: SPACING.m,
    minHeight: 240,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardPregunta: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardRespuesta: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  contenido: {
    alignItems: 'center',
    gap: SPACING.m,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  texto: {
    fontSize: 22,
    textAlign: 'center',
    color: COLORS.textMain,
    fontWeight: '500',
    lineHeight: 30,
  },
  pista: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
});
