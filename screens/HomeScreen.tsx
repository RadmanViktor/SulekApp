import { View, Text, StyleSheet, Pressable } from "react-native";
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../navigations/types';
import ProfileButton from '../components/ProfileButton';

type HomeNav = BottomTabNavigationProp<RootTabParamList, 'HomeScreen'>;

export default function HomeScreen(){
    const navigation = useNavigation<HomeNav>();
    const [todaysWorkout, setTodaysWorkout] = useState<{ name: string; workoutDate: string } | null>(null);
    const apiBaseUrl = 'http://localhost:5026';

    // TODO!
    // Hämta data om dagens pass här
    // Kunna starta pass direkt från hemskärmen

    const goals = {
        weeklyWorkoutGoal: 3,
    };

    useEffect(() => {
        let isMounted = true;

        async function fetchTodaysWorkout() {
            try {
                const response = await fetch(`${apiBaseUrl}/Workout/Workouts`);
                if (!response.ok) return;
                const data: { workout?: { name?: string; workoutDate?: string } }[] = await response.json();
                const today = new Date().toISOString().split('T')[0];

                const workout = data
                    .map(item => item.workout)
                    .find(item => {
                        if (!item?.workoutDate) return false;
                        const dateOnly = new Date(item.workoutDate).toISOString().split('T')[0];
                        return dateOnly === today;
                    });

                if (!isMounted) return;
                setTodaysWorkout(
                    workout?.name && workout.workoutDate
                        ? { name: workout.name, workoutDate: workout.workoutDate }
                        : null
                );
            } catch (error) {
                if (!isMounted) return;
                setTodaysWorkout(null);
            }
        }

        fetchTodaysWorkout();

        return () => {
            isMounted = false;
        };
    }, [apiBaseUrl]);
    let intoText = () => {
        return (
            <Text style={style.introText}>{todaysWorkout != null ? 
                `Idag står det ${todaysWorkout.name} på schemat! 💪` 
                : "Inget pass registrerat idag!" }</Text>
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
            ) : null}
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
});
