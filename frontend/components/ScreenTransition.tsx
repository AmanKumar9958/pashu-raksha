import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

type ScreenTransitionProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function ScreenTransition({ children, style }: ScreenTransitionProps) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (isFocused) {
      opacity.setValue(0);
      translateX.setValue(12);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateX.setValue(12);
    }
  }, [isFocused, opacity, translateX]);

  return (
    <Animated.View style={[{ flex: 1, opacity, transform: [{ translateX }] }, style]}>
      {children}
    </Animated.View>
  );
}
