import React, { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

interface AnimatedTabButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  'aria-selected'?: boolean;
  [key: string]: any;
}

export default function AnimatedTabButton(props: AnimatedTabButtonProps) {
  const { children, onPress, style } = props;
  const isFocused = props['aria-selected'] || false;
  
  const scaleValue = useRef(new Animated.Value(isFocused ? 1.2 : 1.0)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: isFocused ? 1.2 : 1.0,
      useNativeDriver: true,
      friction: 8,
      tension: 15,
    }).start();
  }, [isFocused]);

  return (
    <Pressable onPress={onPress} style={[style, { flex: 1 }]}>
      <Animated.View style={{ transform: [{ scale: scaleValue }], alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
