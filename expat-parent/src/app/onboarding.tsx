import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { saveProfile, NationalityType } from '../features/profileService'

const CITIES = ['Lublin', 'Warsaw', 'Kraków', 'Other']

function validateDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'Use the format YYYY-MM-DD'
  }

  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)

  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return 'This date does not exist'
  }

  const maxFuture = new Date()
  maxFuture.setMonth(maxFuture.getMonth() + 9)

  const minPast = new Date()
  minPast.setFullYear(minPast.getFullYear() - 2)

  if (date > maxFuture) return 'Date cannot be more than 9 months ahead'
  if (date < minPast) return 'Date cannot be more than 2 years ago'

  return null
}

export default function OnboardingScreen() {
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState<NationalityType | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canContinue = birthDate.length > 0 && nationality !== null && city !== null && !saving

  const handleContinue = async () => {
    const dateError = validateDate(birthDate)
    if (dateError) {
      setError(dateError)
      return
    }

    setError(null)
    setSaving(true)

    try {
      await saveProfile({
        birth_date: birthDate,
        nationality_type: nationality!,
        city: city!,
      })
      router.replace('/')
    } catch (e: any) {
      console.log('SAVE PROFILE ERROR:', e)
      setError(e?.message ?? 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (

    
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Welcome' }} />

      <Text style={styles.title}>Let's set up your checklist</Text>
      <Text style={styles.subtitle}>3 quick questions so we can show your deadlines.</Text>

      {/* Question 1 */}
      <Text style={styles.label}>1. Baby's birth date (or due date)</Text>
      <TextInput
        style={styles.input}
        placeholder="YYYY-MM-DD"
        value={birthDate}
        onChangeText={setBirthDate}
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />

      {/* Question 2 */}
      <Text style={styles.label}>2. Your nationality</Text>
      <View style={styles.row}>
        <Chip label="EU" selected={nationality === 'eu'} onPress={() => setNationality('eu')} />
        <Chip label="Non-EU" selected={nationality === 'non_eu'} onPress={() => setNationality('non_eu')} />
      </View>

      {/* Question 3 */}
      <Text style={styles.label}>3. Your city</Text>
      <View style={styles.row}>
        {CITIES.map((c) => (
          <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, !canContinue && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!canContinue}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Continue</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 12 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0b3a5e',
  },
  chipSelected: { backgroundColor: '#0b3a5e' },
  chipText: { color: '#0b3a5e', fontSize: 15 },
  chipTextSelected: { color: '#fff' },
  error: { color: '#c0392b', marginTop: 8 },
  button: {
    backgroundColor: '#0b3a5e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
})