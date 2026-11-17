import { FlatList, StyleSheet, Text } from 'react-native';
import type { MazoConProgreso } from '../repositories/tipos';
import { MazoFila } from './mazo-fila';

export type PropsListaMazos = {
  mazos: MazoConProgreso[];
  error: string | null;
  sinConexion: boolean;
  onAbrir: (id: number) => void;
  onEstudiar: (id: number) => void;
};

export function ListaMazos({ mazos, error, sinConexion, onAbrir, onEstudiar }: PropsListaMazos) {
  return (
    <>
      {error !== null && <Text style={styles.error}>{error}</Text>}
      {sinConexion && (
        <Text style={styles.aviso}>Sin conexión: se muestran solo los datos guardados.</Text>
      )}
      <FlatList
        data={mazos}
        keyExtractor={(mazo) => String(mazo.id)}
        renderItem={({ item }) => (
          <MazoFila mazo={item} onAbrir={onAbrir} onEstudiar={onEstudiar} />
        )}
        ListEmptyComponent={<Text style={styles.vacio}>Todavía no tienes mazos</Text>}
      />
    </>
  );
}

const styles = StyleSheet.create({
  error: {
    color: '#b00020',
    marginBottom: 8,
  },
  aviso: {
    color: '#8a6d00',
    marginBottom: 8,
  },
  vacio: {
    color: '#555555',
    textAlign: 'center',
    marginTop: 24,
  },
});
