import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown, { DropItem } from '../components/Dropdown';
import ProfileButton from '../components/ProfileButton';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';

type ProgressNav = BottomTabNavigationProp<RootTabParamList, 'ProgressScreen'>;

const exerciseItems: DropItem[] = [
  { data: 'Bänkpress' },
  { data: 'Knäböj' },
  { data: 'Marklyft' },
  { data: 'Chins' },
];

const progressByExercise: Record<string, { date: string; detail: string }[]> = {
  'Bänkpress': [
    { date: '2026-01-21', detail: '80 kg • 5x5' },
    { date: '2026-01-07', detail: '77.5 kg • 5x5' },
    { date: '2025-12-20', detail: '75 kg • 5x5' },
  ],
  'Knäböj': [
    { date: '2026-01-18', detail: '110 kg • 5x3' },
    { date: '2026-01-05', detail: '105 kg • 5x3' },
    { date: '2025-12-22', detail: '100 kg • 5x3' },
  ],
  'Marklyft': [
    { date: '2026-01-15', detail: '140 kg • 3x3' },
    { date: '2026-01-02', detail: '135 kg • 3x3' },
    { date: '2025-12-19', detail: '130 kg • 3x3' },
  ],
  Chins: [
    { date: '2026-01-20', detail: 'BW +10 kg • 4x6' },
    { date: '2026-01-06', detail: 'BW +7.5 kg • 4x6' },
    { date: '2025-12-23', detail: 'BW +5 kg • 4x6' },
  ],
};

export default function ProgressScreen() {
  const navigation = useNavigation<ProgressNav>();
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const activeExercise = selectedExercises[0];
  const progressEntries = useMemo(() => {
    if (!activeExercise) return [];
    return progressByExercise[activeExercise] ?? [];
  }, [activeExercise]);

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      <ProfileButton onPress={() => navigation.navigate('ProfileScreen')} />
      <Text style={styles.title}>Progress</Text>

      <View style={styles.section}>
        <Dropdown
          label="Övning"
          placeholder="Välj övning"
          items={exerciseItems}
          singleSelect
          onChange={setSelectedExercises}
        />
      </View>

      <View style={styles.section}>
        {!activeExercise ? (
          <Text style={styles.helper}>Välj en övning för att se din utveckling.</Text>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>{activeExercise}</Text>
            {progressEntries.map(entry => (
              <View key={`${activeExercise}-${entry.date}`} style={styles.card}>
                <Text style={styles.cardDate}>{entry.date}</Text>
                <Text style={styles.cardDetail}>{entry.detail}</Text>
              </View>
            ))}
          </View>
        )}
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
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginTop: 24,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#334155',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
  },
  helper: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
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
  cardDate: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  cardDetail: {
    marginTop: 6,
    fontSize: 17,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
});
