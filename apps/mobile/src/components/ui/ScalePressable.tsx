import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";
import { triggerLightHaptic } from "../../utils/haptics";

interface ScalePressableProps extends Omit<PressableProps, "style"> {
  scaleTo?: number;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Reusable spring-scale touch wrapper delivering subtle physical compression
 * and optional light haptic feedback across buttons, chips, and banner cards.
 */
export function ScalePressable({
  scaleTo = 0.97,
  haptic = true,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  style,
  containerStyle,
  children,
  ...rest
}: ScalePressableProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      damping: 20,
      stiffness: 320,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        disabled={disabled}
        onPressIn={(e) => {
          if (!disabled) animateTo(scaleTo);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          animateTo(1);
          onPressOut?.(e);
        }}
        onPress={(e) => {
          if (!disabled && haptic) {
            triggerLightHaptic();
          }
          onPress?.(e);
        }}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
