import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useFonts, Poppins_400Regular } from '@expo-google-fonts/poppins';

import HomeScreen from './screens/HomeScreen';
import CreateWorkoutScreen from './screens/CreateWorkoutScreen';
import CalenderScreen from './screens/CalenderScreen';
import ProfileScreen from './screens/ProfileScreen';
import { RootTabParamList } from './navigations/types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarActiveTintColor: '#14B8A6',

            // TABBAR-STYLE
            tabBarStyle: {
              height: 88,              // ger bättre vertikal balans på iPhone med safe area
              paddingTop: 8,
              paddingBottom: 18,       // optiskt centrerat ovanför home indicator
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            },

            // ITEM-STYLE (centrering)
            tabBarItemStyle: {
              paddingVertical: 6,
            },

            // ICON/LABEL FINJUSTERING
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
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="HomeScreen" component={HomeScreen} options={{title: 'Hem'}}/>
          <Tab.Screen name="CreateWorkoutScreen" component={CreateWorkoutScreen} options={{ title: 'Nytt' }} />
          <Tab.Screen name="CalenderScreen" component={CalenderScreen} options={{ title: 'Kalender' }} />
          <Tab.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{
              title: 'Profil',
              tabBarButton: () => null,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
