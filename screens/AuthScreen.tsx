import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtitle = isLoginMode
    ? 'Logga in för att fortsatta din träningsresa.'
    : 'Skapa konto och börja följa dina träningsresa.';

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
    <LinearGradient
      colors={['#1EC9B5', '#109D90', '#0E766E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="fitness-outline" size={38} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Välkommen till Sulek</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.formWrap}>
            {!isLoginMode ? (
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={19} color="rgba(255,255,255,0.88)" />
                <TextInput
                  style={styles.input}
                  placeholder="Namn"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="rgba(255,255,255,0.72)"
                />
              </View>
            ) : null}

            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={19} color="rgba(255,255,255,0.88)" />
              <TextInput
                style={styles.input}
                placeholder="E-post"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="rgba(255,255,255,0.72)"
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={19} color="rgba(255,255,255,0.88)" />
              <TextInput
                style={styles.input}
                placeholder="Lösenord"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="rgba(255,255,255,0.72)"
              />
            </View>

            {!isLoginMode ? (
              <Text style={styles.hint}>Losenordet maste vara minst 6 tecken.</Text>
            ) : (
              <Text style={styles.hintMuted}>Glömt lösenord?</Text>
            )}
          </View>

          <Pressable
            style={[styles.roundButton, (!isFormValid || isSubmitting) && styles.roundButtonDisabled]}
            onPress={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.roundButtonText}>{isLoginMode ? 'Logga in' : 'Skapa konto'}</Text>
            )}
          </Pressable>

          <View style={styles.bottomArea}>
            <Text style={styles.modeTitle}>{isLoginMode ? 'Ny har?' : 'Har du redan konto?'}</Text>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => setIsLoginMode(prev => !prev)}
              disabled={isSubmitting}
            >
              <Text style={styles.secondaryButtonText}>
                {isLoginMode ? 'Skapa konto' : 'Logga in'}
              </Text>
            </Pressable>
          </View>

          <View pointerEvents="none" style={styles.waveOne} />
          <View pointerEvents="none" style={styles.waveTwo} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 24,
  },
  topArea: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  title: {
    marginTop: 20,
    fontSize: 30,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  formWrap: {
    marginTop: 44,
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.45)',
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 8,
  },
  hint: {
    marginTop: -6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_400Regular',
  },
  hintMuted: {
    marginTop: -6,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Poppins_400Regular',
  },
  roundButton: {
    alignSelf: 'center',
    marginTop: 34,
    minWidth: 350,
    height: 56,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  roundButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 0.2,
    fontFamily: 'Poppins_400Regular',
  },
  roundButtonDisabled: {
    opacity: 1,
  },
  bottomArea: {
    marginTop: 36,
    alignItems: 'center',
  },
  modeTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  secondaryButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  waveOne: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -84,
    height: 180,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  waveTwo: {
    position: 'absolute',
    left: -60,
    right: -60,
    bottom: -114,
    height: 220,
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
