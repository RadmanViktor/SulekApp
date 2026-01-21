import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Tab = createBottomTabNavigator();

export default function HomeScreen(){

    // TODO!
    // Hämta data om dagens pass här
    // Kunna starta pass direkt från hemskärmen

    const goals = {
        weeklyWorkoutGoal: 3,
    };

    let todaysWorkout = {
        name: "Push-pull-pass",
        exercises: ["Bänkpress", "Marklyft", "Chins"]
    };
    let intoText = () => {
        return (
            <Text style={style.introText}>{todaysWorkout != null ? 
                `Idag står det ${todaysWorkout.name} på schemat! 💪` 
                : "Inga pass inbokade idag" }</Text>
        );
    };
    return(
        <View style={style.wrapper}>
            <View>
                {intoText()}
            </View>
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
  },
  introText: {
    padding: 20,
    textAlign: 'center',
    color: '#374151',
    fontSize: 24,
    fontFamily: 'Poppins_400Regular',
  }
});