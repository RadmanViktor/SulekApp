import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Modal } from 'react-native';
import Svg, { Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import Dropdown from '../components/Dropdown';
import { useFocusEffect } from '@react-navigation/native';
type ExerciseItem = { id: number; name: string };
type ProgressEntry = {
  workoutId: number;
  workoutName: string;
  workoutDate: string;
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
  const [monthlyWorkoutCount, setMonthlyWorkoutCount] = useState(0);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState(false);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [graphMetric, setGraphMetric] = useState<'weight' | 'reps' | 'repsAtMaxWeight'>('weight');
  const milestoneEmoji = useMemo(() => {
    if (monthlyWorkoutCount >= 200) return '👑';
    if (monthlyWorkoutCount >= 150) return '🏆';
    if (monthlyWorkoutCount >= 100) return '🔥';
    if (monthlyWorkoutCount >= 50) return '💪';
    return '';
  }, [monthlyWorkoutCount]);

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

  const graphData = useMemo(() => {
    if (progressEntries.length === 0) return [];
    const dateMap = new Map<string, ProgressEntry[]>();

    progressEntries.forEach(entry => {
      const rawDate = entry.workoutDate ?? entry.workoutCreated;
      const date = new Date(rawDate).toISOString().split('T')[0];
      const list = dateMap.get(date) ?? [];
      list.push(entry);
      dateMap.set(date, list);
    });

    const entries = Array.from(dateMap.entries()).map(([date, items]) => {
      if (graphMetric === 'reps') {
        const maxReps = Math.max(...items.map(item => item.reps), 0);
        return { date, value: maxReps };
      }

      if (graphMetric === 'repsAtMaxWeight') {
        const maxWeight = Math.max(...items.map(item => item.weightKg ?? 0), 0);
        const repsAtMaxWeight = Math.max(
          ...items.filter(item => (item.weightKg ?? 0) === maxWeight).map(item => item.reps),
          0
        );
        return { date, value: repsAtMaxWeight };
      }

      const maxWeight = Math.max(...items.map(item => item.weightKg ?? 0), 0);
      return { date, value: maxWeight };
    });

    return entries.sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [progressEntries, graphMetric]);

  const maxGraphWeight = useMemo(
    () => Math.max(0, ...graphData.map(entry => entry.value)),
    [graphData]
  );

  const graphLayout = useMemo(() => {
    const chartHeight = 120;
    const chartPadding = 10;
    const chartStep = 56;
    const safeMax = maxGraphWeight > 0 ? maxGraphWeight : 1;

    const points = graphData.map((entry, index) => {
      const x = chartPadding + index * chartStep;
      const y = chartPadding + (chartHeight - chartPadding * 2) * (1 - entry.value / safeMax);
      return { x, y, date: entry.date };
    });

    const width = Math.max(260, chartPadding * 2 + chartStep * Math.max(1, graphData.length - 1));
    return {
      chartHeight,
      chartPadding,
      chartStep,
      width,
      points,
      line: points.map(point => `${point.x},${point.y}`).join(' '),
    };
  }, [graphData, maxGraphWeight]);

  const graphUnit = useMemo(() => {
    if (graphMetric === 'weight') return 'kg';
    return 'reps';
  }, [graphMetric]);

  const formatSwedishDate = useCallback((value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('sv-SE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }, []);

  const fetchMonthlyCount = useCallback(async () => {
    setIsLoadingMonthly(true);
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
      if (!response.ok) return;
      const data: { workout?: { workoutDate?: string } }[] = await response.json();
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const count = data
        .map(item => item.workout)
        .filter((workout): workout is { workoutDate?: string; completed?: boolean } => Boolean(workout?.workoutDate))
        .filter(workout => {
          const date = new Date(workout.workoutDate!);
          return date.getMonth() === month && date.getFullYear() === year;
        })
        .filter(workout => workout.completed).length;
      setMonthlyWorkoutCount(count);
    } catch (error) {
      setMonthlyWorkoutCount(0);
    } finally {
      setIsLoadingMonthly(false);
    }
  }, []);

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
      fetchMonthlyCount();
    }, [fetchMonthlyCount])
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
          <View style={styles.monthCard}>
            {isLoadingMonthly ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <Text style={styles.monthLabel}>Genomförda pass</Text>
                <Text
                  style={[
                    styles.monthValue,
                    monthlyWorkoutCount >= 10 && styles.monthValueGoal,
                  ]}
                >
                  {monthlyWorkoutCount} pass
                  {milestoneEmoji ? ` ${milestoneEmoji}` : ''}
                </Text>
              </>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <Dropdown
            label="Övning"
            placeholder={isLoadingExercises ? 'Hämtar övningar...' : 'Välj övning'}
            items={exercises.map(exercise => ({ data: exercise.name }))}
            singleSelect
            value={selectedExercises}
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
                  <Pressable
                    style={styles.graphButton}
                    onPress={() => setIsGraphOpen(true)}
                    disabled={progressEntries.length === 0}
                  >
                    <Text style={styles.graphButtonText}>Visa graf</Text>
                  </Pressable>
                </View>
              ) : null}
              {progressEntries.length === 0 ? (
                <Text style={styles.helper}>Inga set registrerade ännu.</Text>
              ) : (
                progressEntries.map(entry => (
                  <View key={`${activeExercise}-${entry.workoutId}-${entry.setNum}`} style={styles.card}>
                    <Text style={styles.cardDate}>
                      {formatSwedishDate(entry.workoutDate ?? entry.workoutCreated)} • {entry.workoutName}
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
      <Modal visible={isGraphOpen} transparent animationType="fade" onRequestClose={() => setIsGraphOpen(false)}>
        <Pressable style={styles.graphBackdrop} onPress={() => setIsGraphOpen(false)}>
          <Pressable style={styles.graphModal} onPress={() => null}>
            <Text style={styles.graphTitle}>{activeExercise} • {graphMetric === 'weight' ? 'Maxvikt' : graphMetric === 'reps' ? 'Max reps' : 'Reps vid maxvikt'}</Text>
            <View style={styles.graphToggle}>
              <Pressable
                style={[styles.graphToggleButton, graphMetric === 'weight' && styles.graphToggleButtonActive]}
                onPress={() => setGraphMetric('weight')}
              >
                <Text style={[styles.graphToggleText, graphMetric === 'weight' && styles.graphToggleTextActive]}>Maxvikt</Text>
              </Pressable>
              <Pressable
                style={[styles.graphToggleButton, graphMetric === 'reps' && styles.graphToggleButtonActive]}
                onPress={() => setGraphMetric('reps')}
              >
                <Text style={[styles.graphToggleText, graphMetric === 'reps' && styles.graphToggleTextActive]}>Max reps</Text>
              </Pressable>
              <Pressable
                style={[styles.graphToggleButton, graphMetric === 'repsAtMaxWeight' && styles.graphToggleButtonActive]}
                onPress={() => setGraphMetric('repsAtMaxWeight')}
              >
                <Text style={[styles.graphToggleText, graphMetric === 'repsAtMaxWeight' && styles.graphToggleTextActive]}>Reps vid max</Text>
              </Pressable>
            </View>
            {graphData.length === 0 ? (
              <Text style={styles.helper}>Inga set registrerade ännu.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.graphChart, { width: graphLayout.width }]}
                >
                  <Svg width={graphLayout.width} height={graphLayout.chartHeight}>
                    <Polyline
                      points={graphLayout.line}
                      fill="none"
                      stroke="#14B8A6"
                      strokeWidth="3"
                    />
                    {graphLayout.points.map(point => (
                      <Circle
                        key={point.date}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill="#14B8A6"
                      />
                    ))}
                    {graphLayout.points.map((point, index) => (
                      <SvgText
                        key={`label-${point.date}`}
                        x={point.x}
                        y={Math.max(point.y - 8, 10)}
                        fontSize="10"
                        fill="#0F172A"
                        textAnchor="middle"
                      >
                        {Math.round(graphData[index]?.value ?? 0)} {graphUnit}
                      </SvgText>
                    ))}
                  </Svg>
                  <View style={[styles.graphLabelRow, { width: graphLayout.width }]}
                  >
                    {graphLayout.points.map(point => (
                      <Text key={point.date} style={[styles.graphLabel, { width: graphLayout.chartStep }]}
                      >
                        {formatSwedishDate(point.date)}
                      </Text>
                    ))}
                  </View>
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  monthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  monthLabel: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  monthValue: {
    marginTop: 8,
    fontSize: 24,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  monthValueGoal: {
    color: '#14B8A6',
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
  graphButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  graphButtonText: {
    color: '#0F172A',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  graphChart: {
    paddingTop: 8,
  },
  graphLabelRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  graphBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  graphModal: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  graphTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 12,
  },
  graphToggle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  graphToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#FFFFFF',
  },
  graphToggleButtonActive: {
    backgroundColor: '#14B8A6',
    borderColor: '#14B8A6',
  },
  graphToggleText: {
    fontSize: 12,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  graphToggleTextActive: {
    color: '#FFFFFF',
  },
  graphLabel: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
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
