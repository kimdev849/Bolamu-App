import React from 'react';
import { View, Pressable, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Truck, UserRound, type LucideIcon } from 'lucide-react-native';
import { BRAND } from '../theme';
import { usePathname, router } from 'expo-router';

interface TabDef {
  name: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDef[] = [
  { name: 'missions', path: '/driver/missions', label: 'Missions', icon: Truck },
  { name: 'profile', path: '/driver/profile', label: 'Profil', icon: UserRound },
];

/**
 * Barre d'onglets animée — indicateur vert qui glisse vers l'onglet actif.
 * Remplace la barre native par une identité sur mesure Bolamu.
 */
export function AppTabBar() {
  const pathname = usePathname();
  const activeIndex = TABS.findIndex((t) => pathname.startsWith(t.path));
  const index = activeIndex === -1 ? 0 : activeIndex;

  const [barWidth, setBarWidth] = React.useState(0);
  const pos = useSharedValue(0);
  const posStyle = useAnimatedStyle(() => ({ left: pos.value }));

  React.useEffect(() => {
    if (barWidth > 0) {
      // Largeur utile = barWidth - padding horizontal (px-3 = 12px de chaque côté)
      const step = (barWidth - 24) / TABS.length;
      pos.value = withSpring(12 + index * step, { damping: 18, stiffness: 220 });
    }
  }, [index, barWidth]);

  return (
    <View
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
      className="flex-row bg-white border-t border-mist pt-2 pb-5 px-3"
      style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 10 }}
    >
      {barWidth > 0 && (
        <Animated.View
          style={[
            posStyle,
            {
              width: (barWidth - 24) / TABS.length,
              height: 44,
              position: 'absolute',
              top: 8,
              backgroundColor: '#F0FDF4',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#DCFCE7',
            },
          ]}
        />
      )}

      {TABS.map((tab, i) => {
        const active = i === index;
        const Icon = tab.icon;
        return (
          <Pressable key={tab.name} onPress={() => router.navigate(tab.path as any)} className="flex-1 items-center py-2">
            <View className="w-11 h-9 items-center justify-center">
              <Icon size={22} color={active ? BRAND.greenDark : BRAND.faint} strokeWidth={active ? 2.4 : 2} />
            </View>
            <Text className={`text-[11px] font-bold mt-0.5 ${active ? 'text-brand-700' : 'text-ink-faint'}`}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
