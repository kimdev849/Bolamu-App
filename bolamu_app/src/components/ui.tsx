import { Pressable, Text, View, ActivityIndicator, TextInput, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CURRENCY } from '../constants/config';
import { STATUS_LABELS } from '../types/common';

/** Palette métier — vert Bolamu (#16A34A) */
export const BRAND = {
  green: '#16A34A',
  greenDark: '#15803D',
  greenSoft: '#DCFCE7',
  text: '#111827',
  muted: '#6B7280',
};

export function BrandLogo({ size = 64 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Image source={require('../../assets/logo.png')} style={{ width: size * 0.86, height: size * 0.62, resizeMode: 'contain' }} />
    </View>
  );
}

/** Badge de statut — les statuts actifs/positifs sont en vert, les alertes restent sémantiques */
export function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    SEARCHING: 'bg-teal-50 text-teal-700', FOUND: 'bg-green-50 text-green-700',
    CONFIRMED: 'bg-green-50 text-green-700', PAID: 'bg-green-50 text-green-700',
    COMPLETED: 'bg-green-50 text-green-700', CANCELLED: 'bg-red-50 text-red-600',
    EXPIRED: 'bg-gray-100 text-gray-500', ACTIVE: 'bg-green-50 text-green-700',
    TRIAL: 'bg-sky-50 text-sky-700', CREATED: 'bg-slate-100 text-slate-600',
    DELIVERED: 'bg-green-50 text-green-700', PENDING: 'bg-amber-50 text-amber-700',
    ASSIGNED: 'bg-emerald-50 text-emerald-700', ACCEPTED: 'bg-green-50 text-green-700',
    AT_WHOLESALER: 'bg-teal-50 text-teal-700', PICKED_UP: 'bg-emerald-50 text-emerald-700',
    IN_TRANSIT: 'bg-green-50 text-green-700', AT_PHARMACY: 'bg-teal-50 text-teal-700',
    FAILED: 'bg-red-50 text-red-600', RETURNED: 'bg-orange-50 text-orange-600',
    REFUNDED: 'bg-gray-100 text-gray-500',
  };
  const c = m[status] || 'bg-gray-100 text-gray-600';
  return <View className={`px-2.5 py-1 rounded-full ${c.split(' ')[0]}`}><Text className={`text-xs font-bold ${c.split(' ')[1]}`}>{STATUS_LABELS[status] || status}</Text></View>;
}

export function PriceTag({ amount, size = 'md' }: { amount: number; size?: 'sm' | 'md' | 'lg' }) {
  const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0;
  const cls = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm';
  return <Text className={`font-bold text-green-700 ${cls}`}>{new Intl.NumberFormat('fr-FR').format(value)} {CURRENCY}</Text>;
}

export function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <BrandLogo size={72} />
      <ActivityIndicator size="large" color={BRAND.green} style={{ marginTop: 20 }} />
      <Text className="text-gray-500 mt-3">{message}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'cube-outline', title, message }: { icon?: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return (
    <View className="items-center justify-center py-16 px-8">
      <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
        <Ionicons name={icon} size={38} color="#16A34A" />
      </View>
      <Text className="text-lg font-bold text-gray-700 mb-2">{title}</Text>
      <Text className="text-gray-500 text-center">{message}</Text>
    </View>
  );
}

export function PrimaryButton({ title, onPress, loading = false, disabled = false, variant = 'primary', icon }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bgMap: Record<string, string> = {
    primary: 'bg-green-600', secondary: 'bg-gray-600', danger: 'bg-red-600',
    outline: 'bg-transparent border-2 border-green-600',
  };
  const txtMap: Record<string, string> = {
    primary: 'text-white', secondary: 'text-white', danger: 'text-white', outline: 'text-green-700',
  };
  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      className={`py-3.5 px-6 rounded-xl items-center justify-center flex-row gap-2 ${bgMap[variant]} ${disabled || loading ? 'opacity-50' : ''}`}>
      {loading ? <ActivityIndicator color="#fff" size="small" />
        : icon ? <Ionicons name={icon} size={18} color={variant === 'outline' ? BRAND.green : '#fff'} />
        : null}
      <Text className={`text-base font-bold ${txtMap[variant]}`}>{title}</Text>
    </Pressable>
  );
}

export function InputField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, error, icon, suffix, autoCapitalize, autoCorrect }: {
  label?: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean; error?: string; icon?: keyof typeof Ionicons.glyphMap;
  suffix?: React.ReactNode; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'; autoCorrect?: boolean;
}) {
  return (
    <View className="mb-4">
      {label && <Text className="text-sm font-semibold text-gray-700 mb-1.5">{label}</Text>}
      <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4 overflow-hidden">
        {icon && <Ionicons name={icon} size={18} color="#9CA3AF" style={{ marginRight: 8 }} />}
        <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} secureTextEntry={secureTextEntry}
          keyboardType={keyboardType} multiline={multiline} autoCapitalize={autoCapitalize ?? 'sentences'} autoCorrect={autoCorrect}
          className={`flex-1 py-3.5 text-gray-800 ${multiline ? 'min-h-[80px]' : ''}`}
          placeholderTextColor="#9CA3AF" />
        {suffix}
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}

export function InfoRow({ label, value, icon }: { label: string; value: string | number | React.ReactNode; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <View className="flex-row items-center gap-2">
        {icon && <Ionicons name={icon} size={16} color="#9CA3AF" />}
        <Text className="text-gray-500 text-sm">{label}</Text>
      </View>
      {typeof value === 'string' || typeof value === 'number' ? <Text className="text-gray-800 text-sm font-medium">{value}</Text> : value}
    </View>
  );
}

export function SectionCard({ title, icon, children }: { title?: string; icon?: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
      {title && (
        <View className="flex-row items-center gap-2 mb-3">
          {icon && <Ionicons name={icon} size={18} color="#16A34A" />}
          <Text className="text-sm font-bold text-gray-800">{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

/** Icône ronde avec fond coloré (ex: transporteur, pharmacie) */
export function RoundIcon({ icon, color = '#16A34A', bg = '#DCFCE7', size = 36 }: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap | keyof typeof Ionicons.glyphMap;
  color?: string; bg?: string; size?: number;
}) {
  const isMCI = icon in MaterialCommunityIcons.glyphMap;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      {isMCI
        ? <MaterialCommunityIcons name={icon as keyof typeof MaterialCommunityIcons.glyphMap} size={size * 0.55} color={color} />
        : <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size * 0.55} color={color} />}
    </View>
  );
}
