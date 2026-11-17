export const MAX_CARACTERES = 300;

export function validarTextoTarjeta(pregunta: string, respuesta: string): string[] {
  const errores: string[] = [];
  const errorPregunta = validarCampo('pregunta', 'La pregunta', pregunta);
  if (errorPregunta !== null) errores.push(errorPregunta);
  const errorRespuesta = validarCampo('respuesta', 'La respuesta', respuesta);
  if (errorRespuesta !== null) errores.push(errorRespuesta);
  return errores;
}

function validarCampo(campo: string, etiqueta: string, valor: string): string | null {
  const texto = valor.trim();
  if (texto === '') {
    return `${etiqueta} es obligatoria`;
  }
  if (texto.length > MAX_CARACTERES) {
    return `La ${campo} debe tener máximo ${MAX_CARACTERES} caracteres`;
  }
  return null;
}

export function validarNombreMazo(nombre: string): string | null {
  if (nombre.trim() === '') {
    return 'El nombre del mazo es obligatorio';
  }
  return null;
}
