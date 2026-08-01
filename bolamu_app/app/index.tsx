import { View, Text, Pressable } from 'react-native';
import { router, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '../src/store/auth';
import { BrandLogo, OnlinePill } from '../src/components/ui';
import { SkiaBackdrop } from '../src/components/SkiaBackdrop';
import { BRAND } from '../src/theme';

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
    <LinearGradient colors={['#14532D', '#15803D', '#16A34A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} className="flex-1">
      <SkiaBackdrop />

      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7">
          {/* Marque */}
          <Animated.View entering={FadeIn.duration(500)} className="flex-row items-center justify-between mt-4">
            <View className="flex-row items-center gap-2.5">
              <BrandLogo size={44} />
              <Text className="text-white text-lg font-extrabold tracking-tight">Bolamu</Text>
            </View>
            <OnlinePill online label="Livreur" />
          </Animated.View>

          {/* Héros */}
          <View className="flex-1 justify-center">
            <Animated.View entering={FadeInDown.duration(500).delay(100)} className="items-start">
              <View className="flex-row items-center gap-2 bg-white/10 rounded-full px-3.5 py-1.5 border border-white/15 mb-5">
                <ShieldCheck size={13} color="#BBF7D0" />
                <Text className="text-brand-100 text-[11px] font-bold uppercase tracking-wider">Plateforme de livraison santé</Text>
              </View>
              <Text className="text-white text-[40px] font-extrabold leading-[46px] tracking-tight">
                Livrez.{'\n'}En confiance.
              </Text>
              <Text className="text-brand-100 text-[15px] leading-relaxed mt-4 max-w-[300px]">
                Gérez vos missions de livraison de pharmacie, simplement.
              </Text>
            </Animated.View>
          </View>

          {/* CTA */}
          <Animated.View entering={FadeInDown.duration(500).delay(500)} className="pb-7">
            <Pressable
              onPress={() => router.push('/auth/login')}
              className="bg-white py-[18px] rounded-2xl items-center flex-row justify-center gap-2"
              style={{ shadowColor: '#052E16', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 8 }}
            >
              <LogIn size={19} color={BRAND.greenDark} strokeWidth={2.4} />
              <Text className="text-brand-700 font-bold text-[16px]">Se connecter</Text>
              <ArrowRight size={17} color={BRAND.greenDark} strokeWidth={2.4} />
            </Pressable>
            <Text className="text-brand-200 text-[11px] text-center mt-5">© 2026 Bolamu · Version 1.0</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
