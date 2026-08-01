import { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KeyRound, Eye, EyeOff } from 'lucide-react-native';
import { AppInput, AppButton } from '../../src/components/ui';
import { AuthLayout } from '../../src/components/AuthLayout';
import { authApi } from '../../src/api/auth';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // Flux mobile : le lien reçu par email contient token + email.
  // Ici on prépare l'écran — le token arrive via deep-link (params).
  const token = params.token;

  const handleSubmit = async () => {
    if (!password || password.length < 6) { Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères'); return; }
    if (password !== confirm) { Alert.alert('Erreur', 'Les mots de passe ne correspondent pas'); return; }
    if (!token) { Alert.alert('Lien invalide', 'Ce lien de réinitialisation est incomplet.'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(params.email || '', token, password);
      Alert.alert('Mot de passe réinitialisé', 'Connectez-vous avec votre nouveau mot de passe.', [
        { text: 'OK', onPress: () => router.replace('/auth/login') },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de réinitialiser le mot de passe');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Nouveau mot de passe">
      <Animated.View entering={FadeInDown.duration(350)}>
        <View className="items-center mb-8">
          <View className="w-14 h-14 rounded-2xl bg-brand-50 items-center justify-center border border-brand-100">
            <KeyRound size={26} color="#15803D" strokeWidth={2} />
          </View>
          <Text className="text-[22px] font-extrabold text-ink mt-4 tracking-tight">Définissez un mot de passe</Text>
          <Text className="text-ink-muted text-sm mt-1.5 text-center leading-relaxed">
            Minimum 6 caractères{'\n'}pour sécuriser votre compte
          </Text>
        </View>

        <View className="mb-6">
          <AppInput
            label="Nouveau mot de passe" value={password} onChangeText={setPassword} placeholder="••••••"
            secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} icon={KeyRound}
            suffix={
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} className="ml-2">
                {show ? <EyeOff size={19} color="#94A3B8" strokeWidth={2} /> : <Eye size={19} color="#94A3B8" strokeWidth={2} />}
              </Pressable>
            }
          />
          <AppInput
            label="Confirmer le mot de passe" value={confirm} onChangeText={setConfirm} placeholder="••••••"
            secureTextEntry={!show} autoCapitalize="none" autoCorrect={false} icon={KeyRound}
            returnKeyType="go" onSubmitEditing={handleSubmit}
          />
        </View>

        <AppButton title="Réinitialiser" onPress={handleSubmit} loading={loading} size="lg" />
      </Animated.View>
    </AuthLayout>
  );
}
