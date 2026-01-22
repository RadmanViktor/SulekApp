import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';
import ProfileButton from '../components/ProfileButton';
import { toLocalDateString } from '../utils/date';

type HomeNav = BottomTabNavigationProp<RootTabParamList, 'HomeScreen'>;

export default function HomeScreen(){
    const navigation = useNavigation<HomeNav>();
    const [todaysWorkout, setTodaysWorkout] = useState<{ name: string; workoutDate: string; completed?: boolean } | null>(null);
    const [nextWorkout, setNextWorkout] = useState<{ name: string; workoutDate: string } | null>(null);
    const apiBaseUrl = 'http://localhost:5026';
    const todayDate = toLocalDateString(new Date());

    // TODO!
    // Hämta data om dagens pass här
    // Kunna starta pass direkt från hemskärmen

    const goals = {
        weeklyWorkoutGoal: 3,
    };

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            async function fetchTodaysWorkout() {
                try {
                    const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
                    if (!response.ok) return;
                    const data: { workout?: { name?: string; workoutDate?: string, completed?: boolean } }[] = await response.json();
                    const workout = data
                        .map(item => item.workout)
                        .find(item => {
                            if (!item?.workoutDate) return false;
                            const dateOnly = toLocalDateString(new Date(item.workoutDate));
                            return dateOnly === todayDate;
                        });

                    const upcomingWorkout = data
                        .map(item => item.workout)
                        .filter(item => item?.workoutDate)
                        .map(item => {
                            const dateOnly = toLocalDateString(new Date(item!.workoutDate!));
                            return {
                                name: item!.name ?? 'Pass',
                                workoutDate: dateOnly,
                            };
                        })
                        .filter(item => item.workoutDate > todayDate)
                        .sort((a, b) => (a.workoutDate > b.workoutDate ? 1 : -1))[0] ?? null;

                    if (!isActive) return;
                    setTodaysWorkout(
                        workout?.name && workout.workoutDate
                            ? { name: workout.name, workoutDate: workout.workoutDate, completed: workout.completed }
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
    let intoText = () => {
        return (
            <Text style={style.introText}>{todaysWorkout != null ? 
                todaysWorkout.completed
                    ? `Starkt jobbat idag! Nästa inplanerade träningspass är ${nextWorkout?.name ?? 'inte planerat'}${nextWorkout ? ` (${nextWorkout.workoutDate})` : ''}`
                    : `Idag står det ${todaysWorkout.name} på schemat! 💪`
                : "Inget pass registrerat idag. Vill du skapa ett direkt?" }</Text>
        );
    };
    return(
        <View style={style.wrapper}>
            <ProfileButton onPress={() => navigation.navigate('ProfileScreen')} />
            <View>
                {intoText()}
            </View>
            {todaysWorkout ? (
                <Pressable
                    style={style.quickButton}
                    onPress={() => navigation.navigate('WorkoutDetailScreen', { date: todaysWorkout.workoutDate.split('T')[0] })}
                >
                    <Text style={style.quickButtonText}>Visa pass</Text>
                </Pressable>
            ) : (
                <Pressable
                    style={style.quickButtonSecondary}
                    onPress={() => navigation.navigate('CreateWorkoutScreen', { date: todayDate })}
                >
                    <Text style={style.quickButtonSecondaryText}>Skapa pass</Text>
                </Pressable>
            )}
            <View style={style.container}>
                <Text style={style.regularText}>🔥 2 veckor i rad med minst {goals.weeklyWorkoutGoal} pass</Text>
            </View>
        </View>
    );
}

const style = StyleSheet.create({
  container: {
    paddingTop: '35%',
  },
  regularText: {
    fontSize: 16,
    color: '#374151',
    fontFamily: 'Poppins_400Regular',
  },
  wrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: '45%', // ← justera 25–35% efter känsla
    backgroundColor: '#F3F4F6',
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
