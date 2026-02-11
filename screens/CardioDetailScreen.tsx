import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';
import { toLocalDateString } from '../utils/date';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

type Props = BottomTabScreenProps<RootTabParamList, 'CardioDetailScreen'>;

type Coordinate = {
  latitude: number;
  longitude: number;
};

type CardioDraft = {
  timeMinutes: string;
  distanceKm: string;
  calories: string;
  isSaving?: boolean;
  elapsedSeconds?: number;
  isRunning?: boolean;
  route?: Coordinate[];
  distanceMeters?: number;
  mapRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
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
};

type WorkoutResponse = {
  workout: WorkoutDto;
};

const apiBaseUrl = 'http://localhost:5026';

export default function CardioDetailScreen({ route, navigation }: Props) {
  const [workouts, setWorkouts] = useState<WorkoutDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cardioDrafts, setCardioDrafts] = useState<Record<number, CardioDraft>>({});
  const [completingWorkouts, setCompletingWorkouts] = useState<Record<number, boolean>>({});
  const [confettiKey, setConfettiKey] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const cardioIntervals = useRef<Record<number, ReturnType<typeof setInterval> | null>>({});
  const cardioLocationSubs = useRef<Record<number, Location.LocationSubscription | null>>({});
  const cardioLocationInit = useRef<Set<number>>(new Set());
  const date = route.params.date;
  const screenWidth = Dimensions.get('window').width;

  console.log('Inside of CardioDetailScreen')

  const headerTitle = useMemo(() => {
    if (workouts.length === 1) return workouts[0]?.name ?? 'Cardio';
    if (workouts.length > 1) return `Cardio (${workouts.length})`;
    return 'Cardio';
  }, [workouts]);

  const loadWorkouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts?date=${date}`);
      if (!response.ok) {
        Alert.alert('Kunde inte ladda pass', 'Kontrollera att API:t är igång.');
        setWorkouts([]);
        return;
      }
      const data: WorkoutResponse[] = await response.json();
      const loaded = data.map(d => d.workout);
      setWorkouts(loaded);
    } catch (error) {
      Alert.alert('Nätverksfel', 'Kunde inte hämta pass.');
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkouts();
    }, [loadWorkouts])
  );

  useEffect(() => {
    setCardioDrafts(prev => {
      let next = { ...prev };
      let updated = false;

      workouts.forEach(workout => {
        const workoutId = workout.id;
        if (!workoutId) return;
        if (!next[workoutId]) {
          next[workoutId] = {
            timeMinutes: workout.cardioTimeMinutes != null ? String(workout.cardioTimeMinutes) : '',
            distanceKm: workout.cardioDistanceKm != null ? String(workout.cardioDistanceKm) : '',
            calories: workout.cardioCalories != null ? String(workout.cardioCalories) : '',
            elapsedSeconds: 0,
            isRunning: false,
            route: [],
            distanceMeters: 0,
          };
          updated = true;
        }
      });

      return updated ? next : prev;
    });
  }, [workouts]);

  useEffect(() => {
    Object.entries(cardioDrafts).forEach(([id, draft]) => {
      const workoutId = Number(id);
      if (cardioLocationInit.current.has(workoutId)) return;
      if ((draft?.route ?? []).length > 0 || draft?.mapRegion) return;
      cardioLocationInit.current.add(workoutId);

      (async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        try {
          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const region = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          };
          setCardioDrafts(prev => {
            const existing = prev[workoutId];
            if (!existing || existing.mapRegion) return prev;
            return {
              ...prev,
              [workoutId]: {
                ...existing,
                mapRegion: region,
              },
            };
          });
        } catch (error) {
          // ignore
        }
      })();
    });
  }, [cardioDrafts]);

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
      Object.values(cardioLocationSubs.current).forEach(subscription => {
        if (subscription) subscription.remove();
      });
      cardioLocationSubs.current = {};
    };
  }, [cardioDrafts]);

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
        route: prev[workoutId]?.route ?? [],
        distanceMeters: prev[workoutId]?.distanceMeters ?? 0,
        mapRegion: prev[workoutId]?.mapRegion,
        ...next,
      },
    }));
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const calculateDistanceMeters = (from: Coordinate, to: Coordinate) => {
    const earthRadius = 6371000;
    const dLat = toRadians(to.latitude - from.latitude);
    const dLon = toRadians(to.longitude - from.longitude);
    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const stopLocationTracking = (workoutId: number) => {
    const subscription = cardioLocationSubs.current[workoutId];
    if (subscription) {
      subscription.remove();
      cardioLocationSubs.current[workoutId] = null;
    }
  };

  const startCardioTimer = async (workoutId: number) => {
    const current = cardioDrafts[workoutId];
    if (current?.isRunning) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ingen platsåtkomst', 'Tillåt platsåtkomst för att spåra din rutt.');
      return;
    }

    try {
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const initialCoord = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
      };

      setCardioDrafts(prev => {
        const existing = prev[workoutId];
        if (!existing) return prev;
        const route = existing.route ?? [];
        const nextRoute = route.length === 0 ? [initialCoord] : route;
        return {
          ...prev,
          [workoutId]: {
            ...existing,
            route: nextRoute,
            isRunning: true,
            mapRegion: {
              latitude: initialCoord.latitude,
              longitude: initialCoord.longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            },
          },
        };
      });

      cardioLocationSubs.current[workoutId] = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 5,
        },
        location => {
          const nextCoord = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          setCardioDrafts(prev => {
            const existing = prev[workoutId];
            if (!existing) return prev;
            const route = existing.route ?? [];
            const last = route[route.length - 1];
            const added = last ? calculateDistanceMeters(last, nextCoord) : 0;
            const distanceMeters = (existing.distanceMeters ?? 0) + added;
            const distanceKm = distanceMeters > 0 ? (distanceMeters / 1000).toFixed(2) : '';
            return {
              ...prev,
              [workoutId]: {
                ...existing,
                route: [...route, nextCoord],
                distanceMeters,
                distanceKm,
              },
            };
          });
        }
      );
    } catch (error) {
      Alert.alert('Kunde inte starta GPS', 'Kontrollera platsbehörigheter och prova igen.');
    }
  };

  const pauseCardioTimer = (workoutId: number) => {
    stopLocationTracking(workoutId);
    handleCardioDraftChange(workoutId, { isRunning: false });
  };

  const toggleCardioTimer = (workoutId: number) => {
    const current = cardioDrafts[workoutId];
    if (current?.isRunning) {
      pauseCardioTimer(workoutId);
    } else {
      void startCardioTimer(workoutId);
    }
  };

  const stopCardioTimer = (workoutId: number) => {
    stopLocationTracking(workoutId);
    const current = cardioDrafts[workoutId];
    if (!current) return;
    const elapsedSeconds = current.elapsedSeconds ?? 0;
    const minutes = elapsedSeconds > 0 ? (elapsedSeconds / 60).toFixed(2) : '';
    const nextValues = {
      timeMinutes: minutes,
      distanceKm: current.distanceKm,
      calories: current.calories,
    };

    setCardioDrafts(prev => {
      const existing = prev[workoutId];
      if (!existing) return prev;
      return {
        ...prev,
        [workoutId]: {
          ...existing,
          timeMinutes: minutes,
          elapsedSeconds: 0,
          isRunning: false,
        },
      };
    });

    void submitCardioValues(workoutId, nextValues, true);
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

  const submitCardioValues = async (
    workoutId: number,
    values: { timeMinutes: string; distanceKm: string; calories: string },
    notify = false
  ) => {
    const timeMinutes = parseOptionalNumber(values.timeMinutes, 'Tid');
    if (timeMinutes === undefined) return;
    const distanceKm = parseOptionalNumber(values.distanceKm, 'Kilometer');
    if (distanceKm === undefined) return;
    const calories = parseOptionalNumber(values.calories, 'Kalorier', true);
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
      if (notify) {
        Alert.alert('Cardio sparat', 'Din cardio är uppdaterad.');
      }
    } catch (error) {
      Alert.alert('Kunde inte spara cardio', 'Kontrollera att API:t är igång.');
    } finally {
      handleCardioDraftChange(workoutId, { isSaving: false });
    }
  };

  const submitCardio = async (workoutId: number) => {
    const draft = cardioDrafts[workoutId];
    if (!draft) return;
    await submitCardioValues(workoutId, {
      timeMinutes: draft.timeMinutes,
      distanceKm: draft.distanceKm,
      calories: draft.calories,
    }, true);
  };

  const markWorkoutCompleted = async (workoutId: number) => {
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
      setShowConfetti(true);
      setConfettiKey(prev => prev + 1);
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error) {
      Alert.alert('Nätverksfel', 'Kunde inte markera pass som klart.');
    } finally {
      setCompletingWorkouts(prev => ({ ...prev, [workoutId]: false }));
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      {showConfetti ? (
        <View style={styles.confettiContainer} pointerEvents="none">
          <ConfettiCannon
            key={confettiKey}
            count={100}
            origin={{ x: screenWidth / 2, y: -10 }}
            autoStart
            fadeOut
          />
        </View>
      ) : null}
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitle}</Text>
        <Text style={styles.subtitle}>{date}</Text>
      </View>
      <ScrollView style={styles.content}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#14B8A6" />
          </View>
        ) : workouts.length === 0 ? (
          <Text style={styles.helper}>Inga cardio-pass denna dag.</Text>
        ) : (
          workouts.map(workout => {
            const workoutId = workout.id;
            const cardioDraft = workoutId ? cardioDrafts[workoutId] : undefined;
            const isCompleting = workoutId ? completingWorkouts[workoutId] : false;

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
                      <View>
                        <Text style={styles.timerValue}>
                          {formatElapsed(cardioDraft?.elapsedSeconds ?? 0)}
                        </Text>
                        <Text style={styles.timerDistance}>
                          {cardioDraft?.distanceKm ? `${cardioDraft.distanceKm} km` : '0.00 km'}
                        </Text>
                      </View>
                      <View style={styles.timerActions}>
                        <Pressable
                          style={[styles.timerIconButton, cardioDraft?.isRunning && styles.timerIconButtonActive]}
                          onPress={() => toggleCardioTimer(workoutId)}
                        >
                          <Ionicons
                            name={cardioDraft?.isRunning ? 'pause' : 'play'}
                            size={18}
                            color={cardioDraft?.isRunning ? '#FFFFFF' : '#0F172A'}
                          />
                        </Pressable>
                        <Pressable
                          style={[styles.timerIconButton, styles.timerIconButtonStop]}
                          onPress={() => stopCardioTimer(workoutId)}
                        >
                          <Ionicons name="stop" size={18} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.mapContainer}>
                      <MapView
                        style={styles.map}
                        showsUserLocation
                        initialRegion={
                          cardioDraft?.route && cardioDraft.route.length > 0
                            ? {
                              latitude: cardioDraft.route[cardioDraft.route.length - 1].latitude,
                              longitude: cardioDraft.route[cardioDraft.route.length - 1].longitude,
                              latitudeDelta: 0.002,
                              longitudeDelta: 0.002,
                            }
                            : cardioDraft?.mapRegion ?? {
                              latitude: 59.3293,
                              longitude: 18.0686,
                              latitudeDelta: 0.05,
                              longitudeDelta: 0.05,
                            }
                        }
                        region={
                          cardioDraft?.route && cardioDraft.route.length > 0
                            ? {
                              latitude: cardioDraft.route[cardioDraft.route.length - 1].latitude,
                              longitude: cardioDraft.route[cardioDraft.route.length - 1].longitude,
                              latitudeDelta: 0.002,
                              longitudeDelta: 0.002,
                            }
                            : cardioDraft?.mapRegion
                        }
                      >
                        {cardioDraft?.route && cardioDraft.route.length > 1 ? (
                          <Polyline coordinates={cardioDraft.route} strokeColor="#0D9488" strokeWidth={4} />
                        ) : null}
                      </MapView>
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
                      style={[styles.saveButton, cardioDraft?.isSaving && styles.saveButtonDisabled]}
                      onPress={() => submitCardio(workoutId)}
                      disabled={cardioDraft?.isSaving}
                    >
                      {cardioDraft?.isSaving ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>Spara cardio</Text>
                      )}
                    </Pressable>
                  </View>
                ) : null}
                <Pressable
                  style={[
                    styles.completeButton,
                    workout.completed && styles.completeButtonDone,
                    isCompleting && styles.completeButtonDisabled,
                  ]}
                  onPress={() => workoutId && markWorkoutCompleted(workoutId)}
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
    alignItems: 'center',
  },
  helper: {
    marginTop: 20,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  workoutCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  workoutNotes: {
    marginBottom: 12,
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
    paddingTop: 11,
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
  mapContainer: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  map: {
    height: 320,
    width: '100%',
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
  timerDistance: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  timerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  timerIconButtonActive: {
    backgroundColor: '#14B8A6',
  },
  timerIconButtonStop: {
    backgroundColor: '#0D9488',
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  completeButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#14B8A6',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  completeButtonDone: {
    backgroundColor: '#10B981',
  },
  completeButtonTextDone: {
    color: '#FFFFFF',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
});
