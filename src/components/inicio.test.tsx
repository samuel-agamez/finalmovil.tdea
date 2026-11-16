import { renderRouter, screen } from 'expo-router/testing-library';

describe('ruta de inicio', () => {
  it('muestra el título de la app en la ruta raíz', async () => {
    await renderRouter();

    expect(await screen.findByText('Tarjetas de estudio')).toBeTruthy();
  }, 30000);
});
