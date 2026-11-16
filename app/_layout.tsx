import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Raiz() {
  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Acceso' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
