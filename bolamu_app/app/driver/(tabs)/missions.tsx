import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../../src/api';
import { useAuthStore } from '../../../src/store/auth';
import { StatusBadge, PriceTag, LoadingScreen, EmptyState, BrandLogo, RoundIcon } from '../../../src/components/ui';

export default function DriverMissionsScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['driver-missions'],
    queryFn: () => driverApi.getMissions(),
  });

  if (isLoading) return <LoadingScreen message="Chargement des missions..." />;
  const missions = data?.data?.data ?? [];

  return (
    <View className="flex-1 bg-gray-50">
      {/* En-tête vert */}
      <SafeAreaView edges={['top']} className="bg-green-600 px-5 pb-6 overflow-hidden">
        <View className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center gap-3">
            <BrandLogo size={48} />
            <View>
              <Text className="text-white text-xl font-extrabold">Bonjour, {user?.firstName || 'Livreur'}</Text>
              <Text className="text-green-100 text-xs mt-0.5">
                {user?.profile?.name ? `${user.profile.name} · ` : ''}Vos missions de livraison
              </Text>
            </View>
          </View>
          <View className="bg-white/15 rounded-full px-3 py-1.5 flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-green-300" />
            <Text className="text-white text-[11px] font-semibold">En ligne</Text>
          </View>
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} className="flex-1">
        {missions.length === 0 ? (
          <EmptyState icon="cube-outline" title="Aucune mission" message="Aucune mission assignée pour le moment." />
        ) : (
          <FlatList
            data={missions}
            keyExtractor={(i) => i.id}
            contentContainerClassName="p-4 pb-8"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#16A34A" colors={['#16A34A']} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/driver/mission/${item.id}` as any)}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 active:opacity-80"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-2">
                    <Text className="font-bold text-gray-800">{item.request?.productName || 'Livraison'}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">Réf: {item.reference}</Text>
                  </View>
                  <StatusBadge status={item.deliveryStatus || item.orderStatus} />
                </View>

                {/* Trajet grossiste → pharmacie */}
                <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2.5 mb-3">
                  <RoundIcon icon="warehouse" size={30} color="#0F766E" bg="#CCFBF1" />
                  <View className="flex-1 ml-2.5">
                    <Text className="text-[10px] text-gray-400 font-semibold uppercase">Grossiste</Text>
                    <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>{item.wholesaler?.name || '—'}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={14} color="#9CA3AF" style={{ marginHorizontal: 4 }} />
                  <RoundIcon icon="medical-bag" size={30} color="#16A34A" bg="#DCFCE7" />
                  <View className="flex-1 ml-2.5">
                    <Text className="text-[10px] text-gray-400 font-semibold uppercase">Pharmacie</Text>
                    <Text className="text-gray-800 text-sm font-medium" numberOfLines={1}>{item.pharmacy?.name || '—'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <View className="flex-row items-center gap-1.5">
                    <Ionicons name="cash-outline" size={15} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs font-medium">Montant à encaisser</Text>
                  </View>
                  <PriceTag amount={item.totalAmount} />
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
