import { useEffect } from 'react';
import { Pressable, Text, View, ActivityIndicator, TextInput, Image, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withRepeat, Easing, FadeInDown, FadeIn } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import {
  Check, CheckCircle2, AlertTriangle, Info, Truck, Mail, Lock, Phone,
  Eye, EyeOff, MapPin, Package, Wallet, LogOut, Navigation, Clock, ShieldCheck,
} from 'lucide-react-native';
import { CURRENCY } from '../constants/config';
import { STATUS_LABELS } from '../types/common';
import { BRAND } from '../theme';

export { BRAND };

/* ────────────────────────────────────────────────────────────
 * Logo
 * ──────────────────────────────────────────────────────────── */
export function BrandLogo({ size = 64, rounded = true }: { size?: number; rounded?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size * 0.28 : size * 0.12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: '#052E16',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
      }}
    >
      <Image source={require('../../assets/logo.png')} style={{ width: size * 0.82, height: size * 0.58, resizeMode: 'contain' }} />
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Bouton pressable avec retour visuel (Reanimated)
 * ──────────────────────────────────────────────────────────── */
export function PressableScale({ onPress, children, disabled, style, scaleTo = 0.96 }: {
  onPress?: () => void; children: React.ReactNode; disabled?: boolean; style?: any; scaleTo?: number;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        onPressIn={() => { s.value = withSpring(scaleTo, { damping: 20, stiffness: 300 }); }}
        onPressOut={() => { s.value = withSpring(1, { damping: 14, stiffness: 260 }); }}
        onPress={onPress}
        disabled={disabled}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Bouton principal
 * ──────────────────────────────────────────────────────────── */
export function AppButton({ title, onPress, loading = false, disabled = false, variant = 'primary', icon: Icon, full = true, size = 'md' }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  full?: boolean; size?: 'sm' | 'md' | 'lg';
}) {
  const palette = {
    primary: { bg: BRAND.green, text: '#fff', border: BRAND.green },
    secondary: { bg: BRAND.greenSoft, text: BRAND.greenDark, border: BRAND.greenSoft },
    danger: { bg: '#DC2626', text: '#fff', border: '#DC2626' },
    outline: { bg: 'transparent', text: BRAND.greenDark, border: BRAND.green },
    ghost: { bg: 'transparent', text: BRAND.muted, border: 'transparent' },
  }[variant];
  const pad = size === 'sm' ? 'px-4 py-2.5' : size === 'lg' ? 'px-6 py-[18px]' : 'px-5 py-3.5';

  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={full ? undefined : { alignSelf: 'flex-start' }}>
      <View
        style={{ backgroundColor: palette.bg, borderColor: palette.border }}
        className={`${pad} rounded-2xl items-center justify-center flex-row gap-2 border ${full ? 'w-full' : ''} ${disabled || loading ? 'opacity-60' : ''}`}
      >
        {loading ? (
          <ActivityIndicator color={palette.text} size="small" />
        ) : (
          Icon && <Icon size={18} color={palette.text} strokeWidth={2.2} />
        )}
        <Text style={{ color: palette.text }} className="text-[15px] font-bold">{title}</Text>
      </View>
    </PressableScale>
  );
}

/** Alias rétro-compatible */
export function PrimaryButton(props: any) { return <AppButton {...props} />; }

/* ────────────────────────────────────────────────────────────
 * Champ de saisie premium (focus ring + icône lucide)
 * ──────────────────────────────────────────────────────────── */
export function AppInput({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, error, icon: Icon, suffix, autoCapitalize, autoCorrect, returnKeyType, onSubmitEditing }: {
  label?: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
  secureTextEntry?: boolean; keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean; error?: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  suffix?: React.ReactNode; autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean; returnKeyType?: 'done' | 'next' | 'go' | 'send'; onSubmitEditing?: () => void;
}) {
  const ring = useSharedValue(0);
  const ringStyle = useAnimatedStyle(() => ({
    borderColor: error ? '#DC2626' : ring.value === 1 ? BRAND.green : '#E8EDEA',
  }));
  return (
    <View className="mb-4">
      {label && <Text className="text-[13px] font-semibold text-ink mb-1.5">{label}</Text>}
      <Animated.View style={ringStyle} className={`flex-row items-center bg-white border rounded-2xl px-4 ${error ? 'border-red-500' : ''}`}>
        {Icon && (
          <View style={{ marginRight: 10 }}>
            <Icon size={19} color={BRAND.muted} strokeWidth={2} />
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize={autoCapitalize ?? 'sentences'}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => { ring.value = withTiming(1, { duration: 180 }); }}
          onBlur={() => { ring.value = withTiming(0, { duration: 180 }); }}
          className={`flex-1 py-3.5 text-ink text-[15px] ${multiline ? 'min-h-[80px]' : ''}`}
          placeholderTextColor="#A7B0B8"
          selectionColor={BRAND.green}
        />
        {suffix}
      </Animated.View>
      {error && (
        <View className="flex-row items-center gap-1 mt-1.5">
          <AlertTriangle size={12} color="#DC2626" />
          <Text className="text-red-500 text-xs">{error}</Text>
        </View>
      )}
    </View>
  );
}

/** Alias rétro-compatible */
export function InputField(props: any) { return <AppInput {...props} />; }

/* ────────────────────────────────────────────────────────────
 * Carte / section
 * ──────────────────────────────────────────────────────────── */
export function Card({ title, icon: Icon, children, className = '', padded = true, accent = false }: {
  title?: string; icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  children: React.ReactNode; className?: string; padded?: boolean; accent?: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(280)} style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 2 }}
      className={`bg-white rounded-3xl ${accent ? 'border border-brand-100' : ''} mb-4 ${className}`}>
      {title && (
        <View className={`flex-row items-center gap-2.5 ${padded ? 'px-5 pt-5 pb-0' : 'p-5 pb-0'}`}>
          {Icon && (
            <View className="w-8 h-8 rounded-xl bg-brand-50 items-center justify-center">
              <Icon size={17} color={BRAND.green} strokeWidth={2.2} />
            </View>
          )}
          <Text className="text-[15px] font-bold text-ink">{title}</Text>
        </View>
      )}
      <View className={padded ? 'p-5' : ''}>{children}</View>
    </Animated.View>
  );
}

/** Alias rétro-compatible */
export function SectionCard({ title, icon, children }: any) { return <Card title={title} icon={icon} children={children} />; }

/* ────────────────────────────────────────────────────────────
 * Badge de statut
 * ──────────────────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { bg: string; fg: string; dot: string }> = {
  SEARCHING: { bg: '#F0FDFA', fg: '#0F766E', dot: '#14B8A6' },
  FOUND: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  CONFIRMED: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  PAID: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  COMPLETED: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  DELIVERED: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  ACTIVE: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  ACCEPTED: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  PICKED_UP: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981' },
  IN_TRANSIT: { bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  AT_WHOLESALER: { bg: '#F0FDFA', fg: '#0F766E', dot: '#14B8A6' },
  AT_PHARMACY: { bg: '#F0FDFA', fg: '#0F766E', dot: '#14B8A6' },
  ASSIGNED: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981' },
  CREATED: { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' },
  PENDING: { bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B' },
  TRIAL: { bg: '#F0F9FF', fg: '#0369A1', dot: '#0EA5E9' },
  CANCELLED: { bg: '#FEF2F2', fg: '#B91C1C', dot: '#EF4444' },
  FAILED: { bg: '#FEF2F2', fg: '#B91C1C', dot: '#EF4444' },
  REFUNDED: { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' },
  RETURNED: { bg: '#FFF7ED', fg: '#C2410C', dot: '#F97316' },
  EXPIRED: { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' },
  DISPUTED: { bg: '#FEF2F2', fg: '#B91C1C', dot: '#EF4444' },
};

export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const key = (status || '').toUpperCase();
  const st = STATUS_STYLE[key] || { bg: '#F1F5F9', fg: '#475569', dot: '#94A3B8' };
  const pad = size === 'md' ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const txt = size === 'md' ? 'text-xs' : 'text-[11px]';
  return (
    <View style={{ backgroundColor: st.bg }} className={`${pad} rounded-full flex-row items-center gap-1.5`}>
      <View style={{ backgroundColor: st.dot }} className="w-1.5 h-1.5 rounded-full" />
      <Text style={{ color: st.fg }} className={`${txt} font-bold`}>{STATUS_LABELS[key] || status}</Text>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Prix
 * ──────────────────────────────────────────────────────────── */
export function PriceTag({ amount, size = 'md' }: { amount: number; size?: 'sm' | 'md' | 'lg' }) {
  const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount) || 0;
  const cls = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-[15px]';
  return <Text className={`font-extrabold text-brand-700 ${cls}`}>{new Intl.NumberFormat('fr-FR').format(value)} {CURRENCY}</Text>;
}

/* ────────────────────────────────────────────────────────────
 * Avatar initiales
 * ──────────────────────────────────────────────────────────── */
export function Avatar({ firstName, lastName, size = 64 }: { firstName?: string; lastName?: string; size?: number }) {
  const initials = `${(firstName?.[0] || '').toUpperCase()}${(lastName?.[0] || '').toUpperCase()}` || 'LB';
  return (
    <LinearGradient colors={[BRAND.greenDark, BRAND.green]} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#052E16', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 }}>
      <Text style={{ fontSize: size * 0.34, color: '#fff' }} className="font-extrabold tracking-wide">{initials}</Text>
    </LinearGradient>
  );
}

/** Alias rétro-compatible InitialsAvatar */
export function InitialsAvatar(props: any) { return <Avatar {...props} />; }

/* ────────────────────────────────────────────────────────────
 * Squelette de chargement (skeleton)
 * ──────────────────────────────────────────────────────────── */
export function Skeleton({ width = '100%', height = 14, radius = 8, className = '' }: { width?: DimensionValue; height?: number; radius?: number; className?: string }) {
  const op = useSharedValue(0.4);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  useEffect(() => {
    op.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, []);
  return (
    <Animated.View style={[style, { width, height, borderRadius: radius, backgroundColor: '#E8EDEA' }]} className={className} />
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Animated.View key={i} entering={FadeIn.delay(i * 60)} className="bg-white rounded-3xl p-5 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Skeleton width={140} height={16} />
            <Skeleton width={70} height={22} radius={12} />
          </View>
          <Skeleton width="90%" height={13} className="mb-2" />
          <Skeleton width="60%" height={13} />
        </Animated.View>
      ))}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Écran de chargement (Lottie)
 * ──────────────────────────────────────────────────────────── */
export function LoadingScreen({ message = 'Chargement…' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-mist">
      <View className="w-28 h-28 rounded-[32px] bg-white items-center justify-center" style={{ shadowColor: '#052E16', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 }}>
        <LottieView source={require('../../assets/animations/spinner.json')} autoPlay loop style={{ width: 84, height: 84 }} />
      </View>
      <Text className="text-ink-soft text-sm mt-5 font-medium">{message}</Text>
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
 * État vide
 * ──────────────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon = Package, title, message }: { icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; title: string; message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="items-center justify-center py-16 px-8">
      <View className="w-20 h-20 rounded-[26px] bg-brand-50 items-center justify-center mb-5 border border-brand-100">
        <Icon size={34} color={BRAND.green} strokeWidth={1.8} />
      </View>
      <Text className="text-lg font-bold text-ink mb-1.5">{title}</Text>
      <Text className="text-ink-muted text-center text-sm leading-relaxed">{message}</Text>
    </Animated.View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Ligne d'info
 * ──────────────────────────────────────────────────────────── */
export function InfoRow({ label, value, icon: Icon, last }: {
  label: string; value: string | number | React.ReactNode; icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${last ? '' : 'border-b border-mist'}`}>
      <View className="flex-row items-center gap-2.5">
        {Icon && <Icon size={16} color={BRAND.faint} strokeWidth={2} />}
        <Text className="text-ink-muted text-sm">{label}</Text>
      </View>
      {typeof value === 'string' || typeof value === 'number' ? <Text className="text-ink text-sm font-semibold">{value}</Text> : value}
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Icône ronde
 * ──────────────────────────────────────────────────────────── */
export function RoundIcon({ icon: Icon, color = BRAND.green, bg = '#DCFCE7', size = 36 }: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; color?: string; bg?: string; size?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={size * 0.52} color={color} strokeWidth={2} />
    </View>
  );
}

/* ────────────────────────────────────────────────────────────
 * Pastille "en ligne"
 * ──────────────────────────────────────────────────────────── */
export function OnlinePill({ online = true, label }: { online?: boolean; label?: string }) {
  const pulse = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: pulse.value }));
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
      ),
      -1,
    );
  }, []);
  return (
    <View className="bg-white/15 rounded-full px-3 py-1.5 flex-row items-center gap-2 border border-white/10">
      <Animated.View style={style} className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-300' : 'bg-slate-400'}`} />
      <Text className="text-white text-[11px] font-bold">{label ?? (online ? 'En ligne' : 'Hors ligne')}</Text>
    </View>
  );
}

/* Icônes utilitaires (ré-export) */
export { Check, CheckCircle2, AlertTriangle, Info, Truck, Mail, Lock, Phone, Eye, EyeOff, MapPin, Package, Wallet, LogOut, Navigation, Clock, ShieldCheck };
