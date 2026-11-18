import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { cargarSesion, ejecutarConSesion } from '../api/sesion';
import type { MazoConProgreso } from '../repositories/tipos';
import { buscarMazos, crearMazo, listarMazos } from '../services/mazos';
import { cargarDatosPrueba } from '../services/semillas';
import { sincronizar } from '../services/sincronizacion';

/**
 * Estado de la pantalla de mazos.
 *
 * El buscador solo consulta SQLite; la sincronización corre una vez al abrir
 * la pantalla y, si trae cambios, vuelve a leer la lista local.
 */
export function useMazos() {
  const router = useRouter();
  const [mazos, setMazos] = useState<MazoConProgreso[]>([]);
  const [termino, setTermino] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const lista = termino.trim() === '' ? await listarMazos() : await buscarMazos(termino);
      if (!vivo) return;
      setMazos(lista);
      setCargando(false);
    })();
    return () => {
      vivo = false;
    };
  }, [termino, version]);

  useEffect(() => {
    void (async () => {
      try {
        const sesion = await cargarSesion();
        if (sesion === null) {
          router.replace('/login');
          return;
        }
        if (await cargarDatosPrueba()) setVersion((valor) => valor + 1);
        const cambios = await ejecutarConSesion((token) => sincronizar(token));
        setSinConexion(false);
        if (cambios > 0) setVersion((valor) => valor + 1);
      } catch {
        setSinConexion(true);
      }
    })();
  }, [router]);

  const crear = useCallback(async (nombre: string) => {
    try {
      await crearMazo(nombre);
      setError(null);
      setVersion((valor) => valor + 1);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No se pudo crear el mazo');
    }
  }, []);

  return { mazos, termino, setTermino, error, sinConexion, crear, cargando };
}
