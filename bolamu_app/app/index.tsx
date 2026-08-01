import { View, Text, Pressable } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/auth';
import { BrandLogo } from '../src/components/ui';

export default function HomeScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // L'app est réservée aux livreurs : tout autre rôle connecté est déconnecté.
  useEffect(() => {
    if (isAuthenticated && user && user.role !== 'DRIVER') {
      logout();
    }
  }, [isAuthenticated, user, logout]);

  if (isAuthenticated && user?.role === 'DRIVER') {
    return <Redirect href="/driver/missions" />;
  }

  return (
    <View className="flex-1 bg-green-600">
      {/* Décor : cercles translucides */}
      <View className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5" />
      <View className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/5" />

      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center mb-12">
            <BrandLogo size={104} />
            <Text className="text-white text-4xl font-extrabold tracking-tight mt-7">Bolamu Livreur</Text>
            <Text className="text-green-100 text-base mt-2 text-center leading-relaxed">
              Livrez les commandes de pharmacie{'\n'}en toute confiance
            </Text>
          </View>

          <View className="w-full space-y-4">
            <Pressable
              onPress={() => router.push('/auth/login')}
              className="bg-white py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-black/10 active:opacity-90"
            >
              <Ionicons name="log-in-outline" size={20} color="#16A34A" />
              <Text className="text-green-700 font-bold text-lg">Se connecter</Text>
            </Pressable>
          </View>

          <View className="flex-row items-center gap-1.5 mt-12">
            <Ionicons name="shield-checkmark-outline" size={14} color="#BBF7D0" />
            <Text className="text-green-200 text-xs">Accès réservé aux livreurs Bolamu</Text>
          </View>
          <Text className="text-green-200 text-xs mt-4">Version 1.0.0 — © 2026 Bolamu</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
