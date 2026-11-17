import { Button, FlatList, StyleSheet, Text, View } from 'react-native';
import type { Tarjeta } from '../repositories/tipos';

export type PropsListaTarjetas = {
  tarjetas: Tarjeta[];
  onBorrar: (id: number) => void;
};

export function ListaTarjetas({ tarjetas, onBorrar }: PropsListaTarjetas) {
  return (
    <FlatList
      data={tarjetas}
      keyExtractor={(tarjeta) => String(tarjeta.id)}
      renderItem={({ item }) => (
        <View style={styles.fila}>
          <Text style={styles.pregunta}>{item.pregunta}</Text>
          <Text style={styles.respuesta}>{item.respuesta}</Text>
          <Text style={styles.caja}>Caja {item.caja}</Text>
          <Button
            title="Borrar"
            accessibilityLabel={`Borrar tarjeta ${item.pregunta}`}
            onPress={() => onBorrar(item.id)}
          />
        </View>
      )}
      ListEmptyComponent={<Text style={styles.vacio}>Este mazo aún no tiene tarjetas</Text>}
    />
  );
}

const styles = StyleSheet.create({
  fila: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    gap: 4,
  },
  pregunta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  respuesta: {
    fontSize: 15,
    color: '#333333',
  },
  caja: {
    fontSize: 12,
    color: '#666666',
  },
  vacio: {
    textAlign: 'center',
    color: '#555555',
    marginTop: 24,
  },
});
