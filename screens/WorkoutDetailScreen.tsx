import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Dimensions, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';
import { toLocalDateString } from '../utils/date';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import { getApiBaseUrl } from '../config/apiConfig';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

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
  completed?: boolean;
  cardioTimeMinutes?: number | null;
  cardioDistanceKm?: number | null;
  cardioCalories?: number | null;
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

const apiBaseUrl = getApiBaseUrl();

export default function WorkoutDetailScreen({ route, navigation }: Props) {
  const { authFetch } = useAuth();
  const [workout, setWorkout] = useState<WorkoutDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const repsInputRefs = useRef<Record<string, TextInput | null>>({});
  const date = route.params.date;
  const workoutId = route.params.workoutId;
  const screenWidth = Dimensions.get('window').width;

  const headerTitle = workout?.name ?? 'Pass';

  const loadWorkout = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(`${apiBaseUrl}/Workout/Workouts/${workoutId}`);
      if (!response.ok) {
        setWorkout(null);
        return;
      }
      const data: WorkoutResponse = await response.json();
      setWorkout(data.workout ?? null);
    } catch (error) {
      setWorkout(null);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, workoutId]);

  useEffect(() => {
    loadWorkout();
  }, [loadWorkout]);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [loadWorkout])
  );

  useEffect(() => {
    if (!workout) return;
    setSetDrafts(prev => {
      let next = prev;
      let updated = false;

      (workout.exercises ?? []).forEach(exercise => {
        const key = `${exercise.workoutExerciseId ?? exercise.name}`;
        const current = next[key];
        if (current?.setNum) return;

        const maxSetNum = Math.max(0, ...(exercise.sets ?? []).map(set => set.setNum));
        const suggested = String(maxSetNum + 1);

        next = {
          ...next,
          [key]: {
            setNum: suggested,
            reps: current?.reps ?? '',
            weightKg: current?.weightKg ?? '',
            notes: current?.notes ?? '',
            isSaving: current?.isSaving,
          },
        };
        updated = true;
      });

      return updated ? next : prev;
    });
  }, [workout]);

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

  const parseOptionalNumber = (value: string, label: string, integer = false) => {
    if (!value.trim()) return null;
    const normalized = integer ? value.trim() : value.replace(',', '.');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      Alert.alert('Fel värde', `${label} måste vara ett positivt tal.`);
      return undefined;
    }
    if (integer && !Number.isInteger(parsed)) {
      Alert.alert('Fel värde', `${label} måste vara ett heltal.`);
      return undefined;
    }
    return parsed;
  };

  const submitSet = async (exercise: ExerciseDto) => {
    const workoutExerciseId = exercise.workoutExerciseId;
    if (!workoutExerciseId) {
      Alert.alert('Saknar koppling', 'WorkoutExerciseId saknas från API:t.');
      return;
    }

    const key = `${workoutExerciseId}`;
    const draft = setDrafts[key];
    if (!draft || !draft.setNum || !draft.reps) {
      Alert.alert('Fyll i set', 'Ange setnummer och reps.');
      return;
    }

    const setNum = Number(draft.setNum);
    if (!Number.isFinite(setNum) || setNum <= 0) {
      Alert.alert('Felaktigt setnummer', 'Setnumret måste vara större än 0.');
      return;
    }

    const existingSetNums = (exercise.sets ?? []).map(set => set.setNum);
    if (existingSetNums.includes(setNum)) {
      Alert.alert('Setnummer finns redan', 'Välj ett nytt setnummer för övningen.');
      return;
    }

    const payload = {
      workoutExerciseId,
      setNum,
      reps: Number(draft.reps),
      weightKg: draft.weightKg ? Number(draft.weightKg) : null,
      notes: draft.notes.trim() || null,
    };

    handleDraftChange(key, { isSaving: true });
    try {
      const response = await authFetch(`${apiBaseUrl}/Workout/CreateSet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte spara set', message || 'Något gick fel.');
        return;
      }

      const nextSetNum = Math.max(setNum, ...existingSetNums) + 1;
      handleDraftChange(key, {
        setNum: String(nextSetNum),
        reps: '',
        weightKg: '',
        notes: '',
        isSaving: false,
      });
      repsInputRefs.current[key]?.focus();
      await loadWorkout();
    } catch (error) {
      Alert.alert('Kunde inte spara set', 'Kontrollera att API:t är igång.');
    } finally {
      handleDraftChange(key, { isSaving: false });
    }
  };

  const markWorkoutCompleted = async () => {
    const workoutId = workout?.id;
    if (!workoutId || isCompleting) return;

    setIsCompleting(true);
    try {
      const response = await authFetch(`${apiBaseUrl}/Workout/Workouts/${workoutId}/Complete`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte markera pass', message || 'Något gick fel.');
        return;
      }

      await loadWorkout();
      setConfettiKey(prev => prev + 1);
      setShowConfetti(true);
      Alert.alert('Klart', 'Passet är markerat som klart.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('HomeScreen'),
        },
      ]);
    } catch (error) {
      Alert.alert('Kunde inte markera pass', 'Kontrollera att API:t är igång.');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/background_1.png')}
      style={styles.bg}
      resizeMode='cover'
    >
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      {showConfetti ? (
        <View style={styles.confettiContainer} pointerEvents="none">
          <ConfettiCannon
            key={confettiKey}
            count={50}
            origin={{ x: screenWidth / 2, y: 12 }}
            fadeOut
            onAnimationEnd={() => setShowConfetti(false)}
          />
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>{date}</Text>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#0F172A" />
          </View>
        ) : !workout ? (
          <Text style={styles.helper}>Inga pass hittades för detta datum.</Text>
        ) : (
          <View style={styles.workoutCard}>
            {workout.notes ? <Text style={styles.workoutNotes}>{workout.notes}</Text> : null}

            {(workout.exercises ?? []).map(exercise => {
              const key = `${exercise.workoutExerciseId ?? exercise.name}`;
              const draft = setDrafts[key];

              return (
                <View key={key} style={[
                  styles.exerciseCard,
                  workout.completed && styles.exerciseCardCompleted
                ]}>
                  <View style={styles.exerciseHeader}>
                    <Ionicons name="barbell-outline" size={20} color={colors.brand.primary} />
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                  </View>

                  {(exercise.sets ?? []).length > 0 ? (
                    <View style={styles.setList}>
                        {(exercise.sets ?? []).map(set => (
                          <View key={`${exercise.name}-${set.setNum}`} style={[
                            styles.setRow,
                            workout.completed && styles.setRowCompleted
                          ]}>
                            <View style={styles.setBadge}>
                              <Text style={styles.setBadgeText}>Set {set.setNum}</Text>
                            </View>
                            <View style={styles.setInfo}>
                              <View style={styles.setDetail}>
                                <Ionicons name="repeat-outline" size={16} color={colors.brand.primary} />
                                <Text style={styles.setDetailText}>{set.reps} reps</Text>
                              </View>
                              <View style={styles.setDetail}>
                                <Ionicons name="barbell-outline" size={16} color={colors.brand.primary} />
                                <Text style={styles.setDetailText}>{set.weightKg ?? 0} kg</Text>
                              </View>
                            </View>
                            {set.notes ? (
                              <Text style={styles.setNoteStyled}>{set.notes}</Text>
                            ) : null}
                          </View>
                        ))}
                    </View>
                  ) : (
                    <Text style={styles.helper}>Inga set ännu.</Text>
                  )}

                  {!workout.completed && (
                    <>
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
                          ref={input => {
                            repsInputRefs.current[key] = input;
                          }}
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
                        onPress={() => submitSet(exercise)}
                        disabled={draft?.isSaving}
                      >
                        {draft?.isSaving ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.addButtonText}>Lägg till set</Text>
                        )}
                      </Pressable>
                    </>
                  )}
                </View>
              );
            })}
            {!workout.completed && (
              <Pressable
                style={[
                  styles.completeButton,
                  isCompleting && styles.completeButtonDisabled,
                ]}
                onPress={markWorkoutCompleted}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.completeButtonText}>
                    Markera pass som klart
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
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
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  exerciseCardCompleted: {
    backgroundColor: colors.brand.soft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 1,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  setList: {
    marginTop: 8,
    gap: 8,
  },
  setRow: {
    flexDirection: 'column',
    marginBottom: 4,
    gap: 6,
  },
  setRowCompleted: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  setBadge: {
    backgroundColor: colors.brand.primary,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  setBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  setInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  setDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setDetailText: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  setNoteStyled: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
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
    borderColor: colors.border,
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
    backgroundColor: colors.brand.primary,
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
  completeButton: {
    marginTop: 16,
    backgroundColor: colors.brand.pressed,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonDone: {
    backgroundColor: '#94A3B8',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  completeButtonTextDone: {
    color: '#F8FAFC',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  completionText: {
    fontSize: 16,
    color: '#059669',
    fontFamily: 'Poppins_400Regular',
    fontWeight: '600',
  },
});
