import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';

type Props = BottomTabScreenProps<RootTabParamList, 'WorkoutDetailScreen'>;

type SetDto = {
  setNum: number;
  reps: number;
  weightKg?: number | null;
  notes?: string | null;
};

type ExerciseDto = {
  name: string;
  workoutExerciseId?: number;
  exerciseId?: number;
  sets?: SetDto[];
};

type WorkoutDto = {
  id?: number;
  name: string;
  workoutDate?: string;
  notes?: string | null;
  exercises?: ExerciseDto[];
};

type WorkoutResponse = {
  workout: WorkoutDto;
};

type SetDraft = {
  setNum: string;
  reps: string;
  weightKg: string;
  notes: string;
  isSaving?: boolean;
};

const apiBaseUrl = 'http://localhost:5026';

export default function WorkoutDetailScreen({ route, navigation }: Props) {
  const [workouts, setWorkouts] = useState<WorkoutDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const date = route.params.date;

  const headerTitle = useMemo(() => {
    if (workouts.length === 1) return workouts[0]?.name ?? 'Pass';
    if (workouts.length > 1) return `Pass (${workouts.length})`;
    return 'Pass';
  }, [workouts]);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
      if (!response.ok) return;
      const data: WorkoutResponse[] = await response.json();
      const matching = data
        .map(item => item.workout)
        .filter(workout => {
          if (!workout.workoutDate) return false;
          const dateOnly = new Date(workout.workoutDate).toISOString().split('T')[0];
          return dateOnly === date;
        });
      setWorkouts(matching);
    } catch (error) {
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleDraftChange = (key: string, next: Partial<SetDraft>) => {
    setSetDrafts(prev => ({
      ...prev,
      [key]: {
        setNum: prev[key]?.setNum ?? '',
        reps: prev[key]?.reps ?? '',
        weightKg: prev[key]?.weightKg ?? '',
        notes: prev[key]?.notes ?? '',
        ...next,
      },
    }));
  };

  const submitSet = async (exercise: ExerciseDto, workoutId?: number) => {
    const workoutExerciseId = exercise.workoutExerciseId;
    if (!workoutExerciseId) {
      Alert.alert('Saknar koppling', 'WorkoutExerciseId saknas från API:t.');
      return;
    }

    const key = `${workoutId ?? 'workout'}-${workoutExerciseId}`;
    const draft = setDrafts[key];
    if (!draft || !draft.setNum || !draft.reps) {
      Alert.alert('Fyll i set', 'Ange setnummer och reps.');
      return;
    }

    const payload = {
      workoutExerciseId,
      setNum: Number(draft.setNum),
      reps: Number(draft.reps),
      weightKg: draft.weightKg ? Number(draft.weightKg) : null,
      notes: draft.notes.trim() || null,
    };

    handleDraftChange(key, { isSaving: true });
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/CreateSet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte spara set', message || 'Något gick fel.');
        return;
      }

      handleDraftChange(key, { setNum: '', reps: '', weightKg: '', notes: '', isSaving: false });
      await loadWorkouts();
    } catch (error) {
      Alert.alert('Kunde inte spara set', 'Kontrollera att API:t är igång.');
    } finally {
      handleDraftChange(key, { isSaving: false });
    }
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>{date}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#0F172A" />
          </View>
        ) : workouts.length === 0 ? (
          <Text style={styles.helper}>Inga pass hittades för detta datum.</Text>
        ) : (
          workouts.map(workout => (
            <View key={`${workout.name}-${workout.workoutDate}`} style={styles.workoutCard}>
              {workout.notes ? <Text style={styles.workoutNotes}>{workout.notes}</Text> : null}

              {(workout.exercises ?? []).map(exercise => {
                const key = `${workout.id ?? workout.name}-${exercise.workoutExerciseId ?? exercise.name}`;
                const draft = setDrafts[key];

                return (
                  <View key={key} style={styles.exerciseCard}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>

                    {(exercise.sets ?? []).length > 0 ? (
                      <View style={styles.setList}>
                          {(exercise.sets ?? []).map(set => (
                            <View key={`${exercise.name}-${set.setNum}`} style={styles.setRow}>
                              <Text style={styles.setLabel}>Set {set.setNum}</Text>
                              <Text style={styles.setValue}>{set.reps} reps</Text>
                              <Text style={styles.setValue}>• {set.weightKg ?? 0} kg</Text>
                              {set.notes ? (
                                <Text style={styles.setNote}>• {set.notes}</Text>
                              ) : null}
                            </View>
                          ))}
                      </View>
                    ) : (
                      <Text style={styles.helper}>Inga set ännu.</Text>
                    )}

                    <View style={styles.formRow}>
                      <TextInput
                        style={styles.input}
                        placeholder="Set"
                        keyboardType="number-pad"
                        value={draft?.setNum ?? ''}
                        onChangeText={value => handleDraftChange(key, { setNum: value })}
                        placeholderTextColor="#9ca3af"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Reps"
                        keyboardType="number-pad"
                        value={draft?.reps ?? ''}
                        onChangeText={value => handleDraftChange(key, { reps: value })}
                        placeholderTextColor="#9ca3af"
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Kg"
                        keyboardType="decimal-pad"
                        value={draft?.weightKg ?? ''}
                        onChangeText={value => handleDraftChange(key, { weightKg: value })}
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                    <TextInput
                      style={[styles.input, styles.notesInput]}
                      placeholder="Anteckningar"
                      value={draft?.notes ?? ''}
                      onChangeText={value => handleDraftChange(key, { notes: value })}
                      placeholderTextColor="#9ca3af"
                    />
                    <Pressable
                      style={[styles.addButton, draft?.isSaving && styles.addButtonDisabled]}
                      onPress={() => submitSet(exercise, workout.id)}
                      disabled={draft?.isSaving}
                    >
                      {draft?.isSaving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.addButtonText}>Lagg till set</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 18,
  },
  title: {
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
  loading: {
    minHeight: 120,
    justifyContent: 'center',
  },
  helper: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
    marginTop: 12,
  },
  workoutCard: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  workoutNotes: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  exerciseCard: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  exerciseName: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  setList: {
    marginTop: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  setLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  setValue: {
    fontSize: 13,
    color: '#334155',
    fontFamily: 'Poppins_400Regular',
  },
  setNote: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  formRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    fontFamily: 'Poppins_400Regular',
    color: '#111827',
  },
  notesInput: {
    marginTop: 10,
  },
  addButton: {
    marginTop: 12,
    backgroundColor: '#14B8A6',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
});
