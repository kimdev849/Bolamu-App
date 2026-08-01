import { View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HEADER_GRADIENT } from '../theme';

/**
 * Décor d'en-tête « aurora » — blobs flous superposés.
 *
 * - Natif (APK / dev build avec Skia compilé) : rend des blobs organiques.
 * - Expo Go (SDK 54, sans module natif Skia) : fallback LinearGradient.
 * - Web : fallback LinearGradient OBLIGATOIRE — CanvasKit/WebGL n'est pas chargé
 *   par défaut, le rendu Skia web planterait (CanvasKit is not defined).
 *
 * Le require est volontairement dynamique et gardé par Platform.OS pour ne
 * jamais déclencher le rendu Skia sur web ni planter dans Expo Go.
 */
function loadSkia(): any {
  if (Platform.OS === 'web') return null;
  try {
    // @ts-ignore — module natif absent dans Expo Go, attrapé ici
    return require('@shopify/react-native-skia');
  } catch {
    return null;
  }
}

const Skia = loadSkia();

export function SkiaBackdrop() {
  if (Skia && Skia.Canvas && Skia.Group && Skia.Blur && Skia.Circle) {
    const { Canvas, Group, Blur, Circle } = Skia;
    return (
      <View className="absolute inset-0" pointerEvents="none">
        <Canvas style={{ flex: 1 }}>
          <Group>
            <Blur blur={70} />
            <Circle cx={40} cy={40} r={120} color="rgba(255,255,255,0.10)" />
            <Circle cx={320} cy={90} r={150} color="rgba(134,239,172,0.14)" />
            <Circle cx={200} cy={260} r={160} color="rgba(255,255,255,0.06)" />
          </Group>
        </Canvas>
      </View>
    );
  }

  // Fallback (Expo Go / web) — mêmes blobs en dégradés
  return (
    <View className="absolute inset-0 overflow-hidden" pointerEvents="none">
      <LinearGradient colors={HEADER_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      <View className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-white/10" />
      <View className="absolute top-16 -left-20 w-56 h-56 rounded-full bg-emerald-300/20" />
      <View className="absolute -bottom-28 -left-10 w-72 h-72 rounded-full bg-white/5" />
    </View>
  );
}
