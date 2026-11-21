import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useStepDetail } from '../../features/step-detail/useStepDetail'
import {
  STATUS_COLOR,
  STATUS_LABEL,
  dueLabel,
  formatDate,
} from '../../features/timeline/format'

export default function StepDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { item, city, loading, saving, error, toggleDone } = useStepDetail(id)
  const [checkedDocs, setCheckedDocs] = useState<Record<number, boolean>>({})

  if (loading && !item) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Step not found'}</Text>
      </View>
    )
  }

  const color = STATUS_COLOR[item.status]

  const openMaps = () => {
    const query = [item.where_to_go, city !== 'Other' ? city : null]
      .filter(Boolean)
      .join(' ')
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    Linking.openURL(url)
  }

  const openSource = () => {
    if (item.source_url) Linking.openURL(item.source_url)
  }

  const toggleDoc = (index: number) => {
    setCheckedDocs((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Step details' }} />

      {/* Title + status */}
      <View style={[styles.pill, { backgroundColor: color }]}>
        <Text style={styles.pillText}>{STATUS_LABEL[item.status]}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={[styles.due, { color }]}>{dueLabel(item)}</Text>
      {item.dueDate && !item.done && (
        <Text style={styles.muted}>Deadline: {formatDate(item.dueDate, true)}</Text>
      )}

      {item.needs_review && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ Official info may have changed. Check the source below.
          </Text>
        </View>
      )}

      {/* Where to go */}
      {item.where_to_go && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Where to go</Text>
          <Text style={styles.body}>{item.where_to_go}</Text>
          <Pressable style={styles.secondaryButton} onPress={openMaps}>
            <Text style={styles.secondaryButtonText}>Open in Maps</Text>
          </Pressable>
        </View>
      )}

      {/* Documents */}
      {item.documents?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Bring these documents</Text>
          {item.documents.map((doc, index) => (
            <Pressable key={index} style={styles.docRow} onPress={() => toggleDoc(index)}>
              <View style={[styles.docBox, checkedDocs[index] && styles.docBoxChecked]}>
                {checkedDocs[index] && <Text style={styles.docCheck}>✓</Text>}
              </View>
              <Text style={[styles.body, styles.docText, checkedDocs[index] && styles.docTextChecked]}>
                {doc}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Tips */}
      {item.tips && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Good to know</Text>
          <Text style={styles.body}>{item.tips}</Text>
        </View>
      )}

      {/* Source */}
      {item.source_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 Official source</Text>
          <Pressable onPress={openSource}>
            <Text style={styles.link}>{item.source_url}</Text>
          </Pressable>
          {item.last_verified && (
            <Text style={styles.muted}>Info last checked: {item.last_verified}</Text>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Done button */}
      <Pressable
        style={[styles.button, item.done && styles.buttonUndo]}
        onPress={toggleDone}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {item.done ? 'Mark as not done' : 'Mark as done ✓'}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { padding: 20, gap: 8, paddingBottom: 48 },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  title: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  due: { fontSize: 16, fontWeight: '600' },
  muted: { fontSize: 13, color: '#888' },
  warning: { backgroundColor: '#fff4e5', padding: 12, borderRadius: 10, marginTop: 8 },
  warningText: { color: '#b35900' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    gap: 8,
    elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, color: '#333' },
  docRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  docBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0b3a5e',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  docBoxChecked: { backgroundColor: '#0b3a5e' },
  docCheck: { color: '#fff', fontSize: 12, fontWeight: '700' },
  docText: { flex: 1 },
  docTextChecked: { textDecorationLine: 'line-through', color: '#999' },
  link: { color: '#1a6fb5', textDecorationLine: 'underline' },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#0b3a5e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: '#0b3a5e', fontWeight: '600' },
  errorText: { color: '#c0392b', marginTop: 8 },
  button: {
    backgroundColor: '#0b3a5e',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonUndo: { backgroundColor: '#7f8c8d' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})