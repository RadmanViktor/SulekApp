import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';

import HomeScreen from './screens/HomeScreen';
import CreateWorkoutScreen from './screens/CreateWorkoutScreen';
import CalenderScreen from './screens/CalenderScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProgressScreen from './screens/ProgressScreen';
import WorkoutDetailScreen from './screens/WorkoutDetailScreen';
import CardioDetailScreen from './screens/CardioDetailScreen';
import AuthScreen from './screens/AuthScreen';
import { RootTabParamList } from './navigations/types';
import AnimatedTabButton from './components/AnimatedTabButton';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#14B8A6',
        tabBarShowLabel: false,

        tabBarStyle: {
          height: 88,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },

        tabBarItemStyle: {
          paddingVertical: 6,
          flex: 1,
        },

        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
        },

        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, size, color }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'HomeScreen') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CreateWorkoutScreen') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'CalenderScreen') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'ProgressScreen') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size + 4} color={color} />;
        },
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
      })}
    >
      <Tab.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'Hem' }} />
      <Tab.Screen
        name="CreateWorkoutScreen"
        component={CreateWorkoutScreen}
        options={{
          title: 'Nytt',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="CalenderScreen" component={CalenderScreen} options={{ title: 'Kalender' }} />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="ProgressScreen"
        component={ProgressScreen}
        options={{
          title: 'Progress',
        }}
      />
      <Tab.Screen
        name="WorkoutDetailScreen"
        component={WorkoutDetailScreen}
        options={{
          title: 'Passdetaljer',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="CardioDetailScreen"
        component={CardioDetailScreen}
        options={{
          title: 'Cardio',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { token, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#14B8A6" />
      </View>
    );
  }

  if (!token) {
    return <AuthScreen />;
  }

  return (
    <NavigationContainer>
      <AppTabs />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
