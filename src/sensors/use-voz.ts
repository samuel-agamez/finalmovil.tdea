import * as Speech from 'expo-speech';
import { useCallback, useEffect, useState } from 'react';

async function hayVozDisponible(): Promise<boolean> {
  try {
    const voces = await Speech.getAvailableVoicesAsync();
    return voces.length > 0;
  } catch {
    return false;
  }
}

export function useVoz() {
  const [disponible, setDisponible] = useState<boolean | null>(null);
  const [leyendo, setLeyendo] = useState(false);

  useEffect(() => {
    let vivo = true;
    void hayVozDisponible().then((ok) => {
      if (vivo) setDisponible(ok);
    });
    return () => {
      vivo = false;
      void Speech.stop();
    };
  }, []);

  const leer = useCallback(async (texto: string) => {
    if (texto.trim() === '') return;
    if (!(await hayVozDisponible())) return;
    setLeyendo(true);
    Speech.speak(texto, {
      language: 'es-ES',
      onDone: () => setLeyendo(false),
      onStopped: () => setLeyendo(false),
      onError: () => setLeyendo(false),
    });
  }, []);

  const detener = useCallback(() => {
    void Speech.stop();
    setLeyendo(false);
  }, []);

  return { disponible, leyendo, leer, detener };
}
