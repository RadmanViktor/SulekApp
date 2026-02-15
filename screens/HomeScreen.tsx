import { View, Text, StyleSheet, Pressable, ImageBackground } from "react-native";
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';
import ProfileButton from '../components/ProfileButton';
import { toLocalDateString } from '../utils/date';
import { getApiBaseUrl } from '../config/apiConfig';

type HomeNav = BottomTabNavigationProp<RootTabParamList, 'HomeScreen'>;

type WorkoutSummary = {
  id: number;
  name: string;
  workoutDate: string;
  completed?: boolean;
  exercises?: { name: string }[];
};

export default function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const [todaysWorkout, setTodaysWorkout] = useState<WorkoutSummary | null>(null);
  const [nextWorkout, setNextWorkout] = useState<{ name: string; workoutDate: string } | null>(null);
  const apiBaseUrl = getApiBaseUrl();
  const todayDate = toLocalDateString(new Date());

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function fetchTodaysWorkout() {
        try {
          const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
          if (!response.ok) return;
          const data: { workout?: { id?: number; name?: string; workoutDate?: string; completed?: boolean; deleted?: boolean; exercises?: { name: string }[] } }[] = await response.json();
          const workout = data
            .map(item => item.workout)
            .find(item => {
              if (!item?.workoutDate || item?.deleted) return false;
              const dateOnly = toLocalDateString(item.workoutDate);
              return dateOnly === todayDate;
            });

          const upcomingWorkout = data
            .map(item => item.workout)
            .filter(item => item?.workoutDate && !item?.deleted)
            .map(item => {
              const dateOnly = toLocalDateString(item!.workoutDate!);
              return {
                name: item!.name ?? 'Pass',
                workoutDate: dateOnly,
                completed: item!.completed,
              };
            })
            .filter(item => item.workoutDate > todayDate && !item.completed)
            .sort((a, b) => (a.workoutDate > b.workoutDate ? 1 : -1))[0] ?? null;

          if (!isActive) return;
          setTodaysWorkout(
            workout?.id && workout.name && workout.workoutDate
              ? {
                id: workout.id,
                name: workout.name,
                workoutDate: workout.workoutDate,
                completed: workout.completed,
                exercises: workout.exercises ?? []
              }
              : null
          );
          setNextWorkout(upcomingWorkout);
        } catch (error) {
          if (!isActive) return;
          setTodaysWorkout(null);
          setNextWorkout(null);
        }
      }

      fetchTodaysWorkout();

      return () => {
        isActive = false;
      };
    }, [apiBaseUrl, todayDate])
  );
  const isCompletedWithNoNext = todaysWorkout?.completed && !nextWorkout;
  let intoText = () => {
    // Inga pass registrerade
    if (!todaysWorkout && !nextWorkout) {
      return (<Text style={style.introText}>Du har inget pass registrerat. Vill du skapa ett direkt?</Text>)
    }

    // Dagen pass 
    if (todaysWorkout && !todaysWorkout.completed) {
      return (<Text style={style.introText}>Idag står det {todaysWorkout.name} på schemat! 💪</Text>)
    }

    // Dagens pass är klart och inget mer inplanerat
    if (isCompletedWithNoNext) {
      return (<Text style={style.introText}>Dagens pass är avklarat! Inga fler pass inplanerade. Vill du skapa ett nytt pass?</Text>)
    }

    // Inget pass idag men ett pass i framtiden finns 
    if ((!todaysWorkout || todaysWorkout.completed) && nextWorkout) {
      return (<Text style={style.introText}>Ditt nästa inplanerade träningspass är {nextWorkout.name} ({nextWorkout.workoutDate})</Text>)
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.png")}
      style={style.bg}
      resizeMode="cover">
      <View style={style.wrapper}>
        <ProfileButton onPress={() => navigation.navigate('ProfileScreen')} />
        <View>
          {intoText()}
        </View>
        {todaysWorkout && !todaysWorkout.completed ? (
          <Pressable
            style={style.quickButton}
            onPress={() => {
              const isCardioOnly = (todaysWorkout.exercises ?? []).length === 0;
              if (isCardioOnly) {
                navigation.navigate('CardioDetailScreen', { date: todayDate, workoutId: todaysWorkout.id });
              } else {
                navigation.navigate('WorkoutDetailScreen', { date: todayDate, workoutId: todaysWorkout.id });
              }
            }}
          >
            <Text style={style.quickButtonText}>Visa pass</Text>
          </Pressable>
        ) : !nextWorkout ? (
          <Pressable
            style={style.quickButtonSecondary}
            onPress={() => navigation.navigate('CreateWorkoutScreen', { date: todayDate })}
          >
            <Text style={style.quickButtonSecondaryText}>Skapa pass</Text>
          </Pressable>
        ) : null}
      </View>
    </ImageBackground>
  );
}

const style = StyleSheet.create({
  bg: {
    flex: 1
  },
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  introText: {
    padding: 20,
    textAlign: 'center',
    color: '#374151',
    fontSize: 24,
    fontFamily: 'Poppins_400Regular',
  },
  quickButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#14B8A6',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  quickButtonSecondary: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#14B8A6',
    backgroundColor: 'transparent',
  },
  quickButtonSecondaryText: {
    color: '#14B8A6',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
});
