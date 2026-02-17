import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface AnimatedTabIconProps {
  focused: boolean;
  children: React.ReactNode;
}

const AnimatedTabIcon = React.memo(({ focused, children }: AnimatedTabIconProps) => {
  const scaleValue = useRef(new Animated.Value(focused ? 1.2 : 1.0)).current;

  useEffect(() => {
    console.log('AnimatedTabIcon effect running, focused:', focused);
    Animated.timing(scaleValue, {
      toValue: focused ? 1.2 : 1.0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      console.log('Animation completed to:', focused ? 1.2 : 1.0);
    });
  }, [focused]);

  console.log('AnimatedTabIcon rendering, focused:', focused);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      {children}
    </Animated.View>
  );
});

export default AnimatedTabIcon;
