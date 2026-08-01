import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../src/store/auth';
import { BrandLogo } from '../src/components/ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60, refetchOnWindowFocus: false } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  useEffect(() => { loadStoredAuth(); }, []);
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-green-600">
        <BrandLogo size={96} />
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 28 }} />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="driver" />
          </Stack>
        </AuthGate>
        <StatusBar style="light" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
