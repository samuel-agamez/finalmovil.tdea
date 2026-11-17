import { Tabs } from 'expo-router';

export default function Pestanas() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Mazos' }} />
    </Tabs>
  );
}
