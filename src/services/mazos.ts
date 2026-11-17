import { abrirDb } from '../db/db';
import {
  buscarMazos as buscar,
  borrarMazo as borrar,
  contarTarjetasActivas,
  crearMazo as crear,
  listarMazos as listar,
  obtenerMazo as obtener,
} from '../repositories/mazos';
import type { Mazo, MazoConProgreso } from '../repositories/tipos';
import { validarNombreMazo } from './validaciones';

export async function listarMazos(): Promise<MazoConProgreso[]> {
  const db = await abrirDb();
  return await listar(db);
}

export async function buscarMazos(termino: string): Promise<MazoConProgreso[]> {
  const db = await abrirDb();
  return await buscar(db, termino);
}

export async function obtenerMazo(id: number): Promise<Mazo | null> {
  const db = await abrirDb();
  return await obtener(db, id);
}

export async function crearMazo(nombre: string): Promise<number> {
  const error = validarNombreMazo(nombre);
  if (error !== null) {
    throw new Error(error);
  }
  const db = await abrirDb();
  return await crear(db, nombre.trim());
}

export async function borrarMazo(id: number): Promise<void> {
  const db = await abrirDb();
  await borrar(db, id);
}

export async function contarTarjetas(id: number): Promise<number> {
  const db = await abrirDb();
  return await contarTarjetasActivas(db, id);
}
