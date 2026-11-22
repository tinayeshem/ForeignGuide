import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useCalculatorParams } from '../features/calculator/useCalculatorParams'
import { getCaseById, SampleCase } from '../features/cases/caseService'
import {
  calculate,
  getLimits,
  CalculatorInput,
  Mode,
  ParentKey,
  Period,
  PeriodType,
} from '../features/calculator/calculator'

type ParentForm = {
  insured: boolean
  amount: string
  amountIsBase: boolean
  parentalWeeks: string
  workPercent: string
}

const newParent = (weeks: string): ParentForm => ({
  insured: true,
  amount: '',
  amountIsBase: false,
  parentalWeeks: weeks,
  workPercent: '0',
})

function num(value: string): number {
  const n = parseFloat(value.replace(',', '.'))
  return isNaN(n) ? 0 : n
}

function formatPLN(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} zł`
}

function formatWeeks(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function periodLabel(type: PeriodType, mode: Mode): string {
  switch (type) {
    case 'maternity':
      return mode === 'birth' ? 'Maternity leave' : 'Leave on maternity-leave terms'
    case 'supplementary':
      return 'Supplementary maternity leave'
    case 'parental':
      return 'Parental leave'
    case 'paternity':
      return 'Paternity leave'
  }
}

function parentLabel(pk: ParentKey, mode: Mode): string {
  if (mode === 'birth') return pk === 'mother' ? 'Mother' : 'Father'
  return pk === 'mother' ? 'Parent 1' : 'Parent 2'
}

export default function CalculatorScreen() {
  const { params, loading, error, reload } = useCalculatorParams()

  const [mode, setMode] = useState<Mode>('birth')
  const [children, setChildren] = useState(1)
  const [zaZyciem, setZaZyciem] = useState(false)
  const [childAge, setChildAge] = useState('0')
  const [singleApplication, setSingleApplication] = useState(false)
  const [supplementaryWeeks, setSupplementaryWeeks] = useState('0')
  const [transferWeeks, setTransferWeeks] = useState('0')
  const [fatherPaternity, setFatherPaternity] = useState(true)
  const [mother, setMother] = useState<ParentForm>(newParent('32'))
  const [father, setFather] = useState<ParentForm>(newParent('9'))

  // ----- Sample case (opened from the Sample cases screen) -----
  const { caseId } = useLocalSearchParams<{ caseId?: string }>()
  const [loadedCase, setLoadedCase] = useState<SampleCase | null>(null)

  useEffect(() => {
    if (!caseId) return

    getCaseById(caseId)
      .then((c) => {
        if (!c) return
        setLoadedCase(c)
        setMode(c.mode)
        setChildren(c.children)
        setZaZyciem(c.za_zyciem)
        setChildAge(String(c.child_age))
        setSingleApplication(c.single_application)
        setSupplementaryWeeks(String(c.supplementary_weeks))
        setTransferWeeks(String(c.transfer_weeks))
        setFatherPaternity(c.father_paternity)
        setMother({
          insured: c.mother_insured,
          amount: c.mother_base !== null ? String(c.mother_base) : '',
          amountIsBase: true,
          parentalWeeks: String(c.mother_parental_weeks),
          workPercent: String(c.mother_work_percent),
        })
        setFather({
          insured: c.father_insured,
          amount: c.father_base !== null ? String(c.father_base) : '',
          amountIsBase: true,
          parentalWeeks: String(c.father_parental_weeks),
          workPercent: String(c.father_work_percent),
        })
      })
      .catch((e) => console.log('LOAD CASE ERROR:', e))
  }, [caseId])

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

  const isBirth = mode === 'birth'

  const input: CalculatorInput = {
    mode,
    children,
    zaZyciem,
    childAgeYears: num(childAge),
    singleApplication,
    supplementaryWeeks: num(supplementaryWeeks),
    maternityTransferWeeks: num(transferWeeks),
    fatherPaternity,
    mother: {
      insured: mother.insured,
      amount: num(mother.amount),
      amountIsBase: mother.amountIsBase,
      parentalWeeks: num(mother.parentalWeeks),
      workPercent: num(mother.workPercent),
    },
    father: {
      insured: father.insured,
      amount: num(father.amount),
      amountIsBase: father.amountIsBase,
      parentalWeeks: num(father.parentalWeeks),
      workPercent: num(father.workPercent),
    },
  }

  const limits = getLimits(params, input)
  const result = calculate(params, input)

  // ----- Compare with the ZUS decision -----
  let comparison: { ok: boolean; text: string } | null = null
  if (loadedCase) {
    const ourPeriod = result.periods.find(
      (p) => p.parent === loadedCase.zus_parent && p.type === loadedCase.zus_period
    )

    if (loadedCase.zus_decision === 'refused') {
      comparison = ourPeriod
        ? { ok: false, text: 'ZUS refused, but the calculator shows a benefit – check the inputs.' }
        : { ok: true, text: 'ZUS refused, and the calculator also shows no benefit.' }
    } else if (!ourPeriod) {
      comparison = { ok: false, text: 'ZUS granted the benefit, but the calculator shows none – check the inputs.' }
    } else if (loadedCase.zus_monthly_amount !== null) {
      const diff = Math.abs(ourPeriod.monthlyAmount - loadedCase.zus_monthly_amount)
      comparison = {
        ok: diff < 1,
        text:
          diff < 1
            ? `Matches ZUS: ${formatPLN(ourPeriod.monthlyAmount)} / month`
            : `ZUS: ${formatPLN(loadedCase.zus_monthly_amount)} · calculator: ${formatPLN(ourPeriod.monthlyAmount)} (difference ${formatPLN(diff)})`,
      }
    } else {
      comparison = { ok: true, text: 'ZUS granted the benefit, and the calculator shows it too.' }
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Benefit calculator' }} />

      <Text style={styles.title}>🧮 Maternity benefit calculator</Text>
      <Text style={styles.subtitle}>
        Zasiłek macierzyński – how long and how much, for both parents.
      </Text>

      {loadedCase && comparison && (
        <View style={[styles.caseBanner, comparison.ok ? styles.caseOk : styles.caseBad]}>
          <Text style={styles.caseTitle}>📂 Sample case: {loadedCase.title}</Text>
          <Text style={styles.caseText}>
            ZUS decision: {loadedCase.zus_decision === 'granted' ? '✅ granted' : '❌ refused'}
            {loadedCase.zus_notes ? ` – ${loadedCase.zus_notes}` : ''}
          </Text>
          <Text style={styles.caseResult}>
            {comparison.ok ? '✅ ' : '⚠️ '}
            {comparison.text}
          </Text>
        </View>
      )}

      {/* ---------- Situation ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Your situation</Text>

        <Text style={styles.label}>How is the child joining your family?</Text>
        <View style={styles.row}>
          <Chip label="👶 Birth" selected={mode === 'birth'} onPress={() => setMode('birth')} />
          <Chip label="🏠 Adoption" selected={mode === 'adoption'} onPress={() => setMode('adoption')} />
          <Chip label="🤝 Foster care" selected={mode === 'foster'} onPress={() => setMode('foster')} />
        </View>

        <Text style={styles.label}>Number of children (at one birth / adopted together)</Text>
        <View style={styles.row}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Chip
              key={n}
              label={n === 5 ? '5+' : String(n)}
              selected={children === n}
              onPress={() => setChildren(n)}
            />
          ))}
        </View>

        <Toggle
          label='"Za życiem" certificate (serious illness / disability of the child)'
          value={zaZyciem}
          onChange={setZaZyciem}
        />

        {!isBirth && (
          <NumberField label="Child's age (years)" value={childAge} onChange={setChildAge} />
        )}

        {isBirth && (
          <>
            <Toggle
              label={`81.5% option – one application for the whole leave within ${params.single_application_deadline_days ?? 21} days of birth`}
              value={singleApplication}
              onChange={setSingleApplication}
            />
            <NumberField
              label="Supplementary maternity leave (premature / hospitalised baby), weeks"
              hint={`0–${limits.supplementaryMax}`}
              value={supplementaryWeeks}
              onChange={setSupplementaryWeeks}
            />
          </>
        )}
      </View>

      {/* ---------- Parents ---------- */}
      <ParentFields
        title={`2. ${parentLabel('mother', mode)}`}
        form={mother}
        onChange={(patch) => setMother({ ...mother, ...patch })}
        maxParental={limits.parentalMaxPerParent}
        workMax={limits.workMaxPercent}
      />

      <ParentFields
        title={`3. ${parentLabel('father', mode)}`}
        form={father}
        onChange={(patch) => setFather({ ...father, ...patch })}
        maxParental={limits.parentalMaxPerParent}
        workMax={limits.workMaxPercent}
      >
        {father.insured && (
          <>
            <Toggle
              label={`Paternity leave (${limits.paternityWeeks} weeks at 100%)`}
              value={fatherPaternity}
              onChange={setFatherPaternity}
            />
            {isBirth && (
              <NumberField
                label="Maternity weeks taken over from the mother (after her first 14 weeks)"
                hint={`0–${limits.maternityTransferMax}`}
                value={transferWeeks}
                onChange={setTransferWeeks}
              />
            )}
          </>
        )}
      </ParentFields>

      {/* ---------- Limits ---------- */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          For your situation: maternity leave {limits.maternityWeeks} weeks · parental leave{' '}
          {limits.parentalTotal} weeks in total (max {limits.parentalMaxPerParent} per parent,{' '}
          {limits.reservedWeeks} reserved for each).
        </Text>
      </View>

      {/* ---------- Result ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Your result</Text>

        {(['mother', 'father'] as ParentKey[]).map((pk) => {
          const ps = result.periods.filter((p) => p.parent === pk)
          if (ps.length === 0) return null
          return (
            <View key={pk} style={styles.resultBlock}>
              <Text style={styles.resultParent}>
                {parentLabel(pk, mode)} · benefit base {formatPLN(result.bases[pk])} / month
              </Text>
              {ps.map((p, i) => (
                <PeriodRow key={i} period={p} mode={mode} />
              ))}
              <Text style={styles.resultTotal}>
                Total: {formatWeeks(result.totals[pk].weeks)} weeks · {formatPLN(result.totals[pk].amount)}
              </Text>
            </View>
          )
        })}

        {result.periods.length === 0 && (
          <Text style={styles.body}>No benefit periods for these answers.</Text>
        )}

        <Text style={styles.grandTotal}>All benefits: {formatPLN(result.totals.all)}</Text>
        <Text style={styles.disclaimer}>
          Gross amounts (income tax is deducted). Simulation only – ZUS or your employer makes the
          final decision.
        </Text>
      </View>

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
    </ScrollView>
  )
}

// ---------- Sub-components ----------

function ParentFields({
  title,
  form,
  onChange,
  maxParental,
  workMax,
  children,
}: {
  title: string
  form: ParentForm
  onChange: (patch: Partial<ParentForm>) => void
  maxParental: number
  workMax: number
  children?: React.ReactNode
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Toggle
        label="Covered by sickness insurance (ubezpieczenie chorobowe)"
        value={form.insured}
        onChange={(v) => onChange({ insured: v })}
      />

      {form.insured && (
        <>
          <View style={styles.row}>
            <Chip
              label="Gross salary"
              selected={!form.amountIsBase}
              onPress={() => onChange({ amountIsBase: false })}
            />
            <Chip
              label="Benefit base (from Z-3)"
              selected={form.amountIsBase}
              onPress={() => onChange({ amountIsBase: true })}
            />
          </View>

          <NumberField
            label={
              form.amountIsBase
                ? 'Benefit base (podstawa wymiaru), zł / month'
                : 'Average gross salary, last 12 months, zł / month'
            }
            placeholder="e.g. 7000"
            value={form.amount}
            onChange={(v) => onChange({ amount: v })}
          />

          <NumberField
            label="Parental leave for this parent, weeks"
            hint={`max ${maxParental}`}
            value={form.parentalWeeks}
            onChange={(v) => onChange({ parentalWeeks: v })}
          />

          <NumberField
            label="Working during parental leave, % of full time"
            hint={`0–${workMax}%`}
            value={form.workPercent}
            onChange={(v) => onChange({ workPercent: v })}
          />

          {children}
        </>
      )}
    </View>
  )
}

function PeriodRow({ period, mode }: { period: Period; mode: Mode }) {
  const weeksText =
    period.workPercent > 0
      ? `${formatWeeks(period.baseWeeks)} → ${formatWeeks(period.weeks)} weeks (working ${period.workPercent}%)`
      : `${formatWeeks(period.weeks)} weeks`

  return (
    <View style={styles.periodRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.periodTitle}>{periodLabel(period.type, mode)}</Text>
        <Text style={styles.periodMeta}>
          {weeksText} · {period.ratePercent}%
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.periodMonthly}>{formatPLN(period.monthlyAmount)} / month</Text>
        <Text style={styles.periodTotal}>{formatPLN(period.totalAmount)} total</Text>
      </View>
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

function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
  placeholder?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}>  ({hint})</Text> : null}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder={placeholder}
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
  hint: { fontWeight: '400', color: '#888' },
  body: { fontSize: 15, color: '#333' },
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
  infoBox: { backgroundColor: '#e8eef4', borderRadius: 12, padding: 14 },
  infoText: { color: '#0b3a5e', fontSize: 14, lineHeight: 20 },
  resultBlock: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    gap: 8,
  },
  resultParent: { fontSize: 15, fontWeight: '700', color: '#0b3a5e' },
  periodRow: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  periodTitle: { fontSize: 15, fontWeight: '600' },
  periodMeta: { fontSize: 13, color: '#666' },
  periodMonthly: { fontSize: 15, fontWeight: '600' },
  periodTotal: { fontSize: 13, color: '#666' },
  resultTotal: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
  grandTotal: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  disclaimer: { fontSize: 12, color: '#888' },
  warningBox: { backgroundColor: '#fff4e5', borderRadius: 12, padding: 14, gap: 6 },
  warningTitle: { fontWeight: '700', color: '#b35900' },
  warningText: { color: '#8a4b00', fontSize: 14, lineHeight: 20 },
  noteBox: { backgroundColor: '#eaf7ee', borderRadius: 12, padding: 14, gap: 6 },
  noteTitle: { fontWeight: '700', color: '#1e7e34' },
  noteText: { color: '#1e5e2c', fontSize: 14, lineHeight: 20 },
  caseBanner: { borderRadius: 12, padding: 14, gap: 6, borderWidth: 1 },
  caseOk: { backgroundColor: '#eaf7ee', borderColor: '#27ae60' },
  caseBad: { backgroundColor: '#fff4e5', borderColor: '#e67e22' },
  caseTitle: { fontSize: 16, fontWeight: '700', color: '#0b3a5e' },
  caseText: { fontSize: 14, color: '#333' },
  caseResult: { fontSize: 15, fontWeight: '700', color: '#333' },
  errorText: { color: '#c0392b' },
  button: { backgroundColor: '#0b3a5e', padding: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '600' },
})
