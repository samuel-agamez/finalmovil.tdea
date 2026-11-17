import { DeviceMotion, type DeviceMotionMeasurement } from 'expo-sensors';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Inclinacion = {
  roll: number;
  pitch: number;
  aLaDerecha: boolean;
};

const INTERVALO_MS = 100;

function calcular(datos: DeviceMotionMeasurement): Inclinacion {
  const roll = datos.rotation.gamma;
  return { roll, pitch: datos.rotation.beta, aLaDerecha: roll > 0 };
}

export function useInclinacion() {
  const [disponible, setDisponible] = useState(false);
  const [inclinacion, setInclinacion] = useState<Inclinacion | null>(null);
  const suscripcionRef = useRef<{ remove: () => void } | null>(null);

  const desactivar = useCallback(() => {
    suscripcionRef.current?.remove();
    suscripcionRef.current = null;
    setInclinacion(null);
  }, []);

  const activar = useCallback(async (): Promise<boolean> => {
    if (suscripcionRef.current !== null) return true;
    try {
      const haySensor = await DeviceMotion.isAvailableAsync();
      if (!haySensor) {
        setDisponible(false);
        return false;
      }
      const permiso = await DeviceMotion.requestPermissionsAsync();
      if (!permiso.granted) {
        setDisponible(false);
        return false;
      }
      setDisponible(true);
      DeviceMotion.setUpdateInterval(INTERVALO_MS);
      suscripcionRef.current = DeviceMotion.addListener((datos: DeviceMotionMeasurement) => {
        setInclinacion(calcular(datos));
      });
      return true;
    } catch {
      setDisponible(false);
      return false;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        setDisponible(await DeviceMotion.isAvailableAsync());
      } catch {
        setDisponible(false);
      }
    })();
  }, []);

  useEffect(() => desactivar, [desactivar]);

  return { disponible, inclinacion, activar, desactivar };
}
