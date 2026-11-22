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

export default function SupportScreen() {
  const { cards, loading, error, reload } = useInfoCards(['charity'])

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Support in difficult situations' }} />

      <Text style={styles.title}>💛 Support in difficult situations</Text>
      <Text style={styles.subtitle}>
        A premature birth, a seriously ill baby or a loss. Organisations that help parents – you do
        not have to go through this alone.
      </Text>

      <View style={styles.emergency}>
        <Text style={styles.emergencyText}>
          🚨 In an emergency, call <Text style={styles.bold}>112</Text>.
        </Text>
      </View>

      {cards.map((card) => (
        <View key={card.id} style={styles.card}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardBody}>{card.body}</Text>
          {card.link_url && (
            <Pressable onPress={() => Linking.openURL(card.link_url!)}>
              <Text style={styles.link}>Visit website →</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Text style={styles.disclaimer}>
        The list is maintained by the app administrator and can be updated in the admin panel.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666', lineHeight: 22 },
  bold: { fontWeight: '700' },
  emergency: { backgroundColor: '#fdecea', borderRadius: 12, padding: 12 },
  emergencyText: { color: '#a93226', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderLeftWidth: 5,
    borderLeftColor: '#f1c40f',
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
