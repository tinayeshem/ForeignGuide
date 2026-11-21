import { useCallback, useRef } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  FlatList,
} from 'react-native'
import { Redirect, Stack, router, useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'
import { useTimeline } from '../features/timeline/useTimeline'
import { STATUS_COLOR, dueLabel } from '../features/timeline/format'

export default function HomeScreen() {
  const { profile, items, doneCount, total, loading, error, toggleStep, reload } =
    useTimeline()

  // Reload when coming back from the detail screen (skip the first focus)
  const firstFocus = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false
        return
      }
      reload()
    }, [reload])
  )

  if (loading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error && !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.button} onPress={reload}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    )
  }

  if (!profile) {
    return <Redirect href="/onboarding" />
  }

  const percent = total > 0 ? (doneCount / total) * 100 : 0

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Checklist',
          headerRight: () => (
            <Pressable onPress={() => router.push('./phrasebook')} hitSlop={10}>
              <Text style={styles.headerLink}>🗣️ Phrases</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={reload}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.progressText}>
              {doneCount} of {total} done
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.done && styles.cardDone]}>
            <View style={[styles.colorBar, { backgroundColor: STATUS_COLOR[item.status] }]} />

            <Pressable
              style={styles.cardBody}
              onPress={() =>
                router.push({ pathname: '/step/[id]', params: { id: item.id } })
              }
            >
              <Text style={[styles.cardTitle, item.done && styles.cardTitleDone]}>
                {item.title}
              </Text>
              <Text style={[styles.dueText, { color: STATUS_COLOR[item.status] }]}>
                {dueLabel(item)}
              </Text>
              {item.needs_review && (
                <Text style={styles.reviewText}>⚠️ Official info may have changed</Text>
              )}
            </Pressable>

            <Pressable
              style={[styles.checkbox, item.done && styles.checkboxDone]}
              onPress={() => toggleStep(item.id)}
              hitSlop={10}
            >
              {item.done && <Text style={styles.checkmark}>✓</Text>}
            </Pressable>
          </View>
        )}
        ListFooterComponent={
          // TEMPORARY: for testing
          <Pressable style={styles.signOut} onPress={() => supabase.auth.signOut()}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  container: { flex: 1, backgroundColor: '#f5f6f8' },
  headerLink: { color: '#0b3a5e', fontSize: 16, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  header: { marginBottom: 8, gap: 8 },
  progressText: { fontSize: 18, fontWeight: '700' },
  progressTrack: {
    height: 10,
    backgroundColor: '#dfe3e8',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#0b3a5e' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  cardDone: { opacity: 0.6 },
  colorBar: { width: 6, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: 14, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardTitleDone: { textDecorationLine: 'line-through' },
  dueText: { fontSize: 14, fontWeight: '500' },
  reviewText: { fontSize: 12, color: '#e67e22' },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#0b3a5e',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: { backgroundColor: '#0b3a5e' },
  checkmark: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#c0392b' },
  button: { backgroundColor: '#0b3a5e', padding: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
  signOut: { alignItems: 'center', padding: 20 },
  signOutText: { color: '#888' },
})