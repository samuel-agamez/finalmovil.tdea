import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  EstudioAlDia,
  EstudioCargando,
  EstudioTerminado,
} from '../../src/components/estados-estudio';
import { SesionEstudio } from '../../src/components/sesion-estudio';
import type { Tarjeta } from '../../src/repositories/tipos';
import { useInclinacion } from '../../src/sensors/use-inclinacion';
import { useVoz } from '../../src/sensors/use-voz';
import { registrarResultado } from '../../src/services/repaso';
import { tarjetasVencidas } from '../../src/services/tarjetas';

const UMBRAL_INCLINACION = 0.35;

function useRepaso(mazoId: number) {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [indice, setIndice] = useState(0);
  const [volteada, setVolteada] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      setTarjetas(await tarjetasVencidas(mazoId));
      setCargando(false);
    })();
  }, [mazoId]);

  const actual = tarjetas[indice];

  const responder = useCallback(
    async (resultado: 'acierto' | 'fallo'): Promise<void> => {
      if (actual === undefined) return;
      await registrarResultado(actual.id, resultado);
      if (resultado === 'acierto') {
        setAciertos((valor) => valor + 1);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setFallos((valor) => valor + 1);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setVolteada(false);
      setIndice((valor) => valor + 1);
    },
    [actual],
  );

  const repetir = useCallback(() => {
    setIndice(0);
    setAciertos(0);
    setFallos(0);
    setVolteada(false);
  }, []);

  return {
    cargando,
    tarjetas,
    actual,
    indice,
    volteada,
    aciertos,
    fallos,
    responder,
    repetir,
    voltear: () => setVolteada((valor) => !valor),
  };
}

function useManosLibres() {
  const { disponible, inclinacion, activar, desactivar } = useInclinacion();
  const [activo, setActivo] = useState(false);

  const alternar = useCallback(async () => {
    if (activo) {
      desactivar();
      setActivo(false);
      return;
    }
    setActivo(await activar());
  }, [activo, activar, desactivar]);

  return { disponible, inclinacion, activo, alternar, desactivar };
}

export default function Estudio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repaso = useRepaso(Number(id));
  const voz = useVoz();
  const manos = useManosLibres();
  const { activo, inclinacion } = manos;
  const { volteada, responder } = repaso;

  useEffect(() => {
    if (!activo || !volteada || inclinacion === null) return;
    if (inclinacion.roll >= UMBRAL_INCLINACION) void responder('acierto');
    else if (inclinacion.roll <= -UMBRAL_INCLINACION) void responder('fallo');
  }, [activo, inclinacion, responder, volteada]);

  if (repaso.cargando) return <EstudioCargando />;
  if (repaso.tarjetas.length === 0) return <EstudioAlDia />;
  if (repaso.actual === undefined) {
    return (
      <EstudioTerminado
        aciertos={repaso.aciertos}
        fallos={repaso.fallos}
        onRepetir={repaso.repetir}
      />
    );
  }

  return (
    <SesionEstudio
      pregunta={repaso.actual.pregunta}
      respuesta={repaso.actual.respuesta}
      volteada={repaso.volteada}
      posicion={repaso.indice + 1}
      total={repaso.tarjetas.length}
      puedeLeer={voz.disponible === true}
      puedeInclinar={manos.disponible}
      manosLibres={manos.activo}
      onVoltear={repaso.voltear}
      onAcierto={() => void repaso.responder('acierto')}
      onFallo={() => void repaso.responder('fallo')}
      onLeer={() => void voz.leer(repaso.actual?.pregunta ?? '')}
      onAlternarManosLibres={() => void manos.alternar()}
    />
  );
}
