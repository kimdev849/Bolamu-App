import { View, Text, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ArrowUpRight, Warehouse, Pill, Wallet } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { driverApi } from '../../../src/api';
import { useAuthStore } from '../../../src/store/auth';
import { StatusBadge, PriceTag, EmptyState, BrandLogo, RoundIcon, ListSkeleton } from '../../../src/components/ui';
import { SkiaBackdrop } from '../../../src/components/SkiaBackdrop';
import { BRAND } from '../../../src/theme';

export default function DriverMissionsScreen() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['driver-missions'],
    queryFn: () => driverApi.getMissions(),
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-mist">
        <SafeAreaView edges={['top']} className="bg-brand-800 pb-10" />
        <ListSkeleton rows={4} />
      </View>
    );
  }

  const missions = data?.data?.data ?? [];

  return (
    <View className="flex-1 bg-mist">
      {/* En-tête signature */}
      <LinearGradient colors={['#14532D', '#15803D', '#16A34A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <SkiaBackdrop />
        <SafeAreaView edges={['top']} className="px-5 pt-3 pb-7 overflow-hidden">
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center gap-3">
              <BrandLogo size={44} />
              <View>
                <Text className="text-white text-[19px] font-extrabold tracking-tight">Bonjour, {user?.firstName || 'Livreur'}</Text>
                <Text className="text-brand-100 text-[12px] mt-0.5">
                  {user?.profile?.name ? `${user.profile.name} · ` : ''}{missions.length} mission{missions.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <View className="bg-white/15 rounded-full px-3 py-1.5 flex-row items-center gap-2 border border-white/10">
              <View className="w-2 h-2 rounded-full bg-emerald-300" />
              <Text className="text-white text-[11px] font-bold">En ligne</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {missions.length === 0 ? (
        <EmptyState icon={Wallet} title="Aucune mission" message="Aucune mission assignée pour le moment. Repassez bientôt !" />
      ) : (
        <FlashList
          data={missions}
          keyExtractor={(i: any) => i.id}
          renderItem={({ item, index }: any) => (
            <Animated.View entering={FadeInDown.duration(350).delay(index * 60)}>
              <Pressable
                onPress={() => router.push(`/driver/mission/${item.id}` as any)}
                className="bg-white rounded-3xl p-5 mb-4 mx-5 active:opacity-90"
                style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 14, elevation: 2 }}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1 mr-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-8 h-8 rounded-xl bg-brand-50 items-center justify-center">
                        <Pill size={16} color={BRAND.green} strokeWidth={2.2} />
                      </View>
                      <Text className="font-extrabold text-ink text-[15px] flex-1" numberOfLines={1}>
                        {item.request?.productName || 'Livraison'}
                      </Text>
                    </View>
                    <Text className="text-ink-faint text-[11px] mt-1 ml-10">Réf. {item.reference}</Text>
                  </View>
                  <StatusBadge status={item.deliveryStatus || item.orderStatus} />
                </View>

                {/* Trajet grossiste → pharmacie */}
                <View className="flex-row items-center bg-mist rounded-2xl px-3.5 py-3 mb-4">
                  <RoundIcon icon={Warehouse} size={32} color="#0F766E" bg="#F0FDFA" />
                  <View className="flex-1 ml-2.5 min-w-0">
                    <Text className="text-[10px] text-ink-faint font-bold uppercase tracking-wide">Grossiste</Text>
                    <Text className="text-ink text-[13px] font-semibold" numberOfLines={1}>{item.wholesaler?.name || '—'}</Text>
                  </View>
                  <View style={{ marginHorizontal: 6 }}>
                    <ArrowUpRight size={15} color="#94A3B8" strokeWidth={2.2} />
                  </View>
                  <RoundIcon icon={Pill} size={32} color="#15803D" bg="#F0FDF4" />
                  <View className="flex-1 ml-2.5 min-w-0">
                    <Text className="text-[10px] text-ink-faint font-bold uppercase tracking-wide">Pharmacie</Text>
                    <Text className="text-ink text-[13px] font-semibold" numberOfLines={1}>{item.pharmacy?.name || '—'}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between border-t border-mist pt-3.5">
                  <View className="flex-row items-center gap-1.5">
                    <Wallet size={14} color="#94A3B8" strokeWidth={2.2} />
                    <Text className="text-ink-faint text-[12px] font-medium">À encaisser</Text>
                  </View>
                  <PriceTag amount={item.totalAmount} />
                </View>
              </Pressable>
            </Animated.View>
          )}
          contentContainerClassName="pt-5 pb-10"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={BRAND.green} colors={[BRAND.green]} />}
        />
      )}
    </View>
  );
}
