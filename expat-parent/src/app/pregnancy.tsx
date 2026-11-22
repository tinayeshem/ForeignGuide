import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Stack } from 'expo-router'
import { useCalculatorParams } from '../features/calculator/useCalculatorParams'
import {
  checkPregnancy,
  todayString,
  ContractType,
  JobLoss,
  PregnancyStatus,
} from '../features/pregnancy/pregnancyCheck'

const CONTRACTS: { key: ContractType; label: string }[] = [
  { key: 'employment', label: 'Employment contract' },
  { key: 'mandate', label: 'Mandate contract (zlecenie)' },
  { key: 'self_employed', label: 'Own business' },
  { key: 'none', label: 'None / unemployed' },
]

const STATUS_COLOR: Record<PregnancyStatus, string> = {
  eligible: '#27ae60',
  waiting: '#e67e22',
  not_insured: '#c0392b',
  special_allowance: '#2c7be5',
}

const STATUS_ICON: Record<PregnancyStatus, string> = {
  eligible: '✅',
  waiting: '⏳',
  not_insured: '❌',
  special_allowance: '🛡️',
}

function num(value: string): number {
  const n = parseFloat(value.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function formatPLN(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} zł`
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export default function PregnancyScreen() {
  const { params, loading, error, reload } = useCalculatorParams()

  const [contract, setContract] = useState<ContractType>('employment')
  const [insuredSince, setInsuredSince] = useState('')
  const [voluntarySickness, setVoluntarySickness] = useState(true)
  const [sickLeaveStart, setSickLeaveStart] = useState(todayString())
  const [salary, setSalary] = useState('')
  const [age50plus, setAge50plus] = useState(false)
  const [unpaidContributions, setUnpaidContributions] = useState(false)
  const [jobLoss, setJobLoss] = useState<JobLoss>('no')

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

  const result = checkPregnancy(params, {
    contract,
    insuredSince,
    voluntarySickness,
    sickLeaveStart,
    grossSalary: num(salary),
    age50plus,
    unpaidContributions,
    jobLoss,
  })

  const color = STATUS_COLOR[result.status]
  const showAmounts =
    (result.status === 'eligible' || result.status === 'waiting') && result.base > 0

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Benefits in pregnancy' }} />

      <Text style={styles.title}>🤰 Benefits in pregnancy</Text>
      <Text style={styles.subtitle}>
        Can you get sickness benefit (zasiłek chorobowy) while pregnant? Who pays, and what to submit.
      </Text>

      {/* ---------- Work ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Your work</Text>

        <Text style={styles.label}>How do you work?</Text>
        <View style={styles.row}>
          {CONTRACTS.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={contract === c.key}
              onPress={() => setContract(c.key)}
            />
          ))}
        </View>

        {(contract === 'mandate' || contract === 'self_employed') && (
          <Toggle
            label="I joined voluntary sickness insurance (dobrowolne ubezpieczenie chorobowe)"
            value={voluntarySickness}
            onChange={setVoluntarySickness}
          />
        )}

        {contract === 'self_employed' && (
          <Toggle
            label="I have unpaid ZUS contributions"
            value={unpaidContributions}
            onChange={setUnpaidContributions}
          />
        )}

        {contract === 'employment' && (
          <Toggle label="I am 50 or older" value={age50plus} onChange={setAge50plus} />
        )}
      </View>

      {/* ---------- Dates & money ---------- */}
      {contract !== 'none' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Dates and income</Text>

          <Field
            label="Insured since (YYYY-MM-DD)"
            value={insuredSince}
            onChange={setInsuredSince}
            placeholder="e.g. 2026-06-01"
          />
          <Field
            label="First day of sick leave (YYYY-MM-DD)"
            value={sickLeaveStart}
            onChange={setSickLeaveStart}
          />
          <Field
            label={
              contract === 'self_employed'
                ? 'Declared contribution base, zł / month'
                : 'Average gross salary, last 12 months, zł / month'
            }
            value={salary}
            onChange={setSalary}
            placeholder="e.g. 7000"
            numeric
          />
        </View>
      )}

      {/* ---------- Job loss ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Did you lose your job during pregnancy?</Text>
        <View style={styles.row}>
          <Chip label="No" selected={jobLoss === 'no'} onPress={() => setJobLoss('no')} />
          <Chip
            label="Employer bankruptcy / liquidation / death"
            selected={jobLoss === 'bankruptcy'}
            onPress={() => setJobLoss('bankruptcy')}
          />
          <Chip
            label="Unlawful dismissal (court judgment)"
            selected={jobLoss === 'unlawful'}
            onPress={() => setJobLoss('unlawful')}
          />
        </View>
      </View>

      {/* ---------- Result ---------- */}
      <View style={[styles.resultCard, { borderLeftColor: color }]}>
        <Text style={[styles.resultHeadline, { color }]}>
          {STATUS_ICON[result.status]} {result.headline}
        </Text>

        {result.daysInsured !== null && (
          <Text style={styles.body}>
            Insured for {result.daysInsured} day{result.daysInsured === 1 ? '' : 's'} · required:{' '}
            {result.waitingDays} days
            {result.eligibleFrom ? ` · right from ${formatDate(result.eligibleFrom)}` : ''}
          </Text>
        )}

        {showAmounts && (
          <View style={styles.amountRow}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Benefit base</Text>
              <Text style={styles.amountValue}>{formatPLN(result.base)}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Per month (100%)</Text>
              <Text style={styles.amountValue}>{formatPLN(result.monthlyAmount)}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Per day</Text>
              <Text style={styles.amountValue}>{formatPLN(result.dailyAmount)}</Text>
            </View>
          </View>
        )}
      </View>

      <ListBox title="💳 Who pays" items={result.whoPays} />
      <ListBox title="📄 What to do / documents" items={result.documents} />

      {result.warnings.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Check this</Text>
          {result.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>• {w}</Text>
          ))}
        </View>
      )}

      {result.notes.length > 0 && (
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>💡 Good to know</Text>
          {result.notes.map((n, i) => (
            <Text key={i} style={styles.noteText}>• {n}</Text>
          ))}
        </View>
      )}

      <Text style={styles.disclaimer}>
        Simulation only. ZUS or your employer makes the final decision based on your documents.
      </Text>
    </ScrollView>
  )
}

// ---------- Sub-components ----------

function ListBox({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.body}>• {item}</Text>
      ))}
    </View>
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

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Pressable style={styles.toggleRow} onPress={() => onChange(!value)}>
      <View style={[styles.toggleBox, value && styles.toggleBoxOn]}>
        {value && <Text style={styles.toggleCheck}>✓</Text>}
      </View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  numeric?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType={numeric ? 'decimal-pad' : 'numbers-and-punctuation'}
        maxLength={numeric ? undefined : 10}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 },
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 15, color: '#666' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  body: { fontSize: 15, color: '#333', lineHeight: 22 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
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
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  toggleBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0b3a5e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleBoxOn: { backgroundColor: '#0b3a5e' },
  toggleCheck: { color: '#fff', fontWeight: '700', fontSize: 13 },
  toggleLabel: { flex: 1, fontSize: 15, color: '#333' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderLeftWidth: 6,
    elevation: 2,
  },
  resultHeadline: { fontSize: 18, fontWeight: '700' },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountBox: {
    flexGrow: 1,
    flexBasis: 140,
    backgroundColor: '#f5f6f8',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  amountLabel: { fontSize: 13, color: '#666' },
  amountValue: { fontSize: 17, fontWeight: '700', color: '#0b3a5e' },
  warningBox: { backgroundColor: '#fff4e5', borderRadius: 12, padding: 14, gap: 6 },
  warningTitle: { fontWeight: '700', color: '#b35900' },
  warningText: { color: '#8a4b00', fontSize: 14, lineHeight: 20 },
  noteBox: { backgroundColor: '#eaf7ee', borderRadius: 12, padding: 14, gap: 6 },
  noteTitle: { fontWeight: '700', color: '#1e7e34' },
  noteText: { color: '#1e5e2c', fontSize: 14, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: '#888' },
  errorText: { color: '#c0392b' },
  button: { backgroundColor: '#0b3a5e', padding: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
