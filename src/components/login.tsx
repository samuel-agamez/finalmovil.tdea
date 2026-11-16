import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { login, registro } from '../api/auth';
import { guardarSesion } from '../api/sesion';

function useAcceso() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(esRegistro: boolean): Promise<void> {
    if (enviando) return;
    if (correo.trim() === '' || clave === '') {
      setError('Escribe tu correo y tu contraseña');
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      const sesion = esRegistro ? await registro(correo, clave) : await login(correo, clave);
      await guardarSesion(sesion);
      router.replace('/');
    } catch (fallo) {
      setError(mensajeDe(fallo));
      setEnviando(false);
    }
  }

  return { correo, clave, error, enviando, setCorreo, setClave, enviar };
}

export function Login() {
  const { correo, clave, error, enviando, setCorreo, setClave, enviar } = useAcceso();

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Iniciar sesión</Text>
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
        placeholder="Tu contraseña"
        value={clave}
        onChangeText={setClave}
      />
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <Button
        title="Entrar"
        accessibilityLabel="Entrar"
        disabled={enviando}
        onPress={() => void enviar(false)}
      />
      <Button
        title="Crear cuenta"
        accessibilityLabel="Crear cuenta"
        disabled={enviando}
        onPress={() => void enviar(true)}
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
