import React from 'react';
import { Pressable, Image, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onPress: () => void;
  style?: ViewStyle;
};

export default function ProfileButton({ onPress, style }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable style={[styles.button, { top: insets.top + 12 }, style]} onPress={onPress}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' }}
        style={styles.image}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 18,
    zIndex: 10,
    elevation: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
