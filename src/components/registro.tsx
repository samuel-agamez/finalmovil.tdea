import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { registro } from '../api/auth';
import { guardarSesion } from '../api/sesion';

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

export function Registro() {
  const { correo, clave, error, enviando, setCorreo, setClave, enviar } = useRegistro();
  const router = useRouter();

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Crear cuenta</Text>
      <TextInput
        style={styles.campo}
        accessibilityLabel="Correo"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        placeholder="correo@ejemplo.com"
        value={correo}
        onChangeText={setCorreo}
      />
      <TextInput
        style={styles.campo}
        accessibilityLabel="Contraseña"
        secureTextEntry
        placeholder="Mínimo 8 caracteres"
        value={clave}
        onChangeText={setClave}
      />
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <Button
        title="Registrarme"
        accessibilityLabel="Registrarme"
        disabled={enviando}
        onPress={() => void enviar()}
      />
      <Button
        title="Ya tengo cuenta"
        accessibilityLabel="Ya tengo cuenta"
        disabled={enviando}
        onPress={() => router.push('/login')}
      />
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
    padding: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  campo: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  error: {
    color: '#b00020',
    textAlign: 'center',
  },
});
