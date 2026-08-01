import { useState } from 'react';
import { View, Text, Pressable, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/auth';
import { InputField, PrimaryButton, BrandLogo } from '../../src/components/ui';

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
        // Application réservée aux livreurs
        await logout();
        Alert.alert('Accès refusé', 'Cette application est réservée aux livreurs.');
      }
    } catch (err: any) {
      Alert.alert('Erreur de connexion', err?.response?.data?.message || 'Email ou mot de passe incorrect');
    } finally { setLoading(false); }
  };

  return (
    <View className="flex-1 bg-green-600">
      {/* Décor : cercles translucides */}
      <View className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
      <View className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-white/5" />
      <View className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-white/5" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['top']} className="items-center pt-10 pb-6 px-8">
            <BrandLogo size={88} />
            <Text className="text-white text-3xl font-extrabold mt-5 tracking-tight">Bolamu Livreur</Text>
            <Text className="text-green-100 text-sm mt-2">Connectez-vous à votre espace</Text>
          </SafeAreaView>

          {/* Carte flottante — grand espacement autour */}
          <View className="px-6 pt-4 pb-6">
            <View className="bg-white rounded-[28px] p-7 shadow-2xl shadow-black/20">
              <View className="mb-7">
                <Text className="text-2xl font-extrabold text-gray-900">Bon retour</Text>
                <Text className="text-gray-400 text-sm mt-1">Renseignez vos identifiants pour continuer</Text>
              </View>

              <InputField
                label="Email" value={email} onChangeText={setEmail} placeholder="votre@email.com"
                keyboardType="email-address" autoCapitalize="none" icon="mail-outline"
              />
              <InputField
                label="Mot de passe" value={password} onChangeText={setPassword} placeholder="Votre mot de passe"
                secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} icon="lock-closed-outline"
                suffix={
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} className="ml-2">
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                  </Pressable>
                }
              />

              <Pressable onPress={() => router.push('/auth/forgot-password')} className="self-end -mt-1 mb-6">
                <Text className="text-green-700 text-sm font-semibold">Mot de passe oublié ?</Text>
              </Pressable>

              <PrimaryButton title="Se connecter" onPress={handleLogin} loading={loading} icon="log-in-outline" />
            </View>

            {/* Pied de page */}
            <View className="flex-row items-center justify-center gap-2 mt-9">
              <View className="h-px bg-white/20 flex-1 max-w-[70px]" />
              <Ionicons name="shield-checkmark-outline" size={14} color="#BBF7D0" />
              <Text className="text-green-100 text-xs">Accès réservé aux livreurs Bolamu</Text>
              <View className="h-px bg-white/20 flex-1 max-w-[70px]" />
            </View>
            <Text className="text-green-200 text-[11px] text-center mt-3">Version 1.0.0 — © 2026 Bolamu</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
