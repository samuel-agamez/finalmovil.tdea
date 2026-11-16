import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { login } from '../api/auth';
import { FalloApi } from '../api/errores';
import { guardarSesion } from '../api/sesion';
import { Login } from './login';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../api/auth', () => ({ login: jest.fn() }));
jest.mock('../api/sesion', () => ({ guardarSesion: jest.fn() }));

const reemplazar = jest.fn();
const empujar = jest.fn();
const routerFalso = { replace: reemplazar, push: empujar } as unknown as ReturnType<
  typeof useRouter
>;
const useRouterMock = jest.mocked(useRouter);
const loginMock = jest.mocked(login);
const guardarMock = jest.mocked(guardarSesion);

const SESION = {
  token: 'abc',
  refreshToken: 'r1',
  expiraEnSeg: 3600,
  usuario: { id: 'u1', email: 'ana@correo.co' },
};

async function escribir(etiqueta: string, valor: string) {
  await fireEvent.changeText(screen.getByLabelText(etiqueta), valor);
}

async function pulsar(texto: string) {
  await fireEvent.press(screen.getByText(texto));
}

describe('pantalla de login', () => {
  beforeEach(() => {
    reemplazar.mockReset();
    empujar.mockReset();
    useRouterMock.mockReturnValue(routerFalso);
    loginMock.mockReset();
    guardarMock.mockReset();
    guardarMock.mockResolvedValue();
  });

  it('muestra el formulario de acceso', async () => {
    await render(<Login />);

    expect(screen.getByLabelText('Correo')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.getByText('Entrar')).toBeTruthy();
    expect(screen.getByText('Crear cuenta')).toBeTruthy();
  });

  it('no envía nada si faltan los campos', async () => {
    await render(<Login />);

    await pulsar('Entrar');

    expect(await screen.findByText('Escribe tu correo y tu contraseña')).toBeTruthy();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('entrar guarda la sesión y lleva al inicio', async () => {
    loginMock.mockResolvedValue(SESION);
    await render(<Login />);

    await escribir('Correo', 'ana@correo.co');
    await escribir('Contraseña', 'secreta');
    await pulsar('Entrar');

    await waitFor(() => expect(reemplazar).toHaveBeenCalledWith('/'));
    expect(loginMock).toHaveBeenCalledWith('ana@correo.co', 'secreta');
    expect(guardarMock).toHaveBeenCalledWith(SESION);
  });

  it('muestra el error que devuelve la API', async () => {
    loginMock.mockRejectedValue(new FalloApi(401, 'Correo o contraseña incorrectos'));
    await render(<Login />);

    await escribir('Correo', 'ana@correo.co');
    await escribir('Contraseña', 'mala');
    await pulsar('Entrar');

    expect(await screen.findByText('Correo o contraseña incorrectos')).toBeTruthy();
    expect(guardarMock).not.toHaveBeenCalled();
    expect(reemplazar).not.toHaveBeenCalled();
  });

  it('crear cuenta abre la pantalla de registro', async () => {
    await render(<Login />);

    await pulsar('Crear cuenta');

    expect(empujar).toHaveBeenCalledWith('/registro');
    expect(loginMock).not.toHaveBeenCalled();
    expect(guardarMock).not.toHaveBeenCalled();
  });
});
