import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, Pressable, Text, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../src/theme';
import { cargarSesion, cerrarSesion } from '../../src/api/sesion';
import { FormularioMazo } from '../../src/components/formulario-mazo';
import { ListaMazos } from '../../src/components/lista-mazos';
import type { MazoConProgreso } from '../../src/repositories/tipos';
import { buscarMazos, crearMazo, listarMazos } from '../../src/services/mazos';
import { sincronizar } from '../../src/services/sincronizacion';
import { cargarDatosPrueba } from '../../src/services/semillas';

async function sincronizarEnFondo(token: string, alFallar: () => void): Promise<void> {
  try {
    await cargarDatosPrueba();
    await sincronizar(token);
  } catch {
    alFallar();
  }
}

function useMazos() {
  const router = useRouter();
  const [mazos, setMazos] = useState<MazoConProgreso[]>([]);
  const [termino, setTermino] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const sesion = await cargarSesion();
      if (sesion === null) {
        router.replace('/login');
        return;
      }
      // 1. CARGA INMEDIATA: mostrar los datos locales sin esperar a la red
      const listaLocal = termino.trim() === '' ? await listarMazos() : await buscarMazos(termino);
      setMazos(listaLocal);
      // 2. PROCESOS DE FONDO: semillas y sincronización, sin bloquear la interfaz
      void sincronizarEnFondo(sesion.token, () => setSinConexion(true));
    } catch {
      setSinConexion(true);
    } finally {
      setCargando(false);
    }
  }, [router, termino]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la carga inicial es asíncrona y no depende de un evento de usuario
    void cargar();
  }, [cargar]);

  const crear = useCallback(
    async (nombre: string) => {
      try {
        await crearMazo(nombre);
        setError(null);
        await cargar();
      } catch (fallo) {
        setError(fallo instanceof Error ? fallo.message : 'No se pudo crear el mazo');
      }
    },
    [cargar],
  );

  return { mazos, termino, setTermino, error, sinConexion, crear, cargando };
}

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
