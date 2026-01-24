import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';
import { toLocalDateString } from '../utils/date';
import ConfettiCannon from 'react-native-confetti-cannon';

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

type CardioDraft = {
  timeMinutes: string;
  distanceKm: string;
  calories: string;
  isSaving?: boolean;
  elapsedSeconds?: number;
  isRunning?: boolean;
};

const apiBaseUrl = 'http://localhost:5026';

export default function WorkoutDetailScreen({ route, navigation }: Props) {
  const [workouts, setWorkouts] = useState<WorkoutDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [setDrafts, setSetDrafts] = useState<Record<string, SetDraft>>({});
  const [completingWorkouts, setCompletingWorkouts] = useState<Record<number, boolean>>({});
  const [cardioDrafts, setCardioDrafts] = useState<Record<number, CardioDraft>>({});
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const repsInputRefs = useRef<Record<string, TextInput | null>>({});
  const cardioIntervals = useRef<Record<number, ReturnType<typeof setInterval> | null>>({});
  const date = route.params.date;
  const screenWidth = Dimensions.get('window').width;

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
          const dateOnly = toLocalDateString(workout.workoutDate);
          return dateOnly === date;
        });
        console.log('Matching workouts:', matching);
        console.log('Date filter:', date);
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

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  useEffect(() => {
    if (workouts.length === 0) return;
    setSetDrafts(prev => {
      let next = prev;
      let updated = false;

      workouts.forEach(workout => {
        (workout.exercises ?? []).forEach(exercise => {
          const key = `${workout.id ?? workout.name}-${exercise.workoutExerciseId ?? exercise.name}`;
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
      });

      return updated ? next : prev;
    });
  }, [workouts]);

  useEffect(() => {
    if (workouts.length === 0) return;
    setCardioDrafts(prev => {
      let next = prev;
      let updated = false;

      workouts.forEach(workout => {
        if (!workout.id) return;
        const current = next[workout.id];
        if (current) return;

        next = {
          ...next,
          [workout.id]: {
            timeMinutes: workout.cardioTimeMinutes != null ? String(workout.cardioTimeMinutes) : '',
            distanceKm: workout.cardioDistanceKm != null ? String(workout.cardioDistanceKm) : '',
            calories: workout.cardioCalories != null ? String(workout.cardioCalories) : '',
            isSaving: false,
            elapsedSeconds: 0,
            isRunning: false,
          },
        };
        updated = true;
      });

      return updated ? next : prev;
    });
  }, [workouts]);

  useEffect(() => {
    Object.entries(cardioDrafts).forEach(([id, draft]) => {
      const workoutId = Number(id);
      if (draft?.isRunning) {
        if (cardioIntervals.current[workoutId]) return;
        cardioIntervals.current[workoutId] = setInterval(() => {
          setCardioDrafts(prev => {
            const current = prev[workoutId];
            if (!current?.isRunning) return prev;
            return {
              ...prev,
              [workoutId]: {
                ...current,
                elapsedSeconds: (current.elapsedSeconds ?? 0) + 1,
              },
            };
          });
        }, 1000);
      } else if (cardioIntervals.current[workoutId]) {
        clearInterval(cardioIntervals.current[workoutId]!);
        cardioIntervals.current[workoutId] = null;
      }
    });

    return () => {
      Object.values(cardioIntervals.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
      cardioIntervals.current = {};
    };
  }, [cardioDrafts]);

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

  const handleCardioDraftChange = (workoutId: number, next: Partial<CardioDraft>) => {
    setCardioDrafts(prev => ({
      ...prev,
      [workoutId]: {
        timeMinutes: prev[workoutId]?.timeMinutes ?? '',
        distanceKm: prev[workoutId]?.distanceKm ?? '',
        calories: prev[workoutId]?.calories ?? '',
        isSaving: prev[workoutId]?.isSaving ?? false,
        elapsedSeconds: prev[workoutId]?.elapsedSeconds ?? 0,
        isRunning: prev[workoutId]?.isRunning ?? false,
        ...next,
      },
    }));
  };

  const startCardioTimer = (workoutId: number) => {
    handleCardioDraftChange(workoutId, { isRunning: true });
  };

  const pauseCardioTimer = (workoutId: number) => {
    handleCardioDraftChange(workoutId, { isRunning: false });
  };

  const stopCardioTimer = (workoutId: number) => {
    setCardioDrafts(prev => {
      const current = prev[workoutId];
      if (!current) return prev;
      const elapsedSeconds = current.elapsedSeconds ?? 0;
      const minutes = elapsedSeconds > 0 ? (elapsedSeconds / 60).toFixed(2) : '';
      return {
        ...prev,
        [workoutId]: {
          ...current,
          timeMinutes: minutes,
          elapsedSeconds: 0,
          isRunning: false,
        },
      };
    });
  };

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  const submitCardio = async (workoutId: number) => {
    const draft = cardioDrafts[workoutId];
    if (!draft) return;

    const timeMinutes = parseOptionalNumber(draft.timeMinutes, 'Tid');
    if (timeMinutes === undefined) return;
    const distanceKm = parseOptionalNumber(draft.distanceKm, 'Kilometer');
    if (distanceKm === undefined) return;
    const calories = parseOptionalNumber(draft.calories, 'Kalorier', true);
    if (calories === undefined) return;

    handleCardioDraftChange(workoutId, { isSaving: true });
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts/${workoutId}/Cardio`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardioTimeMinutes: timeMinutes,
          cardioDistanceKm: distanceKm,
          cardioCalories: calories,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte spara cardio', message || 'Något gick fel.');
        return;
      }

      await loadWorkouts();
    } catch (error) {
      Alert.alert('Kunde inte spara cardio', 'Kontrollera att API:t är igång.');
    } finally {
      handleCardioDraftChange(workoutId, { isSaving: false });
    }
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

      const nextSetNum = Math.max(setNum, ...existingSetNums) + 1;
      handleDraftChange(key, {
        setNum: String(nextSetNum),
        reps: '',
        weightKg: '',
        notes: '',
        isSaving: false,
      });
      repsInputRefs.current[key]?.focus();
      await loadWorkouts();
    } catch (error) {
      Alert.alert('Kunde inte spara set', 'Kontrollera att API:t är igång.');
    } finally {
      handleDraftChange(key, { isSaving: false });
    }
  };

  const markWorkoutCompleted = async (workoutId?: number) => {
    if (!workoutId) return;
    if (completingWorkouts[workoutId]) return;

    setCompletingWorkouts(prev => ({ ...prev, [workoutId]: true }));
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts/${workoutId}/Complete`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte markera pass', message || 'Något gick fel.');
        return;
      }

      await loadWorkouts();
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
      setCompletingWorkouts(prev => ({ ...prev, [workoutId]: false }));
    }
  };

  return (
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
        ) : workouts.length === 0 ? (
          <Text style={styles.helper}>Inga pass hittades för detta datum.</Text>
        ) : (
          workouts.map(workout => {
            const workoutId = workout.id;
            const isCompleting = workoutId ? completingWorkouts[workoutId] : false;
            const cardioDraft = workoutId ? cardioDrafts[workoutId] : undefined;

            return (
            <View key={`${workout.name}-${workout.workoutDate}`} style={styles.workoutCard}>
              {workout.notes ? <Text style={styles.workoutNotes}>{workout.notes}</Text> : null}
              {workoutId ? (
                <View style={styles.cardioCard}>
                  <View style={styles.cardioHeader}>
                    <Text style={styles.cardioTitle}>Cardio</Text>
                    {(workout.cardioTimeMinutes != null || workout.cardioDistanceKm != null || workout.cardioCalories != null) ? (
                      <View style={styles.cardioSummary}>
                        {workout.cardioTimeMinutes != null ? (
                          <Text style={styles.cardioSummaryText}>{workout.cardioTimeMinutes} min</Text>
                        ) : null}
                        {workout.cardioDistanceKm != null ? (
                          <Text style={styles.cardioSummaryText}>{workout.cardioDistanceKm} km</Text>
                        ) : null}
                        {workout.cardioCalories != null ? (
                          <Text style={styles.cardioSummaryText}>{workout.cardioCalories} kcal</Text>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.timerRow}>
                    <Text style={styles.timerValue}>
                      {formatElapsed(cardioDraft?.elapsedSeconds ?? 0)}
                    </Text>
                    <View style={styles.timerActions}>
                      <Pressable
                        style={[styles.timerButton, cardioDraft?.isRunning && styles.timerButtonActive]}
                        onPress={() => startCardioTimer(workoutId)}
                        disabled={cardioDraft?.isRunning}
                      >
                        <Text style={[styles.timerButtonText, cardioDraft?.isRunning && styles.timerButtonTextActive]}>Starta</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.timerButton, styles.timerButtonMuted]}
                        onPress={() => pauseCardioTimer(workoutId)}
                        disabled={!cardioDraft?.isRunning}
                      >
                        <Text style={styles.timerButtonText}>Pausa</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.timerButton, styles.timerButtonStop]}
                        onPress={() => stopCardioTimer(workoutId)}
                      >
                        <Text style={[styles.timerButtonText, styles.timerButtonTextActive]}>Stoppa</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.cardioInputRow}>
                    <View style={styles.cardioField}>
                      <TextInput
                        style={styles.cardioInput}
                        placeholder="Tid"
                        keyboardType="decimal-pad"
                        value={cardioDraft?.timeMinutes ?? ''}
                        onChangeText={value => handleCardioDraftChange(workoutId, { timeMinutes: value })}
                        placeholderTextColor="#9ca3af"
                      />
                      <Text style={styles.cardioSuffix}>min</Text>
                    </View>
                    <View style={styles.cardioField}>
                      <TextInput
                        style={styles.cardioInput}
                        placeholder="Km"
                        keyboardType="decimal-pad"
                        value={cardioDraft?.distanceKm ?? ''}
                        onChangeText={value => handleCardioDraftChange(workoutId, { distanceKm: value })}
                        placeholderTextColor="#9ca3af"
                      />
                      <Text style={styles.cardioSuffix}>km</Text>
                    </View>
                    <View style={styles.cardioField}>
                      <TextInput
                        style={styles.cardioInput}
                        placeholder="Kcal"
                        keyboardType="number-pad"
                        value={cardioDraft?.calories ?? ''}
                        onChangeText={value => handleCardioDraftChange(workoutId, { calories: value })}
                        placeholderTextColor="#9ca3af"
                      />
                      <Text style={styles.cardioSuffix}>kcal</Text>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.cardioSaveButton, cardioDraft?.isSaving && styles.cardioSaveButtonDisabled]}
                    onPress={() => submitCardio(workoutId)}
                    disabled={cardioDraft?.isSaving}
                  >
                    {cardioDraft?.isSaving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.cardioSaveButtonText}>Spara cardio</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

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
                      onPress={() => submitSet(exercise, workout.id)}
                      disabled={draft?.isSaving}
                    >
                      {draft?.isSaving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.addButtonText}>Lägg till set</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
              <Pressable
                style={[
                  styles.completeButton,
                  workout.completed && styles.completeButtonDone,
                  isCompleting && styles.completeButtonDisabled,
                ]}
                onPress={() => markWorkoutCompleted(workoutId)}
                disabled={!workoutId || !!workout.completed || isCompleting}
              >
                {isCompleting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.completeButtonText,
                      workout.completed && styles.completeButtonTextDone,
                    ]}
                  >
                    {workout.completed ? 'Klart' : 'Markera pass som klart'}
                  </Text>
                )}
              </Pressable>
            </View>
          );
          })
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
  cardioCard: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  cardioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardioTitle: {
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  cardioSummary: {
    flexDirection: 'row',
    gap: 8,
  },
  cardioSummaryText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  cardioInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardioField: {
    flex: 1,
    position: 'relative',
  },
  cardioInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
    fontFamily: 'Poppins_400Regular',
    color: '#111827',
    paddingRight: 36,
    height: 44,
  },
  cardioSuffix: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    height: 44,
    lineHeight: 44,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  cardioSaveButton: {
    marginTop: 10,
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardioSaveButtonDisabled: {
    opacity: 0.7,
  },
  cardioSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerValue: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  timerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  timerButtonMuted: {
    backgroundColor: '#CBD5F5',
  },
  timerButtonStop: {
    backgroundColor: '#0D9488',
  },
  timerButtonActive: {
    backgroundColor: '#14B8A6',
  },
  timerButtonText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  timerButtonTextActive: {
    color: '#FFFFFF',
  },
  cardioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cardioStat: {
    minWidth: 90,
  },
  cardioLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  cardioValue: {
    marginTop: 2,
    fontSize: 14,
    color: '#0F172A',
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
  completeButton: {
    marginTop: 16,
    backgroundColor: '#0D9488',
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
});
