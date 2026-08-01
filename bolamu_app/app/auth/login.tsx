import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/auth';
import { AppInput, AppButton, BrandLogo } from '../../src/components/ui';
import { AuthLayout } from '../../src/components/AuthLayout';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Erreur', 'Veuillez remplir tous les champs'); return; }
    setLoading(true);
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (role === 'DRIVER') {
        router.replace('/driver/missions' as any);
      } else {
        await logout();
        Alert.alert('Accès refusé', 'Cette application est réservée aux livreurs.');
      }
    } catch (err: any) {
      Alert.alert('Erreur de connexion', err?.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Connexion">
      <Animated.View entering={FadeInDown.duration(350)}>
        {/* Identité */}
        <View className="items-center mb-8">
          <BrandLogo size={64} />
          <Text className="text-[22px] font-extrabold text-ink mt-4 tracking-tight">Bon retour</Text>
          <Text className="text-ink-muted text-sm mt-1.5">Connectez-vous pour voir vos missions</Text>
        </View>

        {/* Champs */}
        <View className="mb-6">
          <AppInput
            label="Email" value={email} onChangeText={setEmail} placeholder="votre@email.com"
            keyboardType="email-address" autoCapitalize="none" icon={Mail} returnKeyType="next"
          />
          <AppInput
            label="Mot de passe" value={password} onChangeText={setPassword} placeholder="Votre mot de passe"
            secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} icon={Lock}
            suffix={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} className="ml-2">
                {showPassword
                  ? <EyeOff size={19} color="#94A3B8" strokeWidth={2} />
                  : <Eye size={19} color="#94A3B8" strokeWidth={2} />}
              </Pressable>
            }
            returnKeyType="go" onSubmitEditing={handleLogin}
          />
        </View>

        <Pressable onPress={() => router.push('/auth/forgot-password')} className="self-end mb-6">
          <Text className="text-brand-700 text-[13px] font-semibold">Mot de passe oublié ?</Text>
        </Pressable>

        <AppButton title="Se connecter" onPress={handleLogin} loading={loading} icon={LogIn} size="lg" />
      </Animated.View>
    </AuthLayout>
  );
}
