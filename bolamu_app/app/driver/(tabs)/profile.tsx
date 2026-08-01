import { View, Text, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../src/api/auth';
import { useAuthStore } from '../../../src/store/auth';
import { LoadingScreen, InfoRow, PrimaryButton, SectionCard } from '../../../src/components/ui';

function InitialsAvatar({ firstName, lastName, size = 84 }: { firstName?: string; lastName?: string; size?: number }) {
  const initials = `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}` || 'LB';
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-green-600 items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.36, lineHeight: size * 0.44 }} className="text-white font-extrabold">
        {initials}
      </Text>
    </View>
  );
}

export default function DriverProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data, isLoading } = useQuery({ queryKey: ['driver-profile'], queryFn: () => authApi.getMe() });

  if (isLoading) return <LoadingScreen />;
  const me = data?.data?.data;
  const firstName = me?.firstName || user?.firstName;
  const lastName = me?.lastName || user?.lastName;

  return (
    <View className="flex-1 bg-gray-50">
      {/* En-tête vert */}
      <SafeAreaView edges={['top']} className="bg-green-600 px-5 pb-14 overflow-hidden">
        <View className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <Text className="text-white text-xl font-extrabold mt-2">Profil</Text>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-8">
          {/* Carte identité */}
          <View className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-black/5 -mt-10 mb-4">
            <View className="items-center mb-5">
              <InitialsAvatar firstName={firstName} lastName={lastName} />
              <Text className="text-xl font-extrabold text-gray-800 mt-3">
                {firstName} {lastName}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-1.5">
                <Ionicons name="car-outline" size={14} color="#16A34A" />
                <Text className="text-gray-500 text-sm">Livreur Bolamu</Text>
              </View>
            </View>
            <View className="bg-green-50 rounded-xl px-4 py-2.5 flex-row items-center justify-center gap-2 mb-1">
              <View className="w-2 h-2 rounded-full bg-green-600" />
              <Text className="text-green-700 text-xs font-semibold">Disponible pour les livraisons</Text>
            </View>
          </View>

          {/* Coordonnées */}
          <SectionCard title="Coordonnées" icon="information-circle-outline">
            <InfoRow icon="mail-outline" label="Email" value={me?.email || user?.email || '—'} />
            <InfoRow icon="call-outline" label="Téléphone" value={me?.phone || user?.phone || '—'} />
            <InfoRow icon="shield-checkmark-outline" label="Statut" value={user?.status || 'Actif'} />
          </SectionCard>

          <PrimaryButton
            title="Se déconnecter"
            variant="danger"
            icon="log-out-outline"
            onPress={() => Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
            ])}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
