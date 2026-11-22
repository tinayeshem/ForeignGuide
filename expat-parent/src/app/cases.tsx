
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Stack, router } from 'expo-router'
import { useCases } from '../features/cases/useCases'
import { SampleCase } from '../features/cases/caseService'

function formatPLN(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} zł`
}

const PERIOD_LABEL: Record<SampleCase['zus_period'], string> = {
  maternity: 'maternity leave',
  supplementary: 'supplementary maternity leave',
  parental: 'parental leave',
  paternity: 'paternity leave',
}

export default function CasesScreen() {
  const { cases, loading, error, reload } = useCases()

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
      <Stack.Screen options={{ title: 'Sample cases' }} />

      <Text style={styles.title}>📂 Sample cases</Text>
      <Text style={styles.subtitle}>
        Pick a case to check insurance status and run it through the calculator. The result is
        compared with the ZUS decision.
      </Text>

      {cases.length === 0 && <Text style={styles.body}>No sample cases yet.</Text>}

      {cases.map((c) => (
        <CaseCard key={c.id} item={c} />
      ))}
    </ScrollView>
  )
}

function CaseCard({ item }: { item: SampleCase }) {
  const granted = item.zus_decision === 'granted'
  const parentInsured = item.zus_parent === 'mother' ? item.mother_insured : item.father_insured
  const parentName = item.mode === 'birth'
    ? item.zus_parent === 'mother' ? 'Mother' : 'Father'
    : item.zus_parent === 'mother' ? 'Parent 1' : 'Parent 2'

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: granted ? '#27ae60' : '#c0392b' }]}>
          <Text style={styles.badgeText}>{granted ? 'Granted' : 'Refused'}</Text>
        </View>
      </View>

      {item.description && <Text style={styles.body}>{item.description}</Text>}

      <View style={styles.row}>
        <Text style={[styles.pill, parentInsured ? styles.pillOk : styles.pillBad]}>
          {parentName}: {parentInsured ? '✅ insured' : '❌ not insured'}
        </Text>
        <Text style={styles.pill}>👶 {item.children} child{item.children === 1 ? '' : 'ren'}</Text>
        <Text style={styles.pill}>📅 {PERIOD_LABEL[item.zus_period]}</Text>
      </View>

      {granted && item.zus_monthly_amount !== null && (
        <Text style={styles.body}>
          ZUS amount: <Text style={styles.bold}>{formatPLN(item.zus_monthly_amount)} / month</Text>
        </Text>
      )}

      {item.zus_notes && <Text style={styles.note}>{item.zus_notes}</Text>}

      <Pressable
        style={styles.button}
        onPress={() => router.push({ pathname: '/calculator', params: { caseId: item.id } })}
      >
        <Text style={styles.buttonText}>Open in calculator →</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666' },
  body: { fontSize: 15, color: '#333', lineHeight: 22 },
  bold: { fontWeight: '700' },
  note: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '700' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 13,
    overflow: 'hidden',
  },
  pillOk: { backgroundColor: '#eaf7ee', color: '#1e7e34' },
  pillBad: { backgroundColor: '#fdecea', color: '#a93226' },
  errorText: { color: '#c0392b' },
  button: {
    backgroundColor: '#0b3a5e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
})
