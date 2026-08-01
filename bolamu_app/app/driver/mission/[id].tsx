import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing, FadeInDown } from 'react-native-reanimated';
import { ArrowLeft, Warehouse, Pill, Phone, Wallet, Check, CheckCheck, Clock, XCircle, CircleDollarSign, Package, ArrowRight, Navigation, Truck } from 'lucide-react-native';
import { driverApi } from '../../../src/api';
import { StatusBadge, PriceTag, Card, RoundIcon, LoadingScreen, AppButton } from '../../../src/components/ui';
import { OtpInput } from '../../../src/components/OtpInput';
import { SkiaBackdrop } from '../../../src/components/SkiaBackdrop';
import { STATUS_LABELS } from '../../../src/types/common';
import { BRAND } from '../../../src/theme';

/** Parcours de livraison : statut → statut suivant + libellé de l'action */
const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  ASSIGNED: { status: 'ACCEPTED', label: 'Accepter la mission' },
  ACCEPTED: { status: 'AT_WHOLESALER', label: 'Arrivé chez le grossiste' },
  AT_WHOLESALER: { status: 'PICKED_UP', label: 'Colis récupéré' },
  PICKED_UP: { status: 'IN_TRANSIT', label: 'Démarrer la livraison' },
  IN_TRANSIT: { status: 'AT_PHARMACY', label: 'Arrivé à la pharmacie' },
  DELIVERED: { status: 'COMPLETED', label: 'Terminer la mission' },
};

const STEPS = ['ASSIGNED', 'ACCEPTED', 'AT_WHOLESALER', 'PICKED_UP', 'IN_TRANSIT', 'AT_PHARMACY', 'DELIVERED', 'COMPLETED'];
const DONE = ['COMPLETED', 'CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED', 'DISPUTED'];
const SUCCESS = ['DELIVERED', 'COMPLETED'];
const FAILED_STATUSES = ['CANCELLED', 'FAILED', 'RETURNED', 'REFUNDED', 'DISPUTED'];

export default function DriverMissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-mission', id],
    queryFn: () => driverApi.getMission(id),
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => driverApi.updateMissionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-mission', id] });
      qc.invalidateQueries({ queryKey: ['driver-missions'] });
    },
    onError: (err: any) => Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de mettre à jour le statut'),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (code: string) => driverApi.verifyMissionOtp(id, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['driver-mission', id] });
      qc.invalidateQueries({ queryKey: ['driver-missions'] });
      setOtp('');
      setOtpError(false);
      Alert.alert('Livraison confirmée', 'Le code OTP a été vérifié avec succès. Bonne continuation !');
    },
    onError: () => {
      setOtpError(true);
      setOtp('');
      Alert.alert('Code incorrect', 'La vérification du code a échoué. Vérifiez le code avec la pharmacie.');
    },
  });

  if (isLoading) return <LoadingScreen message="Chargement de la mission…" />;
  const mission = data?.data?.data;
  if (!mission) return <LoadingScreen message="Mission introuvable" />;

  const current = (mission.deliveryStatus || mission.orderStatus || '').toUpperCase();
  const stepIndex = STEPS.indexOf(current);
  const next = NEXT_STATUS[current];
  const isDone = DONE.includes(current);
  const isPending = current === 'PENDING';
  const needsOtp = current === 'AT_PHARMACY';

  const handleVerifyOtp = (code?: string) => {
    const value = code ?? otp;
    if ((value || '').trim().length < 4) {
      setOtpError(true);
      Alert.alert('Code incomplet', 'Saisissez le code OTP à 4 chiffres donné par la pharmacie');
      return;
    }
    verifyOtpMutation.mutate(value.trim());
  };

  return (
    <View className="flex-1 bg-mist">
      {/* En-tête */}
      <LinearGradient colors={['#14532D', '#15803D', '#16A34A']} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}>
        <SkiaBackdrop />
        <SafeAreaView edges={['top']} className="px-5 pt-3 pb-6 overflow-hidden">
          <View className="flex-row items-center mt-1">
            <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white/15 items-center justify-center mr-3 border border-white/10">
              <ArrowLeft size={19} color="#fff" strokeWidth={2.2} />
            </Pressable>
            <Text className="text-white text-[20px] font-extrabold tracking-tight flex-1">Mission</Text>
            <StatusBadge status={current} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10" showsVerticalScrollIndicator={false}>
        {/* Produit */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card>
            <View className="flex-row items-start">
              <RoundIcon icon={Package} size={44} color="#15803D" bg="#F0FDF4" />
              <View className="flex-1 ml-3.5">
                <Text className="text-[17px] font-extrabold text-ink">{mission.request?.productName || 'Livraison'}</Text>
                <Text className="text-ink-faint text-[12px] mt-0.5">Référence : {mission.reference}</Text>
              </View>
            </View>
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1 bg-mist rounded-2xl py-3 items-center">
                <Text className="text-[10px] text-ink-faint font-bold uppercase tracking-wide">Quantité</Text>
                <Text className="text-ink font-extrabold mt-0.5 text-[15px]">{mission.request?.quantity ?? 1}</Text>
              </View>
              <View className="flex-1 bg-mist rounded-2xl py-3 items-center">
                <Text className="text-[10px] text-ink-faint font-bold uppercase tracking-wide">Urgent</Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  {mission.request?.isUrgent
                    ? <XCircle size={16} color="#DC2626" strokeWidth={2.2} />
                    : <Check size={16} color="#15803D" strokeWidth={2.4} />}
                  <Text className={`font-bold text-[13px] ${mission.request?.isUrgent ? 'text-red-600' : 'text-ink'}`}>
                    {mission.request?.isUrgent ? 'Oui' : 'Non'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Trajet */}
        <Animated.View entering={FadeInDown.duration(300).delay(80)}>
          <Card title="Trajet" icon={Navigation}>
            <View className="flex-row items-center mb-3">
              <RoundIcon icon={Warehouse} size={38} color="#0F766E" bg="#F0FDFA" />
              <View className="flex-1 ml-3">
                <Text className="text-[10px] text-ink-faint font-bold uppercase tracking-wide">Départ — grossiste</Text>
                <Text className="text-ink font-bold text-[14px]">{mission.wholesaler?.name || '—'}</Text>
                {mission.wholesaler?.phone ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Phone size={11} color="#94A3B8" strokeWidth={2.2} />
                    <Text className="text-ink-faint text-[12px]">{mission.wholesaler.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View className="flex-row items-center ml-[17px] mb-3">
              <View className="w-px h-4 bg-mist" />
              <Truck size={14} color="#16A34A" strokeWidth={2.2} style={{ marginLeft: 10 }} />
            </View>
            <View className="flex-row items-center">
              <RoundIcon icon={Pill} size={38} color="#15803D" bg="#F0FDF4" />
              <View className="flex-1 ml-3">
                <Text className="text-[10px] text-ink-faint font-bold uppercase tracking-wide">Arrivée — pharmacie</Text>
                <Text className="text-ink font-bold text-[14px]">{mission.pharmacy?.name || '—'}</Text>
                {mission.pharmacy?.phone ? (
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Phone size={11} color="#94A3B8" strokeWidth={2.2} />
                    <Text className="text-ink-faint text-[12px]">{mission.pharmacy.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Montants */}
        <Animated.View entering={FadeInDown.duration(300).delay(140)}>
          <Card title="Montants" icon={CircleDollarSign}>
            <View className="flex-row items-center justify-between py-3 border-b border-mist">
              <Text className="text-ink-muted text-sm">Produits</Text>
              <PriceTag amount={mission.productAmount} />
            </View>
            <View className="flex-row items-center justify-between py-3 border-b border-mist">
              <Text className="text-ink-muted text-sm">Livraison</Text>
              <PriceTag amount={mission.deliveryAmount} />
            </View>
            <View className="flex-row items-center justify-between py-3.5 mt-1">
              <View className="flex-row items-center gap-2">
                <Wallet size={16} color="#15803D" strokeWidth={2.2} />
                <Text className="text-ink font-extrabold text-[15px]">Total</Text>
              </View>
              <PriceTag amount={mission.totalAmount} size="lg" />
            </View>
          </Card>
        </Animated.View>

        {/* Progression */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)}>
          <Card title="Progression" icon={CheckCheck}>
            <StepperProgress stepIndex={Math.max(stepIndex, 0)} total={STEPS.length} current={current} />
            <Text className="text-center text-[12px] text-ink-muted mt-3">
              Étape {Math.min(Math.max(stepIndex, 0) + 1, STEPS.length)} sur {STEPS.length}
            </Text>
          </Card>
        </Animated.View>

        {/* Vérification OTP (étape AT_PHARMACY) */}
        {needsOtp && (
          <Animated.View entering={FadeInDown.duration(350).delay(240)}>
            <View className="bg-white rounded-3xl p-5 mb-4 border border-brand-100"
              style={{ shadowColor: '#052E16', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 }}>
              <View className="flex-row items-center gap-2.5 mb-1.5">
                <View className="w-9 h-9 rounded-2xl bg-brand-50 items-center justify-center border border-brand-100">
                  <ShieldCheckIcon />
                </View>
                <Text className="text-[15px] font-extrabold text-ink">Confirmation de livraison</Text>
              </View>
              <Text className="text-[13px] text-ink-muted mb-5 leading-relaxed">
                Demandez le code OTP à la pharmacie et saisissez-le pour confirmer la remise du colis.
              </Text>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setOtpError(false); }} onComplete={handleVerifyOtp} error={otpError} />
              <AppButton
                title={verifyOtpMutation.isPending ? 'Vérification…' : 'Vérifier et confirmer'}
                onPress={() => handleVerifyOtp()}
                loading={verifyOtpMutation.isPending}
                icon={Check}
                size="lg"
              />
            </View>
          </Animated.View>
        )}

        {/* Action / états */}
        {isPending && (
          <View className="bg-amber-50 border border-amber-100 rounded-2xl py-4 px-4 flex-row items-center justify-center gap-2.5">
            <Clock size={18} color="#B45309" strokeWidth={2.2} />
            <Text className="text-amber-700 font-bold text-[13px] text-center">Mission en attente d'assignation</Text>
          </View>
        )}
        {!isDone && !isPending && !needsOtp && next && (
          <AppButton
            title={updateMutation.isPending ? 'Mise à jour…' : next.label}
            onPress={() => updateMutation.mutate(next.status)}
            loading={updateMutation.isPending}
            icon={ArrowRight}
            size="lg"
          />
        )}
        {isDone && SUCCESS.includes(current) && (
          <View className="bg-brand-50 border border-brand-100 rounded-2xl py-4 flex-row items-center justify-center gap-2.5">
            <CheckCheck size={20} color="#15803D" strokeWidth={2.2} />
            <Text className="text-brand-700 font-extrabold text-[14px]">Mission terminée</Text>
          </View>
        )}
        {isDone && FAILED_STATUSES.includes(current) && (
          <View className="bg-red-50 border border-red-100 rounded-2xl py-4 flex-row items-center justify-center gap-2.5">
            <XCircle size={20} color="#DC2626" strokeWidth={2.2} />
            <Text className="text-red-600 font-extrabold text-[14px]">{STATUS_LABELS[current] || 'Mission non livrée'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ── Stepper de progression animé ── */
function StepperProgress({ stepIndex, total, current }: { stepIndex: number; total: number; current: string }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(stepIndex / (total - 1), { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [stepIndex]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(progress.value * 100, 0)}%`,
  }));

  return (
    <View>
      {/* Ligne de progression */}
      <View className="h-1.5 bg-mist rounded-full overflow-hidden mb-4">
        <Animated.View style={fillStyle} className="h-full bg-brand-500 rounded-full" />
      </View>
      {/* Points */}
      <View className="flex-row justify-between">
        {STEPS.map((s, i) => {
          const reached = stepIndex >= i;
          const isCurrent = current === s;
          return (
            <View key={s} className="items-center" style={{ width: 34 }}>
              <View
                className={`w-7 h-7 rounded-full items-center justify-center border-2 ${reached ? 'bg-brand-600 border-brand-600' : 'bg-white border-mist'}`}
              >
                {reached && stepIndex > i ? (
                  <Check size={13} color="#fff" strokeWidth={3} />
                ) : isCurrent && reached ? (
                  <View className="w-2.5 h-2.5 rounded-full bg-white" />
                ) : (
                  <View className={`w-2 h-2 rounded-full ${reached ? 'bg-white' : 'bg-[#D8E0DA]'}`} />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ShieldCheckIcon() {
  return (
    <View className="w-9 h-9 rounded-2xl bg-brand-50 items-center justify-center border border-brand-100">
      <Check size={18} color="#15803D" strokeWidth={2.4} />
    </View>
  );
}
