import React, { useMemo } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import '../config/calendarLocale'; 
import { useNavigation } from '@react-navigation/native';
import { RootTabParamList } from '../navigations/types';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileButton from '../components/ProfileButton';

type CalenderNav = BottomTabNavigationProp<RootTabParamList, "CalenderScreen">;

export default function CalendarScreen() {
  const navigation = useNavigation<CalenderNav>();
  const insets = useSafeAreaInsets();
  const workoutDates = ['2026-01-21', '2026-01-27'];

  const markedDates = useMemo(() => {
    return workoutDates.reduce<Record<string, any>>((acc, date) => {
      acc[date] = { marked: true, dotColor: '#14B8A6' };
      return acc;
    }, {});
  }, []);

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right']}>
      <Pressable
        style={[styles.progressButton, { top: insets.top + 12 }]}
        onPress={() => navigation.navigate('ProgressScreen')}
      >
        <Ionicons name="stats-chart" size={22} color="#0F172A" />
      </Pressable>
      <ProfileButton onPress={() => navigation.navigate('ProfileScreen')} />
      <CalendarList
        firstDay={1}
        horizontal
        pagingEnabled               // 👈 snap per månad
        markedDates={markedDates}
        pastScrollRange={12}
        futureScrollRange={12}
        showScrollIndicator={false}
        onDayPress={(day) => navigation.navigate("CreateWorkoutScreen", {date: day.dateString})} 
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
  },
  progressButton: {
    position: 'absolute',
    right: 74,
    zIndex: 10,
    elevation: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendar: {
  },
});
