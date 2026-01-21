import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import '../config/calendarLocale'; 


export default function CalendarScreen() {
  const workoutDates = ['2026-01-21', '2026-01-27'];

  const markedDates = useMemo(() => {
    return workoutDates.reduce<Record<string, any>>((acc, date) => {
      acc[date] = { marked: true, dotColor: '#14B8A6' };
      return acc;
    }, {});
  }, []);

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
          console.log(day.dateString);
        }}
        theme={{
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
    backgroundColor: '#fff',
  },
  calendar: {
  },
});
