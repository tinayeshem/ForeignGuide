import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading

  const signIn = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const signUp = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (error) {
      setError(error.message)
    } else if (!data.session) {
      setMessage('Check your inbox to confirm your email.')
    }
    setLoading(false)
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>Your guide to parental benefits in Poland</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="email@example.com"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="At least 6 characters"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}

      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={signIn}
        disabled={!canSubmit}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </Pressable>

      <Pressable
        style={[styles.buttonOutline, !canSubmit && styles.buttonDisabled]}
        onPress={signUp}
        disabled={!canSubmit}
      >
        <Text style={styles.buttonOutlineText}>Create account</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 8,
    elevation: 3,
  },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  error: { color: '#c0392b', marginTop: 8 },
  message: { color: '#27ae60', marginTop: 8 },
  button: {
    backgroundColor: '#0b3a5e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#0b3a5e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonOutlineText: { color: '#0b3a5e', fontSize: 16, fontWeight: '600' },
  buttonDisabled: { opacity: 0.4 },
})