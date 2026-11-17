import type { Db } from '../db/db';
import { abrirDb } from '../db/db';
import { actualizarTarjeta, obtenerTarjeta } from '../repositories/tarjetas';
import { diasHastaRevision, siguienteCaja, type ResultadoRepaso } from './leitner';
import { sumarDias } from './fechas';

export async function registrarResultado(
  tarjetaId: number,
  resultado: ResultadoRepaso,
): Promise<void> {
  const db = await abrirDb();
  await registrarRepaso(db, tarjetaId, resultado);
}

export async function registrarRepaso(
  db: Db,
  tarjetaId: number,
  resultado: ResultadoRepaso,
  ahora = new Date().toISOString(),
): Promise<void> {
  const tarjeta = await obtenerTarjeta(db, tarjetaId);
  if (tarjeta === null) {
    throw new Error('La tarjeta no existe');
  }
  const caja = siguienteCaja(tarjeta.caja, resultado);
  const proxima_revision = sumarDias(ahora, diasHastaRevision(caja));
  await actualizarTarjeta(db, tarjetaId, { caja, proxima_revision });
}
