import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { registro } from '../api/auth';
import { FalloApi } from '../api/errores';
import { guardarSesion } from '../api/sesion';
import { Registro } from './registro';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('../api/auth', () => ({ registro: jest.fn() }));
jest.mock('../api/sesion', () => ({ guardarSesion: jest.fn() }));

const reemplazar = jest.fn();
const empujar = jest.fn();
const routerFalso = { replace: reemplazar, push: empujar } as unknown as ReturnType<
  typeof useRouter
>;
const useRouterMock = jest.mocked(useRouter);
const registroMock = jest.mocked(registro);
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

describe('pantalla de registro', () => {
  beforeEach(() => {
    reemplazar.mockReset();
    empujar.mockReset();
    useRouterMock.mockReturnValue(routerFalso);
    registroMock.mockReset();
    guardarMock.mockReset();
    guardarMock.mockResolvedValue();
  });

  it('muestra el formulario de registro', async () => {
    await render(<Registro />);

    expect(screen.getByLabelText('Correo')).toBeTruthy();
    expect(screen.getByLabelText('Contraseña')).toBeTruthy();
    expect(screen.getByText('Registrarme')).toBeTruthy();
    expect(screen.getByText('Ya tengo cuenta')).toBeTruthy();
  });

  it('no envía nada si faltan los campos', async () => {
    await render(<Registro />);

    await pulsar('Registrarme');

    expect(await screen.findByText('Escribe tu correo y tu contraseña')).toBeTruthy();
    expect(registroMock).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña más corta de 8 caracteres', async () => {
    await render(<Registro />);

    await escribir('Correo', 'ana@correo.co');
    await escribir('Contraseña', 'corta');
    await pulsar('Registrarme');

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy();
    expect(registroMock).not.toHaveBeenCalled();
  });

  it('registrarse guarda la sesión y lleva al inicio', async () => {
    registroMock.mockResolvedValue(SESION);
    await render(<Registro />);

    await escribir('Correo', 'ana@correo.co');
    await escribir('Contraseña', 'secreta12');
    await pulsar('Registrarme');

    await waitFor(() => expect(reemplazar).toHaveBeenCalledWith('/'));
    expect(registroMock).toHaveBeenCalledWith('ana@correo.co', 'secreta12');
    expect(guardarMock).toHaveBeenCalledWith(SESION);
  });

  it('muestra el error que devuelve la API', async () => {
    registroMock.mockRejectedValue(new FalloApi(409, 'Ese correo ya está registrado'));
    await render(<Registro />);

    await escribir('Correo', 'ana@correo.co');
    await escribir('Contraseña', 'secreta12');
    await pulsar('Registrarme');

    expect(await screen.findByText('Ese correo ya está registrado')).toBeTruthy();
    expect(guardarMock).not.toHaveBeenCalled();
    expect(reemplazar).not.toHaveBeenCalled();
  });

  it('ya tengo cuenta lleva a la pantalla de login', async () => {
    await render(<Registro />);

    await pulsar('Ya tengo cuenta');

    expect(empujar).toHaveBeenCalledWith('/login');
  });
});
