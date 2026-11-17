import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MazoConProgreso } from '../repositories/tipos';
import { COLORS, SPACING, RADIUS } from '../theme';

export type PropsMazoFila = {
  mazo: MazoConProgreso;
  onAbrir: (id: number) => void;
  onEstudiar: (id: number) => void;
};

export function MazoFila({ mazo, onAbrir, onEstudiar }: PropsMazoFila) {
  const porcentaje = mazo.total === 0 ? 0 : Math.round((mazo.dominadas / mazo.total) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.nombre}>{mazo.nombre}</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>
            {mazo.dominadas}/{mazo.total} dominadas
          </Text>
          <Text style={styles.porcentaje}>{porcentaje}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${porcentaje}%` }]} />
        </View>
      </View>

      <View style={styles.acciones}>
        <Pressable
          style={styles.btnSecondary}
          onPress={() => onAbrir(mazo.id)}
          accessibilityLabel={`Ver tarjetas de ${mazo.nombre}`}
        >
          <Text style={styles.btnSecondaryText}>Tarjetas</Text>
        </Pressable>
        <Pressable
          style={styles.btnPrimary}
          onPress={() => onEstudiar(mazo.id)}
          accessibilityLabel={`Estudiar ${mazo.nombre}`}
        >
          <Text style={styles.btnPrimaryText}>Estudiar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    marginVertical: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  info: {
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  porcentaje: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginTop: SPACING.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  acciones: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.s,
    borderRadius: RADIUS.s,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.s,
    borderRadius: RADIUS.s,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
