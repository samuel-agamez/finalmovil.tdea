import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { MAX_CARACTERES, validarTextoTarjeta } from '../services/validaciones';

export type PropsFormularioTarjeta = {
  onGuardar: (pregunta: string, respuesta: string) => void;
  ocupado?: boolean;
};

export function FormularioTarjeta({ onGuardar, ocupado = false }: PropsFormularioTarjeta) {
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState<string | null>(null);

  function guardar(): void {
    const errores = validarTextoTarjeta(pregunta, respuesta);
    if (errores.length > 0) {
      setError(errores[0] ?? 'Revisa los datos');
      return;
    }
    setError(null);
    onGuardar(pregunta.trim(), respuesta.trim());
  }

  return (
    <View style={styles.formulario}>
      <TextInput
        style={styles.campo}
        accessibilityLabel="Pregunta"
        placeholder="Pregunta"
        value={pregunta}
        onChangeText={setPregunta}
        multiline
      />
      <Text style={styles.contador}>
        {pregunta.length}/{MAX_CARACTERES}
      </Text>
      <TextInput
        style={styles.campo}
        accessibilityLabel="Respuesta"
        placeholder="Respuesta"
        value={respuesta}
        onChangeText={setRespuesta}
        multiline
      />
      <Text style={styles.contador}>
        {respuesta.length}/{MAX_CARACTERES}
      </Text>
      {error !== null && <Text style={styles.error}>{error}</Text>}
      <Button
        title="Guardar tarjeta"
        accessibilityLabel="Guardar tarjeta"
        disabled={ocupado}
        onPress={guardar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: 8,
  },
  campo: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  contador: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'right',
  },
  error: {
    color: '#b00020',
  },
});
