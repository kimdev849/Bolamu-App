import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';

export default function DriverLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Garde : accès réservé aux livreurs connectés
  if (!isAuthenticated || user?.role !== 'DRIVER') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="mission/[id]" />
    </Stack>
  );
}
