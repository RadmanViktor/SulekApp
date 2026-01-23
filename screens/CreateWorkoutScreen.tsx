import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Platform, StatusBar, Pressable, Alert, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { DropItem } from '../components/Dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Dropdown from '../components/Dropdown';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootTabParamList } from '../navigations/types';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { toLocalDateString } from '../utils/date';

type Props = BottomTabScreenProps<RootTabParamList, "CreateWorkoutScreen">;

export default function CreateWorkoutScreen({ route, navigation }: Props) {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>(() => paramDate ?? new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [exercises, setExercises] = useState<{ id: number; name: string }[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const modalMaxHeight = Math.round(Dimensions.get('window').height * 0.7);
  const templates = [
    {
      title: 'Push-pass',
      focus: 'Bröst • Axlar • Triceps',
      exercises: ['Bänkpress', 'Hantelpress', 'Axelpress', 'Triceps pushdown'],
    },
    {
      title: 'Pull-pass',
      focus: 'Rygg • Biceps',
      exercises: ['Marklyft', 'Latsdrag', 'Sittande rodd', 'Bicepscurl'],
    },
    {
      title: 'Ben-pass',
      focus: 'Framsida • Baksida • Sätesmuskler',
      exercises: ['Knäböj', 'Rumänska marklyft', 'Benpress', 'Vadpress'],
    },
    {
      title: 'Helkropp',
      focus: 'Basövningar',
      exercises: ['Knäböj', 'Bänkpress', 'Skivstångsrodd', 'Militärpress'],
    },
    {
      title: 'Upper body',
      focus: 'Överkropp',
      exercises: ['Bänkpress', 'Latsdrag', 'Axelpress', 'Hantelrodd'],
    },
    {
      title: 'Lower body',
      focus: 'Underkropp',
      exercises: ['Knäböj', 'Benpress', 'Lårcurl', 'Vadpress'],
    },
    {
      title: 'Core & rörlighet',
      focus: 'Stabilitet • Rörlighet',
      exercises: ['Plankan', 'Hängande benlyft', 'Pallof press', 'Höftlyft'],
    },
    {
      title: 'Snabbt helkropp',
      focus: '30 min',
      exercises: ['Goblet squat', 'Armhävningar', 'Skivstångsrodd', 'Utfall'],
    },
  ];

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

  const handleApplyTemplate = (template: typeof templates[number]) => {
    const available = new Set(exercises.map(item => item.name));
    const matched = template.exercises.filter(name => available.has(name));
    const missing = template.exercises.filter(name => !available.has(name));

    setName(template.title);
    setSelectedExercises(matched);
    setIsTemplateModalOpen(false);

    if (missing.length > 0) {
      Alert.alert('Saknar övningar', `Lägg till: ${missing.join(', ')}`);
    }
  };

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

    try {
      const selectedDate = toLocalDateString(date);
      const existingResponse = await fetch(`${apiBaseUrl}/Workout/Workouts`);
      if (existingResponse.ok) {
        const existingData: { workout?: { workoutDate?: string } }[] = await existingResponse.json();
        const existingForDate = existingData
          .map(item => item.workout)
          .some(workout => {
            if (!workout?.workoutDate) return false;
            const workoutDate = toLocalDateString(workout.workoutDate);
            return workoutDate === selectedDate;
          });

        if (existingForDate) {
          Alert.alert('Pass finns redan', 'Det finns redan ett pass registrerat för det här datumet.');
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        name: name.trim(),
        workoutDate: `${selectedDate}T00:00:00`,
        completed: false,
        workoutExerciseDtos,
      };

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
          <Text style={styles.templatePrompt}>Vill du ha ett redan färdigt pass?</Text>
          <Pressable style={styles.templatePromptButton} onPress={() => setIsTemplateModalOpen(true)}>
            <Text style={styles.templatePromptButtonText}>Visa färdiga pass</Text>
          </Pressable>
        </View>

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
      <Modal
        visible={isTemplateModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsTemplateModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalDismiss} onPress={() => setIsTemplateModalOpen(false)} />
          <View style={[styles.modalCard, { maxHeight: modalMaxHeight }]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Färdiga pass</Text>
              <Pressable onPress={() => setIsTemplateModalOpen(false)}>
                <Text style={styles.modalClose}>Stäng</Text>
              </Pressable>
            </View>
            <ScrollView
              style={[styles.templateScroll, { maxHeight: modalMaxHeight - 80 }]}
              contentContainerStyle={styles.templateGrid}
              showsVerticalScrollIndicator={false}
            >
              {templates.map(template => (
                <View key={template.title} style={styles.templateCard}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateFocus}>{template.focus}</Text>
                  <Text style={styles.templateList}>{template.exercises.join(' • ')}</Text>
                  <Pressable style={styles.templateButton} onPress={() => handleApplyTemplate(template)}>
                    <Text style={styles.templateButtonText}>Använd</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  templateGrid: {
    gap: 12,
    paddingBottom: 16,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templateTitle: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  templateFocus: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  templateList: {
    marginTop: 8,
    fontSize: 13,
    color: '#475569',
    fontFamily: 'Poppins_400Regular',
  },
  templateButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#14B8A6',
  },
  templateButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  templatePrompt: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#334155',
    textAlign: 'center',
  },
  templatePromptButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#14B8A6',
  },
  templatePromptButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    width: '100%',
  },
  templateScroll: {
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  modalClose: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
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
