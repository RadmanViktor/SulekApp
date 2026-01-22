import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown from '../components/Dropdown';
import { useFocusEffect } from '@react-navigation/native';
type ExerciseItem = { id: number; name: string };
type ProgressEntry = {
  workoutId: number;
  workoutName: string;
  workoutCreated: string;
  setNum: number;
  reps: number;
  weightKg?: number | null;
  notes?: string | null;
};

const apiBaseUrl = 'http://localhost:5026';

export default function ProgressScreen() {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);

  const activeExercise = selectedExercises[0];
  const activeExerciseItem = useMemo(
    () => exercises.find(exercise => exercise.name === activeExercise),
    [exercises, activeExercise]
  );

  const progressSummary = useMemo(() => {
    if (progressEntries.length === 0) return null;
    const weights = progressEntries.map(entry => entry.weightKg ?? 0);
    const maxWeight = Math.max(...weights, 0);
    const latest = [...progressEntries]
      .sort((a, b) => new Date(b.workoutCreated).getTime() - new Date(a.workoutCreated).getTime())[0];
    const latestWeight = latest?.weightKg ?? 0;
    const percent = maxWeight > 0 ? Math.min((latestWeight / maxWeight) * 100, 100) : 0;
    return { maxWeight, latestWeight, percent };
  }, [progressEntries]);

  useEffect(() => {
    let isMounted = true;

    async function fetchExercises() {
      setIsLoadingExercises(true);
      try {
        const response = await fetch(`${apiBaseUrl}/Exercise/Exercises`);
        if (!response.ok) return;
        const data: ExerciseItem[] = await response.json();
        if (!isMounted) return;
        setExercises(data);
      } catch (error) {
        if (!isMounted) return;
        setExercises([]);
      } finally {
        if (!isMounted) return;
        setIsLoadingExercises(false);
      }
    }

    fetchExercises();

    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setSelectedExercises([]);
      setProgressEntries([]);
      setIsLoadingProgress(false);
    }, [])
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchProgress() {
      if (!activeExerciseItem) {
        setProgressEntries([]);
        return;
      }
      setIsLoadingProgress(true);
      try {
        const response = await fetch(
          `${apiBaseUrl}/Workout/Progress?exerciseId=${activeExerciseItem.id}&sortBy=weight`
        );
        if (!response.ok) return;
        const data: ProgressEntry[] = await response.json();
        if (!isMounted) return;
        setProgressEntries(data);
      } catch (error) {
        if (!isMounted) return;
        setProgressEntries([]);
      } finally {
        if (!isMounted) return;
        setIsLoadingProgress(false);
      }
    }

    fetchProgress();

    return () => {
      isMounted = false;
    };
  }, [activeExerciseItem]);

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Progress</Text>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Dropdown
            label="Övning"
            placeholder={isLoadingExercises ? 'Hämtar övningar...' : 'Välj övning'}
            items={exercises.map(exercise => ({ data: exercise.name }))}
            singleSelect
            onChange={setSelectedExercises}
          />
        </View>

        <View style={styles.section}>
          {!activeExercise ? (
            <Text style={styles.helper}>Välj en övning för att se din utveckling.</Text>
          ) : isLoadingProgress ? (
            <View style={styles.loading}>
              <ActivityIndicator color="#0F172A" />
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>{activeExercise}</Text>
              {progressSummary ? (
                <View style={styles.progressCard}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Senaste</Text>
                    <Text style={styles.progressValue}>{progressSummary.latestWeight} kg</Text>
                  </View>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Basta</Text>
                    <Text style={styles.progressValue}>{progressSummary.maxWeight} kg</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${progressSummary.percent}%` }]} />
                  </View>
                </View>
              ) : null}
              {progressEntries.length === 0 ? (
                <Text style={styles.helper}>Inga set registrerade ännu.</Text>
              ) : (
                progressEntries.map(entry => (
                  <View key={`${activeExercise}-${entry.workoutId}-${entry.setNum}`} style={styles.card}>
                    <Text style={styles.cardDate}>
                      {new Date(entry.workoutCreated).toISOString().split('T')[0]} • {entry.workoutName}
                    </Text>
                    <Text style={styles.cardDetail}>
                      {entry.reps} reps • {entry.weightKg ?? 0} kg
                      {entry.notes ? ` • ${entry.notes}` : ''}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginTop: 24,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  loading: {
    marginTop: 10,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  progressValue: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  barTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#14B8A6',
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
