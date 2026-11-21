import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native'
import { Redirect, Stack } from 'expo-router'
import { supabase } from '../lib/supabase'
import { getProfile, Profile } from '../features/profileService'

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile()
        setProfile(data)
      } catch (e: any) {
        console.log('GET PROFILE ERROR:', e)
        setError(e?.message ?? 'Could not load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    )
  }

  if (!profile) {
    return <Redirect href="/onboarding" />
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Checklist' }} />

      <Text style={styles.title}>Profile saved ✅</Text>
      <Text>Birth date: {profile.birth_date}</Text>
      <Text>Nationality: {profile.nationality_type === 'eu' ? 'EU' : 'Non-EU'}</Text>
      <Text>City: {profile.city}</Text>
      <Text style={styles.note}>Timeline comes in Step 5.</Text>

      {/* TEMPORARY: for testing onboarding again */}
      <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { flex: 1, padding: 24, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  note: { marginTop: 16, color: '#666' },
  error: { color: '#c0392b' },
  button: {
    backgroundColor: '#0b3a5e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
})