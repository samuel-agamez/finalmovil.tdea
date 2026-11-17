import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { ListaTarjetas } from '../../src/components/lista-tarjetas';
import type { Mazo as MazoTipo, Tarjeta } from '../../src/repositories/tipos';
import { borrarMazo, contarTarjetas, obtenerMazo } from '../../src/services/mazos';
import { borrarTarjeta, listarTarjetas } from '../../src/services/tarjetas';

function useMazo(mazoId: number) {
  const [mazo, setMazo] = useState<MazoTipo | null>(null);
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);

  const cargar = useCallback(async () => {
    setMazo(await obtenerMazo(mazoId));
    setTarjetas(await listarTarjetas(mazoId));
  }, [mazoId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la carga inicial es asíncrona y no depende de un evento de usuario
    void cargar();
  }, [cargar]);

  return { mazo, tarjetas, cargar };
}

function confirmarBorrarMazo(mazoId: number, nombre: string, alBorrar: () => void): void {
  void (async () => {
    const total = await contarTarjetas(mazoId);
    Alert.alert(
      'Eliminar mazo',
      `Se eliminarán ${total} tarjetas y el mazo «${nombre}». ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await borrarMazo(mazoId);
              alBorrar();
            })();
          },
        },
      ],
    );
  })();
}

function confirmarBorrarTarjeta(tarjetaId: number, alBorrar: () => void): void {
  Alert.alert('Eliminar tarjeta', '¿Eliminar esta tarjeta?', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Eliminar',
      style: 'destructive',
      onPress: () => {
        void (async () => {
          await borrarTarjeta(tarjetaId);
          await alBorrar();
        })();
      },
    },
  ]);
}

export default function Mazo() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mazoId = Number(id);
  const { mazo, tarjetas, cargar } = useMazo(mazoId);

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>{mazo?.nombre ?? 'Mazo'}</Text>
      <View style={styles.acciones}>
        <Button
          title="Añadir tarjeta"
          accessibilityLabel="Añadir tarjeta"
          onPress={() => router.push(`/tarjeta/nueva?mazoId=${mazoId}`)}
        />
        <Button
          title="Estudiar"
          accessibilityLabel="Estudiar"
          onPress={() => router.push(`/estudio/${mazoId}`)}
        />
        <Button
          title="Eliminar mazo"
          accessibilityLabel="Eliminar mazo"
          color="#b00020"
          onPress={() => confirmarBorrarMazo(mazoId, mazo?.nombre ?? '', () => router.replace('/'))}
        />
      </View>
      <ListaTarjetas
        tarjetas={tarjetas}
        onBorrar={(tarjetaId) => confirmarBorrarTarjeta(tarjetaId, cargar)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    padding: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  acciones: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginVertical: 12,
  },
});
