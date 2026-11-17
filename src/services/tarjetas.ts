import { abrirDb } from '../db/db';
import {
  borrarTarjeta as borrar,
  crearTarjeta as crear,
  listarPorMazo as listar,
  vencidasDelMazo as vencidas,
} from '../repositories/tarjetas';
import type { NuevaTarjeta, Tarjeta } from '../repositories/tipos';
import { ahoraIso } from './fechas';
import { validarTextoTarjeta } from './validaciones';

export async function listarTarjetas(mazoId: number): Promise<Tarjeta[]> {
  const db = await abrirDb();
  return await listar(db, mazoId);
}

export async function crearTarjeta(datos: NuevaTarjeta): Promise<number> {
  const errores = validarTextoTarjeta(datos.pregunta, datos.respuesta);
  if (errores.length > 0) {
    throw new Error(errores[0] ?? 'Datos inválidos');
  }
  const db = await abrirDb();
  return await crear(db, {
    mazo_id: datos.mazo_id,
    pregunta: datos.pregunta.trim(),
    respuesta: datos.respuesta.trim(),
  });
}

export async function borrarTarjeta(id: number): Promise<void> {
  const db = await abrirDb();
  await borrar(db, id);
}

export async function tarjetasVencidas(mazoId: number): Promise<Tarjeta[]> {
  const db = await abrirDb();
  return await vencidas(db, mazoId, ahoraIso());
}
