import React, { useMemo, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import '../config/calendarLocale'; 
import { useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../navigations/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type CalenderNav = BottomTabNavigationProp<RootTabParamList, "CalenderScreen">;

export default function CalendarScreen() {
  const navigation = useNavigation<CalenderNav>();
  const insets = useSafeAreaInsets();
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const apiBaseUrl = 'http://localhost:5026';

  useEffect(() => {
    let isMounted = true;

    async function fetchWorkouts() {
      try {
        const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
        if (!response.ok) return;
        const data: { workout?: { workoutDate?: string } }[] = await response.json();

        const dates = data
          .map(item => item?.workout?.workoutDate)
          .filter((workoutDate): workoutDate is string => Boolean(workoutDate))
          .map(workoutDate => new Date(workoutDate).toISOString().split('T')[0]);

        console.log('Fetched workout dates:', dates);
        if (!isMounted) return;
        setWorkoutDates(Array.from(new Set(dates)));
      } catch (error) {
        if (!isMounted) return;
        setWorkoutDates([]);
      }
    }

    fetchWorkouts();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

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
