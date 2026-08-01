import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Send, ArrowLeft, MailCheck } from 'lucide-react-native';
import { authApi } from '../../src/api/auth';
import { AppInput, AppButton, BrandLogo } from '../../src/components/ui';
import { AuthLayout } from '../../src/components/AuthLayout';
import { SkiaBackdrop } from '../../src/components/SkiaBackdrop';
import { BRAND } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) { Alert.alert('Erreur', 'Email requis'); return; }
    setLoading(true);
    try { await authApi.forgotPassword(email); setSent(true); }
    catch { Alert.alert('Erreur', 'Une erreur est survenue'); }
    finally { setLoading(false); }
  };

  if (sent) {
    return (
      <LinearGradient colors={['#14532D', '#15803D', '#16A34A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} className="flex-1">
        <SkiaBackdrop />
        <SafeAreaView edges={['top']} className="flex-1">
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={ZoomIn.duration(400)} className="w-24 h-24 rounded-[30px] bg-white items-center justify-center mb-7"
              style={{ shadowColor: '#052E16', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 }}>
              <MailCheck size={44} color={BRAND.green} strokeWidth={1.8} />
            </Animated.View>
            <Text className="text-white text-[30px] font-extrabold tracking-tight">Email envoyé !</Text>
            <Text className="text-brand-100 text-sm text-center mt-2 leading-relaxed">
              Si un compte existe, vous recevrez{'\n'}un lien de réinitialisation.
            </Text>
            <View className="w-full mt-10">
              <AppButton
                title="Retour à la connexion"
                onPress={() => router.back()}
                variant="primary"
                icon={ArrowLeft}
                size="lg"
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <AuthLayout title="Mot de passe oublié">
      <Animated.View entering={FadeInDown.duration(350)}>
        <View className="items-center mb-8">
          <BrandLogo size={56} />
          <Text className="text-[22px] font-extrabold text-ink mt-4 tracking-tight">Pas de panique</Text>
          <Text className="text-ink-muted text-sm mt-1.5 text-center leading-relaxed">
            Saisissez votre email pour recevoir{'\n'}un lien de réinitialisation
          </Text>
        </View>

        <View className="mb-6">
          <AppInput
            label="Email" value={email} onChangeText={setEmail} placeholder="votre@email.com"
            keyboardType="email-address" autoCapitalize="none" icon={Mail} returnKeyType="go" onSubmitEditing={handleSubmit}
          />
        </View>

        <AppButton title="Envoyer le lien" onPress={handleSubmit} loading={loading} icon={Send} size="lg" />
      </Animated.View>
    </AuthLayout>
  );
}
