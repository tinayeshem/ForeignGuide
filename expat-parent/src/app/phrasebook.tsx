import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native'
import { Stack } from 'expo-router'
import { usePhrasebook } from '../features/phrasebook/usePhrasebook'
import { Phrase, PhraseCategory } from '../features/phrasebook/phrasebookService'
import { hasPolishVoice, speakPolish, stopSpeaking } from '../lib/speech'

type Filter = 'all' | PhraseCategory

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'hospital', label: '🏥 Hospital' },
  { key: 'office', label: '🏛️ Office' },
  { key: 'doctor', label: '🩺 Doctor' },
]

export default function PhrasebookScreen() {
  const { phrases, loading, error, reload } = usePhrasebook()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [speakingId, setSpeakingId] = useState<number | null>(null)
  const [polishAvailable, setPolishAvailable] = useState<boolean | null>(null)

  // Check for a Polish voice once, and stop audio when leaving the screen
  useEffect(() => {
    hasPolishVoice().then(setPolishAvailable)
    return () => {
      stopSpeaking()
    }
  }, [])

  const speak = (phrase: Phrase, slow = false) => {
    if (speakingId === phrase.id) {
      stopSpeaking()
      setSpeakingId(null)
      return
    }

    setSpeakingId(phrase.id)
    speakPolish(phrase.polish, {
      slow,
      // Only clear if this phrase is still the active one
      onDone: () => setSpeakingId((prev) => (prev === phrase.id ? null : prev)),
    })
  }

  const openVoiceSettings = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.sendIntent('com.android.settings.TTS_SETTINGS')
      } else {
        await Linking.openSettings()
      }
    } catch {
      Linking.openSettings()
    }
  }

  const search = query.trim().toLowerCase()
  const visible = phrases.filter((p) => {
    const matchesFilter = filter === 'all' || p.category === filter
    const matchesSearch =
      search === '' ||
      p.english.toLowerCase().includes(search) ||
      p.polish.toLowerCase().includes(search)
    return matchesFilter && matchesSearch
  })

  if (loading && phrases.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error && phrases.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retry} onPress={reload}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Phrasebook' }} />

      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reload}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            {polishAvailable === false && (
              <View style={styles.banner}>
                <Text style={styles.bannerTitle}>🔈 No Polish voice on this phone</Text>
                <Text style={styles.bannerText}>
                  Audio may sound wrong. Install the Polish voice in your text-to-speech
                  settings for correct pronunciation.
                </Text>
                <Pressable style={styles.bannerButton} onPress={openVoiceSettings}>
                  <Text style={styles.bannerButtonText}>Open voice settings</Text>
                </Pressable>
              </View>
            )}

            <TextInput
              style={styles.search}
              placeholder="Search in English or Polish"
              value={query}
              onChangeText={setQuery}
            />

            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <Pressable
                  key={f.key}
                  style={[styles.chip, filter === f.key && styles.chipSelected]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text style={[styles.chipText, filter === f.key && styles.chipTextSelected]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.hint}>Tap 🔊 to listen · Long-press for slow speed</Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No phrases found.</Text>}
        renderItem={({ item }) => {
          const isSpeaking = speakingId === item.id
          return (
            <View style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.english}>{item.english}</Text>
                <Text style={styles.polish}>{item.polish}</Text>
              </View>

              <Pressable
                style={[styles.speakButton, isSpeaking && styles.speakButtonActive]}
                onPress={() => speak(item)}
                onLongPress={() => speak(item, true)}
                hitSlop={8}
              >
                <Text style={styles.speakIcon}>{isSpeaking ? '⏹' : '🔊'}</Text>
              </Pressable>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  list: { padding: 16, gap: 12 },
  header: { gap: 12, marginBottom: 4 },
  banner: {
    backgroundColor: '#fff4e5',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  bannerTitle: { fontWeight: '700', color: '#b35900' },
  bannerText: { color: '#8a4b00', fontSize: 14, lineHeight: 20 },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#b35900',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  bannerButtonText: { color: '#fff', fontWeight: '600' },
  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#0b3a5e',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#0b3a5e' },
  chipText: { color: '#0b3a5e', fontSize: 14 },
  chipTextSelected: { color: '#fff' },
  hint: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
  },
  cardText: { flex: 1, gap: 6 },
  english: { fontSize: 14, color: '#666' },
  polish: { fontSize: 18, fontWeight: '600', color: '#0b3a5e' },
  speakButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8eef4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakButtonActive: { backgroundColor: '#0b3a5e' },
  speakIcon: { fontSize: 20 },
  errorText: { color: '#c0392b' },
  retry: { backgroundColor: '#0b3a5e', padding: 14, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '600' },
})