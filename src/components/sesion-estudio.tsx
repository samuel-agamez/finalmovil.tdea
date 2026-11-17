import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestoTarjeta } from './gesto-tarjeta';
import { TarjetaEstudio } from './tarjeta-estudio';
import { COLORS, SPACING, RADIUS } from '../theme';

export type PropsSesionEstudio = {
  pregunta: string;
  respuesta: string;
  volteada: boolean;
  posicion: number;
  total: number;
  puedeLeer: boolean;
  puedeInclinar: boolean;
  manosLibres: boolean;
  onVoltear: () => void;
  onAcierto: () => void;
  onFallo: () => void;
  onLeer: () => void;
  onAlternarManosLibres: () => void;
};

type PropsAcciones = Pick<
  PropsSesionEstudio,
  | 'puedeLeer'
  | 'puedeInclinar'
  | 'manosLibres'
  | 'onAcierto'
  | 'onFallo'
  | 'onLeer'
  | 'onAlternarManosLibres'
>;

type PropsUtilidad = Pick<
  PropsSesionEstudio,
  'puedeLeer' | 'puedeInclinar' | 'manosLibres' | 'onLeer' | 'onAlternarManosLibres'
>;

function BotonesUtilidad({
  puedeLeer,
  puedeInclinar,
  manosLibres,
  onLeer,
  onAlternarManosLibres,
}: PropsUtilidad) {
  return (
    <View style={styles.utilidades}>
      <Pressable
        style={[styles.btnUtil, !puedeLeer && styles.disabled]}
        onPress={onLeer}
        disabled={!puedeLeer}
        accessibilityLabel="Leer en voz alta"
      >
        <Text style={styles.btnUtilText}>🔊 Leer</Text>
      </Pressable>
      <Pressable
        style={[
          styles.btnUtil,
          manosLibres && styles.btnUtilActive,
          !puedeInclinar && styles.disabled,
        ]}
        onPress={onAlternarManosLibres}
        disabled={!puedeInclinar}
        accessibilityLabel="Modo manos libres"
      >
        <Text style={[styles.btnUtilText, manosLibres && styles.btnUtilActiveText]}>
          {manosLibres ? '✨ Activo' : '📱 Manos Libres'}
        </Text>
      </Pressable>
    </View>
  );
}

function AccionesEstudio({
  puedeLeer,
  puedeInclinar,
  manosLibres,
  onAcierto,
  onFallo,
  onLeer,
  onAlternarManosLibres,
}: PropsAcciones) {
  return (
    <View style={styles.contenedorAcciones}>
      <BotonesUtilidad
        puedeLeer={puedeLeer}
        puedeInclinar={puedeInclinar}
        manosLibres={manosLibres}
        onLeer={onLeer}
        onAlternarManosLibres={onAlternarManosLibres}
      />

      <View style={styles.botonesRepaso}>
        <Pressable
          style={[styles.btnRepaso, styles.btnFallo]}
          onPress={onFallo}
          accessibilityLabel="No lo sabía"
        >
          <Text style={styles.btnRepasoText}>No lo sabía</Text>
        </Pressable>
        <Pressable
          style={[styles.btnRepaso, styles.btnAcierto]}
          onPress={onAcierto}
          accessibilityLabel="Lo sabía"
        >
          <Text style={styles.btnRepasoText}>Lo sabía</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SesionEstudio({
  pregunta,
  respuesta,
  volteada,
  posicion,
  total,
  onVoltear,
  ...acciones
}: PropsSesionEstudio) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.contador}>
          {posicion} <Text style={styles.de}>de</Text> {total}
        </Text>
      </View>

      <GestoTarjeta onAcierto={acciones.onAcierto} onFallo={acciones.onFallo}>
        <TarjetaEstudio
          pregunta={pregunta}
          respuesta={respuesta}
          volteada={volteada}
          onVoltear={onVoltear}
        />
      </GestoTarjeta>

      <AccionesEstudio {...acciones} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: SPACING.m,
    gap: SPACING.l,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.m,
  },
  contador: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  de: {
    fontWeight: '400',
    opacity: 0.6,
  },
  contenedorAcciones: {
    gap: SPACING.l,
    marginBottom: SPACING.l,
  },
  utilidades: {
    flexDirection: 'row',
    gap: SPACING.s,
    justifyContent: 'center',
  },
  btnUtil: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
    borderRadius: RADIUS.s,
    alignItems: 'center',
  },
  btnUtilActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  btnUtilText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  btnUtilActiveText: {
    color: COLORS.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  botonesRepaso: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  btnRepaso: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: RADIUS.m,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  btnFallo: {
    backgroundColor: COLORS.danger,
  },
  btnAcierto: {
    backgroundColor: COLORS.secondary,
  },
  btnRepasoText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
});
