import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../src/theme';
import { cerrarSesion } from '../../src/api/sesion';
import { FormularioMazo } from '../../src/components/formulario-mazo';
import { ListaMazos } from '../../src/components/lista-mazos';
import { useMazos } from '../../src/hooks/use-mazos';

export default function Mazos() {
  const router = useRouter();
  const { mazos, termino, setTermino, error, sinConexion, crear, cargando } = useMazos();

  async function handleLogout() {
    await cerrarSesion();
    router.replace('/login');
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.cargandoTexto}>Cargando tus mazos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mis Mazos</Text>
        <Pressable
          style={styles.btnLogout}
          onPress={handleLogout}
          accessibilityLabel="Cerrar sesión"
        >
          <Text style={styles.btnLogoutText}>Salir</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.buscador}
        accessibilityLabel="Buscar mazos"
        placeholder="Buscar mazos..."
        value={termino}
        onChangeText={setTermino}
      />
      <FormularioMazo onCrear={(nombre) => void crear(nombre)} />
      <ListaMazos
        mazos={mazos}
        error={error}
        sinConexion={sinConexion}
        onAbrir={(id) => router.push(`/mazo/${id}`)}
        onEstudiar={(id) => router.push(`/estudio/${id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  cargandoTexto: {
    fontSize: 16,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.l,
    marginTop: SPACING.m,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textMain,
  },
  btnLogout: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.s,
  },
  btnLogoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  buscador: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.textMain,
    marginBottom: 16,
    elevation: 1,
  },
});
