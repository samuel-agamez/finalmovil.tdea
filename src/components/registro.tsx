import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { registro } from '../api/auth';
import { guardarSesion } from '../api/sesion';
import { COLORS, RADIUS, SPACING } from '../theme';

function useRegistro() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(): Promise<void> {
    if (enviando) return;
    if (correo.trim() === '' || clave === '') {
      setError('Escribe tu correo y tu contraseña');
      return;
    }
    if (clave.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const sesion = await registro(correo, clave);
      await guardarSesion(sesion);
      router.replace('/');
    } catch (fallo) {
      setError(mensajeDe(fallo));
      setEnviando(false);
    }
  }

  return { correo, clave, error, enviando, setCorreo, setClave, enviar };
}

type PropsCampos = {
  correo: string;
  clave: string;
  setCorreo: (valor: string) => void;
  setClave: (valor: string) => void;
};

function CamposCredenciales({ correo, clave, setCorreo, setClave }: PropsCampos) {
  return (
    <>
      <Text style={styles.etiqueta}>Correo</Text>
      <TextInput
        style={styles.campo}
        accessibilityLabel="Correo"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="correo@ejemplo.com"
        placeholderTextColor={COLORS.textMuted}
        value={correo}
        onChangeText={setCorreo}
      />
      <Text style={styles.etiqueta}>Contraseña</Text>
      <TextInput
        style={styles.campo}
        accessibilityLabel="Contraseña"
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
        placeholderTextColor={COLORS.textMuted}
        value={clave}
        onChangeText={setClave}
      />
    </>
  );
}

export function Registro() {
  const { correo, clave, error, enviando, setCorreo, setClave, enviar } = useRegistro();
  const router = useRouter();

  return (
    <View style={styles.contenedor}>
      <View style={styles.tarjeta}>
        <Text style={styles.marca}>NUEVA CUENTA</Text>
        <Text style={styles.titulo}>Crear cuenta</Text>
        <Text style={styles.subtitulo}>Empieza a organizar tus repasos en un minuto</Text>

        <CamposCredenciales
          correo={correo}
          clave={clave}
          setCorreo={setCorreo}
          setClave={setClave}
        />

        {error !== null && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.boton, enviando && styles.botonOcupado]}
          accessibilityRole="button"
          accessibilityLabel="Registrarme"
          disabled={enviando}
          onPress={() => void enviar()}
        >
          <Text style={styles.botonTexto}>{enviando ? 'Creando cuenta...' : 'Registrarme'}</Text>
        </Pressable>

        <Pressable
          style={styles.enlace}
          accessibilityRole="button"
          accessibilityLabel="Ya tengo cuenta"
          disabled={enviando}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.enlaceTexto}>¿Ya tienes cuenta? Iniciar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

function mensajeDe(fallo: unknown): string {
  return fallo instanceof Error ? fallo.message : 'No se pudo conectar con el servidor';
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
    backgroundColor: COLORS.background,
  },
  tarjeta: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.l,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 4,
    borderTopColor: COLORS.secondary,
    padding: SPACING.l,
    gap: SPACING.s,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  marca: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textMain,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMain,
    marginLeft: SPACING.xs,
  },
  campo: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.m,
    padding: SPACING.m,
    fontSize: 16,
    color: COLORS.textMain,
  },
  error: {
    color: COLORS.danger,
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: SPACING.xs,
  },
  boton: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.m,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  botonOcupado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  enlace: {
    alignItems: 'center',
    padding: SPACING.s,
  },
  enlaceTexto: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
