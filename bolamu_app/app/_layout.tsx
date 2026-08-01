import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LottieView from 'lottie-react-native';
import { useAuthStore } from '../src/store/auth';
import { BrandLogo } from '../src/components/ui';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 1000 * 60, refetchOnWindowFocus: false } },
});

/** Splash signature : logo blanc + spinner Lottie sur fond vert profond */
function Splash() {
  return (
    <View className="flex-1 items-center justify-center bg-brand-800">
      <View className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-white/5" />
      <View className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-white/5" />
      <View className="items-center">
        <View className="rounded-[30px] bg-white p-3" style={{ shadowColor: '#052E16', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 }}>
          <BrandLogo size={84} />
        </View>
        <Text className="text-white text-2xl font-extrabold tracking-tight mt-6">Bolamu Livreur</Text>
        <Text className="text-brand-200 text-[13px] mt-1">Livraison de pharmacie, simplifiée</Text>
        <View className="mt-8">
          <LottieView source={require('../assets/animations/spinner.json')} autoPlay loop style={{ width: 72, height: 72 }} />
        </View>
      </View>
    </View>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  useEffect(() => { loadStoredAuth(); }, []);
  if (isLoading) return <Splash />;
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
