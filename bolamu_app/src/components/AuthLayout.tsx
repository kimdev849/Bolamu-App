import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { SkiaBackdrop } from './SkiaBackdrop';
import { BRAND } from '../theme';

/**
 * Scaffold commun des écrans d'authentification.
 *
 * Structure aérée et cohérente :
 *   1. En-tête vert arrondi (fond dégradé + retour + titre)
 *   2. Carte blanche bien détachée (marge haute claire, pas de chevauchement)
 *   3. Pied de page poussé en bas (espace flexible), jamais collé à la carte
 */
export function AuthLayout({ title, children, onBack }: {
  title: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <View className="flex-1 bg-mist">
      {/* ── En-tête vert arrondi (le dégradé est lui-même arrondi et clip ses enfants) ── */}
      <LinearGradient
        colors={['#14532D', '#15803D', '#16A34A']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}
      >
        <SkiaBackdrop />
        <SafeAreaView edges={['top']} className="px-5 pt-2 pb-12">
          <View className="flex-row items-center mt-1">
            <Pressable
              onPress={onBack ?? (() => router.back())}
              className="w-10 h-10 rounded-full bg-white/15 items-center justify-center border border-white/10 active:opacity-70"
            >
              <ArrowLeft size={19} color="#fff" strokeWidth={2.2} />
            </Pressable>
            {/* Le titre est centré par flex-1 + text-center ; l'espaceur w-10 à droite
                compense le bouton w-10 à gauche → centrage exact à l'écran. */}
            <Text className="flex-1 text-center text-white text-[17px] font-bold">{title}</Text>
            <View className="w-10" />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Contenu ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow pb-6"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-5 pt-6">
            {/* Carte blanche — détachée de l'en-tête et du bas */}
            <View
              className="bg-white rounded-[28px] p-6"
              style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 24, elevation: 4 }}
            >
              {children}
            </View>

            {/* Espace flexible : pousse le pied de page vers le bas, safe-area respectée */}
            <SafeAreaView edges={['bottom']} className="flex-1 justify-end pt-10">
              <View className="items-center pb-2">
                <View className="flex-row items-center gap-2">
                  <View className="h-px bg-ink-faint/20 flex-1" />
                  <ShieldCheck size={13} color={BRAND.green} strokeWidth={2.2} />
                  <Text className="text-ink-faint text-[11px]">Accès réservé aux livreurs Bolamu</Text>
                  <View className="h-px bg-ink-faint/20 flex-1" />
                </View>
                <Text className="text-ink-faint/70 text-[11px] mt-2.5">© 2026 Bolamu · Version 1.0</Text>
              </View>
            </SafeAreaView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
