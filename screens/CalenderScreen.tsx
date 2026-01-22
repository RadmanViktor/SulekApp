import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import '../config/calendarLocale'; 
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../navigations/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { toLocalDateString } from '../utils/date';

type CalenderNav = BottomTabNavigationProp<RootTabParamList, "CalenderScreen">;

export default function CalendarScreen() {
  const navigation = useNavigation<CalenderNav>();
  const insets = useSafeAreaInsets();
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [workoutByDate, setWorkoutByDate] = useState<Record<string, number>>({});
  const apiBaseUrl = 'http://localhost:5026';

  const fetchWorkouts = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
      if (!response.ok) return;
      const data: { workout?: { id?: number; workoutDate?: string } }[] = await response.json();

      const entries = data
        .map(item => item?.workout)
        .filter((workout): workout is { id: number; workoutDate: string } => Boolean(workout?.id && workout?.workoutDate))
        .map(workout => ({
          id: workout.id,
          date: toLocalDateString(new Date(workout.workoutDate)),
        }));

      const dates = entries.map(entry => entry.date);
      const mapByDate = entries.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.date] = entry.id;
        return acc;
      }, {});

      setWorkoutDates(Array.from(new Set(dates)));
      setWorkoutByDate(mapByDate);
    } catch (error) {
      setWorkoutDates([]);
      setWorkoutByDate({});
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
      acc[date] = { marked: true, dotColor: '#14B8A6' };
      return acc;
    }, {});
  }, [workoutDates]);

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      <CalendarList
        firstDay={1}
        horizontal
        pagingEnabled               // 👈 snap per månad
        markedDates={markedDates}
        pastScrollRange={12}
        futureScrollRange={12}
        showScrollIndicator={false}
        onDayPress={(day) => {
          console.log('Selected day', day);
          if (workoutDates.includes(day.dateString)) {
            navigation.navigate('WorkoutDetailScreen', { date: day.dateString });
            return;
          }
          navigation.navigate('CreateWorkoutScreen', { date: day.dateString });
        }}
        onDayLongPress={(day) => {
          if (workoutDates.includes(day.dateString)) {
            handleDeleteWorkout(day.dateString);
          }
        }}
        theme={{
          backgroundColor: '#F3F4F6',
          calendarBackground: '#F3F4F6',
          textSectionTitleColor: '#64748B',
          dayTextColor: '#334155',
          monthTextColor: '#334155',
          todayTextColor: '#14B8A6',
          arrowColor: '#14B8A6',
          dotColor: '#14B8A6',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  }
});
