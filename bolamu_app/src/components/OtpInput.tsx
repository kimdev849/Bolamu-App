import { View, Text, TextInput, Pressable } from 'react-native';
import { useRef, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { BRAND } from '../theme';

/**
 * Saisie OTP 4 chiffres avec boîtes individuelles et auto-avance.
 * Le code saisi est confirmé par la pharmacie avant remise du colis.
 */
export function OtpInput({ value, onChange, onComplete, error }: {
  value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; error?: boolean;
}) {
  const inputRef = useRef<TextInput>(null);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const handleChange = (t: string) => {
    const clean = t.replace(/[^0-9]/g, '').slice(0, 4);
    onChange(clean);
    if (clean.length === 4) onComplete?.(clean);
  };

  // Animation d'erreur (secousse)
  const triggerError = () => {
    shake.value = withSequence(
      withTiming(-10, { duration: 60, easing: Easing.out(Easing.quad) }),
      withTiming(10, { duration: 90 }),
      withTiming(-6, { duration: 90 }),
      withTiming(0, { duration: 70 }),
    );
  };

  useEffect(() => {
    if (error) triggerError();
  }, [error]);

  const digits = Array.from({ length: 4 });

  return (
    <Pressable onPress={() => inputRef.current?.focus()} className="relative">
      <Animated.View style={shakeStyle} className="flex-row justify-between mb-3">
        {digits.map((_, i) => {
          const filled = value[i];
          return (
            <View
              key={i}
              className={`w-[58px] h-[62px] rounded-2xl items-center justify-center border-2 ${error && !filled ? 'border-red-300' : filled ? 'border-brand-500' : 'border-mist'} ${error && !filled ? 'bg-red-50' : 'bg-white'}`}
            >
              <Text className={`text-[26px] font-extrabold tracking-widest ${filled ? 'text-ink' : 'text-ink-faint'}`}>
                {filled || '·'}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Input invisible qui capte la frappe */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={4}
        autoFocus={false}
        className="absolute opacity-0 w-full h-full"
        selectionColor={BRAND.green}
        caretHidden
      />
    </Pressable>
  );
}
