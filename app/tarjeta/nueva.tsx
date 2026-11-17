import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormularioTarjeta } from '../../src/components/formulario-tarjeta';
import { crearTarjeta } from '../../src/services/tarjetas';

export default function NuevaTarjeta() {
  const router = useRouter();
  const { mazoId } = useLocalSearchParams<{ mazoId: string }>();
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function guardar(pregunta: string, respuesta: string): Promise<void> {
    setOcupado(true);
    try {
      await crearTarjeta({ mazo_id: Number(mazoId), pregunta, respuesta });
      setError(null);
      router.back();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo guardar la tarjeta');
      setOcupado(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>Nueva tarjeta</Text>
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <FormularioTarjeta
        ocupado={ocupado}
        onGuardar={(pregunta, respuesta) => void guardar(pregunta, respuesta)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  error: {
    color: '#b00020',
  },
});
