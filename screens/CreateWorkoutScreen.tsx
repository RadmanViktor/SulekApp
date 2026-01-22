import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Platform, StatusBar, Pressable, Alert, ActivityIndicator } from 'react-native';
import { DropItem } from '../components/Dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Dropdown from '../components/Dropdown';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootTabParamList } from '../navigations/types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type Props = BottomTabScreenProps<RootTabParamList, "CreateWorkoutScreen">;

export default function CreateWorkoutScreen({ route, navigation }: Props) {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(() => paramDate ?? new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);

  const apiBaseUrl = 'http://localhost:5026';

  const paramDate = useMemo(() => {
    const raw = route.params?.date;
    if (!raw) return null;

    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  }, [route.params?.date]);

  useEffect(() => {
    if (paramDate) setDate(paramDate);
  }, [paramDate]);

  useEffect(() => {
    let isMounted = true;

    async function fetchExercises() {
      setIsLoadingExercises(true);
      try {
        const response = await fetch(`${apiBaseUrl}/Exercise/Exercises`);
        if (!response.ok) return;
        const data: { id: number; name: string }[] = await response.json();
        if (!isMounted) return;
        setExercises(data);
      } catch (error) {
        if (!isMounted) return;
        setExercises([]);
      } finally {
        if (!isMounted) return;
        setIsLoadingExercises(false);
      }
    }

    fetchExercises();

    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl]);

  const handleCreateExercise = async (name: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/Exercise/CreateExercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte skapa ovning', message || 'Något gick fel.');
        return null;
      }

      const created: { id: number; name: string } = await response.json();
      setExercises(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      return { data: created.name };
    } catch (error) {
      Alert.alert('Kunde inte skapa ovning', 'Kontrollera att API:t är igång.');
      return null;
    }
  };

  const onChange = (_event: any, selectedDate?: Date) => {
    if (!selectedDate) return; // iOS kan skicka undefined vid cancel
    setDate(selectedDate);
  };

  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  async function handleSaveWorkout() {
    if (isSaving) return;
    setIsSaving(true);
    const exerciseIdMap = exercises.reduce<Record<string, number>>((acc, exercise) => {
      acc[exercise.name] = exercise.id;
      return acc;
    }, {});
    const workoutExerciseDtos = selectedExercises
      .map(exercise => exerciseIdMap[exercise])
      .filter(Boolean)
      .map(exerciceId => ({ exerciceId, workoutId: 0 }));

    const payload = {
      name: name.trim(),
      workoutDate: date.toISOString(),
      workoutExerciseDtos,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/Workout/CreateWorkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await response.text();
        Alert.alert('Kunde inte skapa pass', message || 'Något gick fel.');
        return;
      }

      Alert.alert('Pass skapat', 'Ditt träningspass är sparat.');
      setName('');
      setSelectedExercises([]);
    } catch (error) {
      Alert.alert('Kunde inte skapa pass', 'Kontrollera att API:t är igång.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
      <SafeAreaView style={{ flex: 1 }} edges={['right', 'left', 'top']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>Skapa nytt träningspass</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Passnamn</Text>
          <TextInput
            style={styles.input}
            placeholder="T.ex. Push-pull-pass"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputContainer}>
          <Dropdown
            label="Övningar"
            placeholder={isLoadingExercises ? "Hämtar övningar..." : "Välj övningar"}
            items={exercises.map(exercise => ({ data: exercise.name }))}
            value={selectedExercises}
            onCreateItem={handleCreateExercise}
            onChange={setSelectedExercises}        // få uppdateringar
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Välj datum för när du vill registrera passet</Text>
          <RNDateTimePicker locale="sv-SE"
            testID="dateTimePicker"
            value={date}
            is24Hour={true}
            onChange={onChange}
          />
        </View>

        <Pressable
          onPress={handleSaveWorkout}
          disabled={!name.trim() || selectedExercises.length === 0 || isSaving || isLoadingExercises}
          style={{ marginTop: 32 }}
        >
          <LinearGradient
            colors={['#14B8A6', '#0D9488']} // teal gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              (selectedExercises.length === 0 || name == '' || isSaving || isLoadingExercises) && styles.buttonDisabled,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Skapa pass</Text>
            )}
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  header: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 40,
    color: '#111827c2',
    fontFamily: 'Poppins_400Regular'
  },
  inputContainer: {
    marginTop: 24,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    fontWeight: '600',
    color: '#111827c2',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 1,
  },
  button: {
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  listItemContainer: {
    borderBottomColor: '#f1f5f9',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  listItemLabel: {
    color: '#0f172a',
    fontSize: 16,
  },
  selectedItemLabel: {
    color: '#2563eb', // blå accent
    fontWeight: '600',
  },
  searchContainer: {
    borderBottomColor: '#e2e8f0',
  },
  searchTextInput: {
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 10,
  }
});
