import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native'
import { Stack } from 'expo-router'
import { useInfoCards } from '../features/info/useInfoCards'
import { InfoCard } from '../features/info/infoService'

export default function RisksScreen() {
  const { cards, loading, error, reload } = useInfoCards(['risk', 'right'])

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
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  const risks = cards.filter((c) => c.category === 'risk')
  const rights = cards.filter((c) => c.category === 'right')

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Risks & your rights' }} />

      <Text style={styles.title}>⚠️ Risks & your rights</Text>
      <Text style={styles.subtitle}>
        What can make you lose benefits or get less – and how the law protects you.
      </Text>

      <Text style={styles.groupTitle}>⚠️ Risks to your benefits</Text>
      {risks.map((card) => (
        <Card key={card.id} card={card} tone="risk" />
      ))}

      <Text style={styles.groupTitle}>🛡️ Your rights</Text>
      {rights.map((card) => (
        <Card key={card.id} card={card} tone="right" />
      ))}

      <Text style={styles.disclaimer}>
        General information, not legal advice. In doubt, ask ZUS, your employer or the State Labour
        Inspectorate (PIP).
      </Text>
    </ScrollView>
  )
}

function Card({ card, tone }: { card: InfoCard; tone: 'risk' | 'right' }) {
  const accent = tone === 'risk' ? '#e67e22' : '#27ae60'

  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text style={styles.cardBody}>{card.body}</Text>
      {card.link_url && (
        <Pressable onPress={() => Linking.openURL(card.link_url!)}>
          <Text style={styles.link}>Read more →</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666' },
  groupTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderLeftWidth: 5,
    elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardBody: { fontSize: 15, color: '#333', lineHeight: 22 },
  link: { color: '#1a6fb5', fontWeight: '600', marginTop: 4 },
  disclaimer: { fontSize: 12, color: '#888', marginTop: 8 },
  errorText: { color: '#c0392b' },
  button: { backgroundColor: '#0b3a5e', padding: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
