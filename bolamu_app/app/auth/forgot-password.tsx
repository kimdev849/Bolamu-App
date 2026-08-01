import { useState } from 'react';
import { View, Text, Alert, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../src/api/auth';
import { InputField, PrimaryButton, BrandLogo } from '../../src/components/ui';

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
      <View className="flex-1 bg-green-600">
        {/* Décor */}
        <View className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
        <View className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-white/5" />

        <SafeAreaView edges={['top']} className="flex-1">
          <View className="flex-1 items-center justify-center px-8 -mt-10">
            <View className="w-24 h-24 rounded-full bg-white items-center justify-center mb-7 shadow-2xl shadow-black/20">
              <Ionicons name="mail-open-outline" size={44} color="#16A34A" />
            </View>
            <Text className="text-white text-3xl font-extrabold tracking-tight">Email envoyé !</Text>
            <Text className="text-green-100 text-sm text-center mt-2 leading-relaxed">
              Si un compte existe, vous recevrez{'\n'}un lien de réinitialisation.
            </Text>

            <View className="w-full mt-10">
              <Pressable
                onPress={() => router.back()}
                className="bg-white py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-black/10 active:opacity-90"
              >
                <Ionicons name="arrow-back-outline" size={20} color="#16A34A" />
                <Text className="text-green-700 font-bold text-lg">Retour à la connexion</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-green-600">
      {/* Décor */}
      <View className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/5" />
      <View className="absolute top-1/3 -left-20 w-56 h-56 rounded-full bg-white/5" />
      <View className="absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-white/5" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="flex-grow" keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['top']} className="pt-8 pb-6 px-8">
            {/* Bouton retour — en flux normal pour respecter l'encoche */}
            <View className="flex-row items-center mb-6">
              <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:opacity-70">
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </Pressable>
              <View className="flex-1" />
            </View>
            <View className="items-center">
              <BrandLogo size={88} />
              <Text className="text-white text-3xl font-extrabold mt-5 tracking-tight">Mot de passe oublié</Text>
              <Text className="text-green-100 text-sm mt-2">Pas de panique, on vous aide</Text>
            </View>
          </SafeAreaView>

          {/* Carte flottante */}
          <View className="px-6 pt-4 pb-6">
            <View className="bg-white rounded-[28px] p-7 shadow-2xl shadow-black/20">
              <View className="mb-7">
                <Text className="text-2xl font-extrabold text-gray-900">Réinitialisation</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Saisissez votre email pour recevoir un lien de réinitialisation
                </Text>
              </View>

              <InputField
                label="Email" value={email} onChangeText={setEmail} placeholder="votre@email.com"
                keyboardType="email-address" autoCapitalize="none" icon="mail-outline"
              />

              <PrimaryButton title="Envoyer le lien" onPress={handleSubmit} loading={loading} icon="send-outline" />
            </View>

            {/* Pied de page */}
            <View className="flex-row items-center justify-center gap-2 mt-9">
              <View className="h-px bg-white/20 flex-1 max-w-[70px]" />
              <Ionicons name="shield-checkmark-outline" size={14} color="#BBF7D0" />
              <Text className="text-green-100 text-xs">Accès réservé aux livreurs Bolamu</Text>
              <View className="h-px bg-white/20 flex-1 max-w-[70px]" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
