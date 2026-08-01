import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi } from '../../../src/api';
import { LoadingScreen, StatusBadge, PriceTag, InfoRow, SectionCard, RoundIcon } from '../../../src/components/ui';
import { STATUS_LABELS } from '../../../src/types/common';

/** Parcours de livraison : statut → statut suivant + libellé de l'action */
const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  ASSIGNED: { status: 'ACCEPTED', label: 'Accepter la mission' },
  ACCEPTED: { status: 'AT_WHOLESALER', label: 'Arrivé chez le grossiste' },
  AT_WHOLESALER: { status: 'PICKED_UP', label: 'Colis récupéré' },
  PICKED_UP: { status: 'IN_TRANSIT', label: 'Démarrer la livraison' },
  IN_TRANSIT: { status: 'AT_PHARMACY', label: 'Arrivé à la pharmacie' },
  // AT_PHARMACY → DELIVERED nécessite la vérification du code OTP
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
      Alert.alert('Livraison confirmée', 'Le code OTP a été vérifié avec succès. Bonne continuation !');
    },
    onError: (err: any) => Alert.alert('Code incorrect', err?.response?.data?.message || 'La vérification du code a échoué'),
  });

  if (isLoading) return <LoadingScreen />;
  const mission = data?.data?.data;
  if (!mission) return <LoadingScreen message="Mission introuvable" />;

  const current = (mission.deliveryStatus || mission.orderStatus || '').toUpperCase();
  const stepIndex = STEPS.indexOf(current);
  const next = NEXT_STATUS[current];
  const isDone = DONE.includes(current);
  const isPending = current === 'PENDING';
  const needsOtp = current === 'AT_PHARMACY';

  const handleVerifyOtp = () => {
    if (otp.trim().length < 4) {
      Alert.alert('Code incomplet', 'Saisissez le code OTP à 4 chiffres donné par la pharmacie');
      return;
    }
    verifyOtpMutation.mutate(otp.trim());
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* En-tête */}
      <SafeAreaView edges={['top']} className="bg-green-600 px-4 pb-5 overflow-hidden">
        <View className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5" />
        <View className="flex-row items-center mt-2">
          <Pressable onPress={() => router.back()} className="mr-3 w-9 h-9 rounded-full bg-white/15 items-center justify-center active:opacity-70">
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
          <Text className="text-white text-xl font-extrabold flex-1">Mission</Text>
          <StatusBadge status={current} />
        </View>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView className="flex-1" contentContainerClassName="p-4 pb-10" showsVerticalScrollIndicator={false}>
          {/* Produit */}
          <SectionCard>
            <View className="flex-row items-start">
              <RoundIcon icon="package-variant" size={40} color="#16A34A" bg="#DCFCE7" />
              <View className="flex-1 ml-3">
                <Text className="text-lg font-extrabold text-gray-800">{mission.request?.productName || 'Livraison'}</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Référence commande : {mission.reference}</Text>
              </View>
            </View>
            <View className="flex-row gap-3 mt-4">
              <View className="flex-1 bg-gray-50 rounded-xl py-2.5 items-center">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase">Quantité</Text>
                <Text className="text-gray-800 font-bold mt-0.5">{mission.request?.quantity ?? 1}</Text>
              </View>
              <View className="flex-1 bg-gray-50 rounded-xl py-2.5 items-center">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase">Urgent</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  {mission.request?.isUrgent
                    ? <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    : <Ionicons name="checkmark-circle" size={16} color="#16A34A" />}
                  <Text className={`font-bold text-sm ${mission.request?.isUrgent ? 'text-red-600' : 'text-gray-800'}`}>
                    {mission.request?.isUrgent ? 'Oui' : 'Non'}
                  </Text>
                </View>
              </View>
            </View>
          </SectionCard>

          {/* Trajet */}
          <SectionCard title="Trajet" icon="navigate-outline">
            <View className="flex-row items-center mb-3">
              <RoundIcon icon="warehouse" size={36} color="#0F766E" bg="#CCFBF1" />
              <View className="flex-1 ml-3">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase">Départ — grossiste</Text>
                <Text className="text-gray-800 font-semibold">{mission.wholesaler?.name || '—'}</Text>
                {mission.wholesaler?.phone ? (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="call-outline" size={11} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">{mission.wholesaler.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View className="flex-row items-center ml-[17px] mb-3">
              <View className="w-px h-4 bg-gray-200" />
              <MaterialCommunityIcons name="truck-delivery-outline" size={14} color="#16A34A" style={{ marginLeft: 10 }} />
            </View>
            <View className="flex-row items-center">
              <RoundIcon icon="medical-bag" size={36} color="#16A34A" bg="#DCFCE7" />
              <View className="flex-1 ml-3">
                <Text className="text-[10px] text-gray-400 font-semibold uppercase">Arrivée — pharmacie</Text>
                <Text className="text-gray-800 font-semibold">{mission.pharmacy?.name || '—'}</Text>
                {mission.pharmacy?.phone ? (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="call-outline" size={11} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">{mission.pharmacy.phone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </SectionCard>

          {/* Montants */}
          <SectionCard title="Montants" icon="wallet-outline">
            <InfoRow label="Produits" value={<PriceTag amount={mission.productAmount} />} />
            <InfoRow label="Livraison" value={<PriceTag amount={mission.deliveryAmount} />} />
            <View className="flex-row items-center justify-between py-3 border-t border-gray-100 mt-1">
              <Text className="text-gray-800 font-bold">Total</Text>
              <PriceTag amount={mission.totalAmount} size="lg" />
            </View>
          </SectionCard>

          {/* Progression */}
          <SectionCard title="Progression" icon="list-outline">
            <View className="flex-row justify-between">
              {STEPS.map((s, i) => {
                const reached = stepIndex >= i;
                return (
                  <View key={s} className="items-center flex-1">
                    <View
                      className={`w-7 h-7 rounded-full items-center justify-center mb-1 ${reached ? 'bg-green-600' : 'bg-gray-200'}`}
                    >
                      {reached && stepIndex > i ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : (
                        <Text className={`text-[10px] font-bold ${reached ? 'text-white' : 'text-gray-500'}`}>{i + 1}</Text>
                      )}
                    </View>
                    {i < STEPS.length - 1 && (
                      <View
                        className={`h-0.5 w-full absolute top-3.5 left-1/2 ${reached && stepIndex > i ? 'bg-green-600' : 'bg-gray-200'}`}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <Text className="text-center text-xs text-gray-500 mt-2">
              Étape {Math.min(stepIndex + 1, STEPS.length)} sur {STEPS.length}
            </Text>
          </SectionCard>

          {/* Vérification OTP (étape AT_PHARMACY) */}
          {needsOtp && (
            <View className="bg-white rounded-2xl p-5 border-2 border-green-200 mb-4">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#16A34A" />
                </View>
                <Text className="text-sm font-bold text-gray-800">Confirmation de livraison</Text>
              </View>
              <Text className="text-xs text-gray-500 mb-4">
                Demandez le code OTP à la pharmacie et saisissez-le pour confirmer la remise du colis.
              </Text>
              <TextInput
                value={otp}
                onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="••••"
                maxLength={4}
                className="bg-gray-50 border-2 border-green-200 rounded-xl px-4 py-4 text-center text-2xl font-bold tracking-[0.6em] text-green-700 mb-4"
                placeholderTextColor="#BBF7D0"
              />
              <Pressable
                onPress={handleVerifyOtp}
                disabled={verifyOtpMutation.isPending}
                className="bg-green-600 py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-green-200 active:opacity-80 disabled:opacity-50"
              >
                {verifyOtpMutation.isPending ? (
                  <Text className="text-white font-bold text-lg">Vérification...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                    <Text className="text-white font-bold text-lg">Vérifier et confirmer la livraison</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Action / états */}
          {isPending && (
            <View className="bg-amber-50 border border-amber-200 rounded-2xl py-4 px-4 flex-row items-center justify-center gap-2">
              <Ionicons name="time-outline" size={18} color="#B45309" />
              <Text className="text-amber-700 font-semibold text-center">Mission en attente d'assignation</Text>
            </View>
          )}
          {!isDone && !isPending && !needsOtp && next && (
            <Pressable
              onPress={() => updateMutation.mutate(next.status)}
              disabled={updateMutation.isPending}
              className="bg-green-600 py-4 rounded-2xl items-center flex-row justify-center gap-2 shadow-lg shadow-green-200 active:opacity-80 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Text className="text-white font-bold text-lg">Mise à jour...</Text>
              ) : (
                <>
                  <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                  <Text className="text-white font-bold text-lg">{next.label}</Text>
                </>
              )}
            </Pressable>
          )}
          {isDone && SUCCESS.includes(current) && (
            <View className="bg-green-50 border border-green-200 rounded-2xl py-4 flex-row items-center justify-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
              <Text className="text-green-700 font-bold">Mission terminée</Text>
            </View>
          )}
          {isDone && FAILED_STATUSES.includes(current) && (
            <View className="bg-red-50 border border-red-200 rounded-2xl py-4 flex-row items-center justify-center gap-2">
              <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
              <Text className="text-red-600 font-bold">{STATUS_LABELS[current] || 'Mission non livrée'}</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
