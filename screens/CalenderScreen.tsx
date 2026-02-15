import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Alert, StyleSheet, View, Text, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import '../config/calendarLocale';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../navigations/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { toLocalDateString } from '../utils/date';
import { getApiBaseUrl } from '../config/apiConfig';

type CalenderNav = BottomTabNavigationProp<RootTabParamList, "CalenderScreen">;

export default function CalendarScreen() {
  const navigation = useNavigation<CalenderNav>();
  const insets = useSafeAreaInsets();
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [workoutByDate, setWorkoutByDate] = useState<Record<string, number>>({});
  const [workoutStatusByDate, setWorkoutStatusByDate] = useState<Record<string, { total: number; completed: number }>>({});
  const [workoutIsCardioByDate, setWorkoutIsCardioByDate] = useState<Record<string, boolean>>({});
  const apiBaseUrl = getApiBaseUrl();

  const fetchWorkouts = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
      if (!response.ok) return;
      const data: { workout?: { id?: number; workoutDate?: string; completed?: boolean; deleted?: boolean; exercises?: { name: string }[] } }[] = await response.json();

      const entries = data
        .map(item => item?.workout)
        .filter((workout): workout is { id: number; workoutDate: string; completed?: boolean; deleted?: boolean; exercises?: { name: string }[] } => Boolean(workout?.id && workout?.workoutDate) && !workout?.deleted)
        .map(workout => ({
          id: workout.id,
          date: toLocalDateString(workout.workoutDate),
          completed: Boolean(workout.completed),
          isCardioOnly: (workout.exercises ?? []).length === 0,
        }));

      const dates = entries.map(entry => entry.date);
      const mapByDate = entries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.date] = entry.id;
        return acc;
      }, {});
      const statusByDate = entries.reduce<Record<string, { total: number; completed: number }>>((acc, entry) => {
        const current = acc[entry.date] ?? { total: 0, completed: 0 };
        acc[entry.date] = {
          total: current.total + 1,
          completed: current.completed + (entry.completed ? 1 : 0),
        };
        return acc;
      }, {});
      const cardioByDate = entries.reduce<Record<string, boolean>>((acc, entry) => {
        acc[entry.date] = entry.isCardioOnly;
        return acc;
      }, {});

      setWorkoutDates(Array.from(new Set(dates)));
      setWorkoutByDate(mapByDate);
      setWorkoutStatusByDate(statusByDate);
      setWorkoutIsCardioByDate(cardioByDate);
    } catch (error) {
      setWorkoutDates([]);
      setWorkoutByDate({});
      setWorkoutStatusByDate({});
      setWorkoutIsCardioByDate({});
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts])
  );

  const handleDeleteWorkout = useCallback(
    (dateString: string) => {
      const workoutId = workoutByDate[dateString];
      if (!workoutId) return;

      Alert.alert(
        'Ta bort pass',
        'Vill du ta bort passet för det här datumet?',
        [
          { text: 'Avbryt', style: 'cancel' },
          {
            text: 'Ta bort',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await fetch(`${apiBaseUrl}/Workout/Workouts/${workoutId}/Delete`, {
                  method: 'PUT',
                });
                if (!response.ok) {
                  const message = await response.text();
                  Alert.alert('Kunde inte ta bort pass', message || 'Något gick fel.');
                  return;
                }
                setWorkoutDates(prev => prev.filter(date => date !== dateString));
                setWorkoutByDate(prev => {
                  const next = { ...prev };
                  delete next[dateString];
                  return next;
                });
                await fetchWorkouts();
              } catch (error) {
                Alert.alert('Kunde inte ta bort pass', 'Kontrollera att API:t är igång.');
              }
            },
          },
        ]
      );
    },
    [apiBaseUrl, fetchWorkouts, workoutByDate]
  );

  const markedDates = useMemo(() => {
    return workoutDates.reduce<Record<string, any>>((acc, date) => {
      const status = workoutStatusByDate[date];
      const isCompleted = status ? status.completed === status.total : false;
      acc[date] = {
        marked: true,
        dotColor: isCompleted ? '#22C55E' : '#14B8A6',
      };
      return acc;
    }, {});
  }, [workoutDates, workoutStatusByDate]);

  const handleDayPress = useCallback(
    (dateString: string) => {
      if (workoutDates.includes(dateString)) {
        const workoutId = workoutByDate[dateString];
        const isCardioOnly = workoutIsCardioByDate[dateString];
        if (isCardioOnly) {
          navigation.navigate('CardioDetailScreen', { date: dateString, workoutId });
        } else {
          navigation.navigate('WorkoutDetailScreen', { date: dateString, workoutId });
        }
        return;
      }
      navigation.navigate('CreateWorkoutScreen', { date: dateString });
    },
    [navigation, workoutDates, workoutByDate, workoutIsCardioByDate]
  );

  const handleDayLongPress = useCallback(
    (dateString: string) => {
      if (workoutDates.includes(dateString)) {
        handleDeleteWorkout(dateString);
      }
    },
    [handleDeleteWorkout, workoutDates]
  );

  return (
    <ImageBackground
      source={require("../assets/background_1.png")}
      style={styles.bg}
      resizeMode='cover'
    >
      <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
        <CalendarList
          firstDay={1}
          horizontal
          pagingEnabled               // 👈 snap per månad
          markedDates={markedDates}
          pastScrollRange={12}
          futureScrollRange={12}
          showScrollIndicator={false}
          dayComponent={({ date, state }) => {
            const dateString = date?.dateString;
            const status = dateString ? workoutStatusByDate[dateString] : undefined;
            const isCompleted = status ? status.completed === status.total : false;
            const isWorkout = dateString ? workoutDates.includes(dateString) : false;
            const isDisabled = state === 'disabled';
            const isToday = state === 'today';

            return (
              <Pressable
                style={styles.dayCell}
                onPress={() => dateString && handleDayPress(dateString)}
                onLongPress={() => dateString && handleDayLongPress(dateString)}
                disabled={!dateString}
              >
                <Text
                  style={[
                    styles.dayText,
                    isDisabled && styles.dayTextDisabled,
                    isToday && styles.dayTextToday,
                  ]}
                >
                  {date?.day}
                </Text>
                {isWorkout && !isCompleted ? <View style={styles.dayDot} /> : null}
                {isCompleted ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedBadgeText}>✓</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          }}
          theme={{
            calendarBackground: 'transparent',
            textSectionTitleColor: '#64748B',
            dayTextColor: '#334155',
            monthTextColor: '#334155',
            todayTextColor: '#14B8A6',
            arrowColor: '#14B8A6',
            dotColor: '#14B8A6',
          }}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center'
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  dayText: {
    color: '#334155',
  },
  dayTextDisabled: {
    color: '#CBD5F5',
  },
  dayTextToday: {
    color: '#14B8A6',
    fontWeight: '600',
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#14B8A6',
    marginTop: 2,
  },
  completedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  bg: {
    flex: 1
  }
});
