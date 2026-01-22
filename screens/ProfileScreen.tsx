import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileButton from '../components/ProfileButton';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';

type ProfileNav = BottomTabNavigationProp<RootTabParamList, 'ProfileScreen'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      <ProfileButton onPress={() => navigation.navigate('ProfileScreen')} />
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=320&q=80' }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Alex Andersson</Text>
        <Text style={styles.subtitle}>Styrka • 3 pass/vecka</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mina mål</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Veckomål</Text>
          <Text style={styles.cardValue}>3 pass</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Primärt fokus</Text>
          <Text style={styles.cardValue}>Hypertrofi</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Senaste aktivitet</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Push-pass</Text>
          <Text style={styles.cardValue}>21 jan 2026</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Pull-pass</Text>
          <Text style={styles.cardValue}>19 jan 2026</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  name: {
    marginTop: 14,
    fontSize: 22,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#334155',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  cardValue: {
    marginTop: 6,
    fontSize: 18,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
});
