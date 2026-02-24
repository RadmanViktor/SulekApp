import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtitle = isLoginMode
    ? 'Logga in för att fortsätta din träningsresa.'
    : 'Skapa konto och börja följa din utveckling.';

  const isFormValid = useMemo(() => {
    if (isLoginMode) {
      return email.trim().length > 0 && password.trim().length > 0;
    }
    return name.trim().length > 0 && email.trim().length > 0 && password.trim().length >= 6;
  }, [email, isLoginMode, name, password]);

  const handleSubmit = async () => {
    if (isSubmitting || !isFormValid) return;

    setIsSubmitting(true);
    try {
      const result = isLoginMode
        ? await login(email.trim(), password)
        : await register(name.trim(), email.trim(), password);

      if (!result.success) {
        Alert.alert(
          isLoginMode ? 'Inloggning misslyckades' : 'Registrering misslyckades',
          result.message
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/blue_bg.jpg')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topArea}>
            <Image source={require('../assets/evolve_logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.tagline}>Train. Track. Evolve.</Text>
          </View>

          <View style={styles.formCard}>
            {!isLoginMode ? (
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={20} color="#6B7A96" />
                <TextInput
                  style={styles.input}
                  placeholder="Namn"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#95A0B8"
                />
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={20} color="#6B7A96" />
              <TextInput
                style={styles.input}
                placeholder="E-post"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#95A0B8"
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={20} color="#6B7A96" />
              <TextInput
                style={styles.input}
                placeholder="Lösenord"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#95A0B8"
              />
            </View>

            {!isLoginMode ? (
              <Text style={styles.hint}>Lösenordet måste vara minst 6 tecken.</Text>
            ) : (
              <Text style={styles.hintMuted}>Glömt lösenord?</Text>
            )}

            <Pressable
              style={[styles.roundButton, (!isFormValid || isSubmitting) && styles.roundButtonDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              <LinearGradient
                colors={[colors.brand.highlight, colors.brand.primary, colors.brand.deep]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.roundButtonGradient}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.roundButtonText}>{isLoginMode ? 'Logga in' : 'Skapa konto'}</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => setIsLoginMode(prev => !prev)}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>{isLoginMode ? 'Skapa konto' : 'Logga in'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  topArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 700,
    height: 288,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#4B5B7A',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  tagline: {
    marginTop: -78,
    fontSize: 18,
    color: '#6B7A96',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#E7EEF9',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE9F9',
    paddingBottom: 8,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 22,
    color: '#34445E',
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 8,
  },
  hint: {
    marginTop: -4,
    fontSize: 12,
    color: '#5B6C8C',
    fontFamily: 'Poppins_400Regular',
  },
  hintMuted: {
    marginTop: -4,
    fontSize: 12,
    color: '#6CAEF6',
    fontFamily: 'Poppins_400Regular',
  },
  roundButton: {
    marginTop: 18,
    borderRadius: 999,
    overflow: 'hidden',
  },
  roundButtonGradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  roundButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Poppins_400Regular',
  },
  roundButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    marginTop: 14,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CFE1FA',
    backgroundColor: '#F7FBFF',
  },
  secondaryButtonText: {
    color: '#5E8ED5',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
});
