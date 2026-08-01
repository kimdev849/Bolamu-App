import { View, Text, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Phone, ShieldCheck, LogOut, ChevronRight, CircleUserRound, Truck } from 'lucide-react-native';
import { authApi } from '../../../src/api/auth';
import { useAuthStore } from '../../../src/store/auth';
import { Avatar, AppButton, Card, InfoRow, BrandLogo, OnlinePill } from '../../../src/components/ui';
import { SkiaBackdrop } from '../../../src/components/SkiaBackdrop';
import { BRAND } from '../../../src/theme';

export default function DriverProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data } = useQuery({ queryKey: ['driver-profile'], queryFn: () => authApi.getMe() });

  const me = data?.data?.data;
  const firstName = me?.firstName || user?.firstName;
  const lastName = me?.lastName || user?.lastName;
  const companyName = me?.profile?.name || user?.profile?.name || null;

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View className="flex-1 bg-mist">
      {/* En-tête signature */}
      <LinearGradient colors={['#14532D', '#15803D', '#16A34A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <SkiaBackdrop />
        <SafeAreaView edges={['top']} className="px-5 pt-3 pb-16 overflow-hidden">
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-white text-[22px] font-extrabold tracking-tight">Profil</Text>
            <OnlinePill online />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Carte identité */}
        <View className="bg-white rounded-[28px] p-6 -mt-10 mb-5"
          style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.10, shadowRadius: 24, elevation: 8 }}>
          <View className="items-center mb-4">
            <Avatar firstName={firstName} lastName={lastName} size={84} />
            <Text className="text-[19px] font-extrabold text-ink mt-3.5">{firstName} {lastName}</Text>
            <View className="flex-row items-center gap-1.5 mt-1.5">
              <Truck size={14} color={BRAND.green} strokeWidth={2.2} />
              <Text className="text-ink-muted text-[13px]">{companyName || 'Livreur Bolamu'}</Text>
            </View>
          </View>
          <View className="bg-brand-50 rounded-2xl px-4 py-3 flex-row items-center justify-center gap-2 border border-brand-100">
            <View className="w-2 h-2 rounded-full bg-brand-500" />
            <Text className="text-brand-700 text-[12px] font-bold">Disponible pour les livraisons</Text>
          </View>
        </View>

        {/* Coordonnées */}
        <Card title="Coordonnées" icon={CircleUserRound}>
          <InfoRow icon={Mail} label="Email" value={me?.email || user?.email || '—'} />
          <InfoRow icon={Phone} label="Téléphone" value={me?.phone || user?.phone || '—'} />
          <InfoRow icon={ShieldCheck} label="Statut" value={user?.status || 'Actif'} last />
        </Card>

        {/* À propos */}
        <Card title="Application" icon={BrandLogo} padded={false}>
          <View className="p-5 pt-2">
            <View className="flex-row items-center justify-between py-3 border-b border-mist">
              <Text className="text-ink-muted text-sm">Version</Text>
              <Text className="text-ink text-sm font-semibold">1.0.0</Text>
            </View>
            <View className="flex-row items-center justify-between py-3">
              <Text className="text-ink-muted text-sm">© 2026 Bolamu</Text>
              <ChevronRight size={16} color="#C8D0D8" strokeWidth={2.2} />
            </View>
          </View>
        </Card>

        <View className="mt-2">
          <AppButton title="Se déconnecter" onPress={confirmLogout} variant="danger" icon={LogOut} />
        </View>
      </ScrollView>
    </View>
  );
}
