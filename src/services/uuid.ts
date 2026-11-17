const PATRON_UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

/** Genera un UUID versión 4 para usar como identificador remoto. */
export function generarUuid(): string {
  return PATRON_UUID.replace(/[xy]/g, (caracter) => {
    const aleatorio = Math.floor(Math.random() * 16);
    const valor = caracter === 'x' ? aleatorio : (aleatorio & 0x3) | 0x8;
    return valor.toString(16);
  });
}
