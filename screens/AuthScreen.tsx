import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = isLoginMode ? 'Logga in' : 'Skapa konto';
  const subtitle = isLoginMode ? 'Valkommen tillbaka till Sulek' : 'Kom igang med din traningsresa';

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
        Alert.alert(isLoginMode ? 'Inloggning misslyckades' : 'Registrering misslyckades', result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'right', 'left']}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {!isLoginMode ? (
          <TextInput
            style={styles.input}
            placeholder="Namn"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#94A3B8"
          />
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="E-post"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#94A3B8"
        />

        <TextInput
          style={styles.input}
          placeholder="Losenord"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#94A3B8"
        />

        {!isLoginMode ? (
          <Text style={styles.hint}>Losenordet maste vara minst 6 tecken.</Text>
        ) : null}

        <Pressable
          style={[styles.primaryButton, (!isFormValid || isSubmitting) && styles.primaryButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>{isLoginMode ? 'Logga in' : 'Skapa konto'}</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => setIsLoginMode(prev => !prev)}
          disabled={isSubmitting}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoginMode ? 'Har du inget konto? Registrera dig' : 'Har du redan konto? Logga in'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F1F5F9',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  title: {
    fontSize: 24,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
    backgroundColor: '#F8FAFC',
  },
  hint: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Poppins_400Regular',
  },
  primaryButton: {
    marginTop: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14B8A6',
    paddingVertical: 12,
    minHeight: 46,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  secondaryButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0D9488',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
});
