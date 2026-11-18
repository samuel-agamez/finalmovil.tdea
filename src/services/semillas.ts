import { abrirDb, type Db } from '../db/db';
import { crearMazo } from '../repositories/mazos';
import { crearTarjeta } from '../repositories/tarjetas';

type TarjetaSemilla = { p: string; r: string };
type MateriaSemilla = { nombre: string; tarjetas: TarjetaSemilla[] };

const COLECCION: MateriaSemilla[] = [
  {
    nombre: 'Inglés Avanzado',
    tarjetas: [
      { p: 'Ubiquitous', r: 'Presente en todas partes al mismo tiempo.' },
      { p: 'Ephemeral', r: 'Que dura muy poco tiempo; fugaz.' },
      { p: 'Serendipity', r: 'Halle algo valioso por accidente.' },
      { p: 'Loquacious', r: 'Que habla mucho o es muy hablador.' },
      { p: 'Resilient', r: 'Capacidad de adaptarse o recuperarse rápido.' },
    ],
  },
  {
    nombre: 'Programación TS',
    tarjetas: [
      {
        p: 'Generics',
        r: 'Permiten crear componentes reutilizables que funcionan con varios tipos.',
      },
      { p: 'Interface', r: 'Define la estructura de un objeto en TypeScript.' },
      { p: 'useEffect', r: 'Hook de React para manejar efectos secundarios (API, timers).' },
      {
        p: 'Union Types',
        r: 'Permite que una variable sea de uno de varios tipos (ej. string | number).',
      },
      { p: 'Zod', r: 'Librería de declaración y validación de esquemas de TypeScript.' },
    ],
  },
  {
    nombre: 'Biología Celular',
    tarjetas: [
      { p: 'Mitocondria', r: 'Organelo encargado de producir la energía (ATP) de la célula.' },
      { p: 'Ribosoma', r: 'Encargado de la síntesis de proteínas.' },
      {
        p: 'Mitosis',
        r: 'Proceso de división celular que resulta en dos células hijas idénticas.',
      },
      { p: 'Transcripción', r: 'Proceso de copiar ADN en ARN mensajero.' },
      { p: 'Lisosoma', r: 'Organelo que contiene enzimas digestivas para degradar material.' },
    ],
  },
];

/** Carga la colección de ejemplo solo si la base de datos está vacía. */
export async function cargarDatosPrueba(): Promise<boolean> {
  const db = await abrirDb();
  const existente = await db.getFirstAsync<{ id: number }>('SELECT id FROM mazo LIMIT 1');
  if (existente !== null) return false;
  for (const materia of COLECCION) {
    await crearMateria(db, materia);
  }
  return true;
}

async function crearMateria(db: Db, materia: MateriaSemilla): Promise<void> {
  const mazoId = await crearMazo(db, materia.nombre);
  for (const tarjeta of materia.tarjetas) {
    await crearTarjeta(db, {
      mazo_id: mazoId,
      pregunta: tarjeta.p,
      respuesta: tarjeta.r,
    });
  }
}
