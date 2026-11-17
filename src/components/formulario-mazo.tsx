import { useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

export type PropsFormularioMazo = {
  onCrear: (nombre: string) => void;
  ocupado?: boolean;
};

export function FormularioMazo({ onCrear, ocupado = false }: PropsFormularioMazo) {
  const [nombre, setNombre] = useState('');

  return (
    <View style={styles.formulario}>
      <TextInput
        style={styles.campo}
        accessibilityLabel="Nombre del mazo"
        placeholder="Nombre del mazo"
        value={nombre}
        onChangeText={setNombre}
      />
      <Button
        title="Crear mazo"
        accessibilityLabel="Crear mazo"
        disabled={ocupado}
        onPress={() => onCrear(nombre)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formulario: {
    gap: 8,
    marginVertical: 12,
  },
  campo: {
    borderWidth: 1,
    borderColor: '#999999',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
});
