import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useCalculatorParams } from '../features/calculator/useCalculatorParams'
import { getCaseById, SampleCase } from '../features/cases/caseService'
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { FadeIn } from '../components/ui/FadeIn'
import { useLanguage } from '../i18n/LanguageContext'
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

type T = (key: string, vars?: Record<string, string | number>) => string

function periodLabel(type: PeriodType, mode: Mode, t: T): string {
  switch (type) {
    case 'maternity':
      return mode === 'birth' ? t('period.maternity') : t('period.maternityTerms')
    case 'supplementary':
      return t('period.supplementary')
    case 'parental':
      return t('period.parental')
    case 'paternity':
      return t('period.paternity')
  }
}

function parentLabel(pk: ParentKey, mode: Mode, t: T): string {
  if (mode === 'birth') return pk === 'mother' ? t('calc.mother') : t('calc.father')
  return pk === 'mother' ? t('calc.parent1') : t('calc.parent2')
}

export default function CalculatorScreen() {
  const { params, loading, error, reload } = useCalculatorParams()
  const { t, lang } = useLanguage()

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
          <Text style={styles.buttonText}>{t('calc.tryAgain')}</Text>
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
  const result = calculate(params, input, lang)

  // ----- Compare with the ZUS decision -----
  let comparison: { ok: boolean; text: string } | null = null
  if (loadedCase) {
    const ourPeriod = result.periods.find(
      (p) => p.parent === loadedCase.zus_parent && p.type === loadedCase.zus_period
    )

    if (loadedCase.zus_decision === 'refused') {
      comparison = ourPeriod
        ? { ok: false, text: t('calc.cmpRefusedButBenefit') }
        : { ok: true, text: t('calc.cmpRefusedOk') }
    } else if (!ourPeriod) {
      comparison = { ok: false, text: t('calc.cmpGrantedButNone') }
    } else if (loadedCase.zus_monthly_amount !== null) {
      const diff = Math.abs(ourPeriod.monthlyAmount - loadedCase.zus_monthly_amount)
      comparison = {
        ok: diff < 1,
        text:
          diff < 1
            ? t('calc.cmpMatch', { amount: formatPLN(ourPeriod.monthlyAmount) })
            : t('calc.cmpDiff', {
                zus: formatPLN(loadedCase.zus_monthly_amount),
                ours: formatPLN(ourPeriod.monthlyAmount),
                diff: formatPLN(diff),
              }),
      }
    } else {
      comparison = { ok: true, text: t('calc.cmpGrantedOk') }
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: t('calc.screenTitle') }} />

      <FadeIn>
        <Text style={styles.title}>{t('calc.title')}</Text>
        <Text style={styles.subtitle}>{t('calc.subtitle')}</Text>
      </FadeIn>

      {loadedCase && comparison && (
        <View style={[styles.caseBanner, comparison.ok ? styles.caseOk : styles.caseBad]}>
          <Text style={styles.caseTitle}>{t('calc.case', { title: loadedCase.title })}</Text>
          <Text style={styles.caseText}>
            {t('calc.zusDecision', {
              decision: loadedCase.zus_decision === 'granted' ? t('calc.granted') : t('calc.refused'),
            })}
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
        <Text style={styles.sectionTitle}>{t('calc.situation')}</Text>

        <Text style={styles.label}>{t('calc.howJoining')}</Text>
        <View style={styles.row}>
          <Chip label={t('calc.birth')} selected={mode === 'birth'} onPress={() => setMode('birth')} />
          <Chip label={t('calc.adoption')} selected={mode === 'adoption'} onPress={() => setMode('adoption')} />
          <Chip label={t('calc.foster')} selected={mode === 'foster'} onPress={() => setMode('foster')} />
        </View>

        <Text style={styles.label}>{t('calc.children')}</Text>
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
          label={t('calc.zaZyciem')}
          value={zaZyciem}
          onChange={setZaZyciem}
        />

        {!isBirth && (
          <NumberField label={t('calc.childAge')} value={childAge} onChange={setChildAge} />
        )}

        {isBirth && (
          <>
            <Toggle
              label={t('calc.single', { days: params.single_application_deadline_days ?? 21 })}
              value={singleApplication}
              onChange={setSingleApplication}
            />
            <NumberField
              label={t('calc.supplementary')}
              hint={`0–${limits.supplementaryMax}`}
              value={supplementaryWeeks}
              onChange={setSupplementaryWeeks}
            />
          </>
        )}
      </View>

      {/* ---------- Parents ---------- */}
      <ParentFields
        title={`2. ${parentLabel('mother', mode, t)}`}
        form={mother}
        onChange={(patch) => setMother({ ...mother, ...patch })}
        maxParental={limits.parentalMaxPerParent}
        workMax={limits.workMaxPercent}
      />

      <ParentFields
        title={`3. ${parentLabel('father', mode, t)}`}
        form={father}
        onChange={(patch) => setFather({ ...father, ...patch })}
        maxParental={limits.parentalMaxPerParent}
        workMax={limits.workMaxPercent}
      >
        {father.insured && (
          <>
            <Toggle
              label={t('calc.paternity', { weeks: limits.paternityWeeks })}
              value={fatherPaternity}
              onChange={setFatherPaternity}
            />
            {isBirth && (
              <NumberField
                label={t('calc.transfer')}
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
          {t('calc.info', {
            maternity: limits.maternityWeeks,
            parental: limits.parentalTotal,
            perParent: limits.parentalMaxPerParent,
            reserved: limits.reservedWeeks,
          })}
        </Text>
      </View>

      {/* ---------- Result ---------- */}
      <View style={styles.section}>
        <View style={styles.resultHeader}>
          <Text style={[styles.sectionTitle, { flex: 1 }]}>{t('calc.result')}</Text>
          {Platform.OS === 'web' && (
            <Pressable
              {...({ dataSet: { noprint: 'true' } } as any)}
              onPress={() => {
                if (typeof window !== 'undefined') window.print()
              }}
              style={({ hovered }: any) => [styles.printButton, hovered && styles.printButtonHover]}
            >
              <Text style={styles.printButtonText}>{t('calc.print')}</Text>
            </Pressable>
          )}
        </View>

        <LeaveTimeline periods={result.periods} mode={mode} t={t} />

        {(['mother', 'father'] as ParentKey[]).map((pk) => {
          const ps = result.periods.filter((p) => p.parent === pk)
          if (ps.length === 0) return null
          return (
            <View key={pk} style={styles.resultBlock}>
              <Text style={styles.resultParent}>
                {t('calc.base', {
                  parent: parentLabel(pk, mode, t),
                  amount: formatPLN(result.bases[pk]),
                })}
              </Text>
              {ps.map((p, i) => (
                <PeriodRow key={i} period={p} mode={mode} t={t} />
              ))}
              <Text style={styles.resultTotal}>
                {t('calc.total', {
                  weeks: formatWeeks(result.totals[pk].weeks),
                  amount: formatPLN(result.totals[pk].amount),
                })}
              </Text>
            </View>
          )
        })}

        {result.periods.length === 0 && (
          <Text style={styles.body}>{t('calc.none')}</Text>
        )}

        <View style={styles.grandTotalBox}>
          <Text style={styles.grandTotalLabel}>{t('calc.allBenefits')}</Text>
          <AnimatedNumber value={result.totals.all} format={formatPLN} style={styles.grandTotalValue} />
        </View>
        <Text style={styles.disclaimer}>
          {t('calc.disclaimer')}
        </Text>
      </View>

      {result.warnings.length > 0 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>{t('calc.checkThis')}</Text>
          {result.warnings.map((w, i) => (
            <Text key={i} style={styles.warningText}>• {w}</Text>
          ))}
        </View>
      )}

      {result.notes.length > 0 && (
        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>{t('calc.goodToKnow')}</Text>
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
  const { t } = useLanguage()
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Toggle
        label={t('calc.insured')}
        value={form.insured}
        onChange={(v) => onChange({ insured: v })}
      />

      {form.insured && (
        <>
          <View style={styles.row}>
            <Chip
              label={t('calc.grossSalary')}
              selected={!form.amountIsBase}
              onPress={() => onChange({ amountIsBase: false })}
            />
            <Chip
              label={t('calc.benefitBaseChip')}
              selected={form.amountIsBase}
              onPress={() => onChange({ amountIsBase: true })}
            />
          </View>

          <NumberField
            label={
              form.amountIsBase ? t('calc.amountBase') : t('calc.amountGross')
            }
            placeholder={t('calc.placeholder')}
            value={form.amount}
            onChange={(v) => onChange({ amount: v })}
          />

          <NumberField
            label={t('calc.parentalWeeks')}
            hint={t('calc.max', { n: maxParental })}
            value={form.parentalWeeks}
            onChange={(v) => onChange({ parentalWeeks: v })}
          />

          <NumberField
            label={t('calc.work')}
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

// ---------- Visual leave timeline ----------

const SEGMENT_COLOR: Record<string, string> = {
  'mother-maternity': '#0b3a5e',
  'mother-supplementary': '#5b8def',
  'mother-parental': '#1f6fb2',
  'father-maternity': '#ff7a59',
  'father-parental': '#ffb347',
  'father-paternity': '#ffc857',
}

function LeaveTimeline({ periods, mode, t }: { periods: Period[]; mode: Mode; t: T }) {
  // Sequential leave after the birth (paternity is flexible, shown separately)
  const order = [
    'mother-maternity',
    'father-maternity',
    'mother-supplementary',
    'mother-parental',
    'father-parental',
  ]
  const segments = order
    .map((key) => periods.find((p) => `${p.parent}-${p.type}` === key))
    .filter((p): p is Period => !!p && p.weeks > 0)

  const paternity = periods.find((p) => p.type === 'paternity')
  const total = segments.reduce((sum, p) => sum + p.weeks, 0)

  if (total === 0) return null

  const markers = [
    { weeks: 26, label: t('calc.6months') },
    { weeks: 52, label: t('calc.1year') },
    { weeks: 104, label: t('calc.2years') },
  ].filter((m) => m.weeks < total)

  return (
    <FadeIn style={styles.timelineWrap}>
      <Text style={styles.timelineTitle}>{t('calc.timelineTitle')}</Text>

      <View style={styles.timelineBar}>
        {segments.map((p, i) => (
          <View
            key={i}
            style={[
              styles.timelineSegment,
              {
                flex: p.weeks,
                backgroundColor: SEGMENT_COLOR[`${p.parent}-${p.type}`] ?? '#999',
              },
            ]}
          >
            {p.weeks / total > 0.12 && (
              <Text style={styles.timelineSegmentText} numberOfLines={1}>
                {t('calc.wk', { weeks: formatWeeks(p.weeks) })}
              </Text>
            )}
          </View>
        ))}

        {markers.map((m) => (
          <View
            key={m.label}
            style={[styles.timelineMarker, { left: `${(m.weeks / total) * 100}%` }]}
          />
        ))}
      </View>

      <View style={styles.timelineAxis}>
        <Text style={styles.timelineAxisText}>{t('calc.birthAxis')}</Text>
        {markers.map((m) => (
          <Text
            key={m.label}
            style={[styles.timelineAxisMarker, { left: `${(m.weeks / total) * 100}%` }]}
          >
            {m.label}
          </Text>
        ))}
        <Text style={[styles.timelineAxisText, { marginLeft: 'auto' }]}>
          {t('calc.weeks', { weeks: formatWeeks(total) })}
        </Text>
      </View>

      <View style={styles.legend}>
        {segments.map((p, i) => (
          <View key={i} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: SEGMENT_COLOR[`${p.parent}-${p.type}`] ?? '#999' },
              ]}
            />
            <Text style={styles.legendText}>
              {parentLabel(p.parent, mode, t)}: {periodLabel(p.type, mode, t).toLowerCase()}
            </Text>
          </View>
        ))}
        {paternity && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: SEGMENT_COLOR['father-paternity'] }]} />
            <Text style={styles.legendText}>
              {t('calc.paternityLegend', {
                parent: parentLabel('father', mode, t),
                weeks: formatWeeks(paternity.weeks),
              })}
            </Text>
          </View>
        )}
      </View>
    </FadeIn>
  )
}

function PeriodRow({ period, mode, t }: { period: Period; mode: Mode; t: T }) {
  const weeksText =
    period.workPercent > 0
      ? t('calc.weeksWork', {
          base: formatWeeks(period.baseWeeks),
          weeks: formatWeeks(period.weeks),
          percent: period.workPercent,
        })
      : t('calc.weeks', { weeks: formatWeeks(period.weeks) })

  return (
    <View style={styles.periodRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.periodTitle}>{periodLabel(period.type, mode, t)}</Text>
        <Text style={styles.periodMeta}>
          {weeksText} · {period.ratePercent}%
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AnimatedNumber
          value={period.monthlyAmount}
          format={(n) => t('calc.perMonth', { amount: formatPLN(n) })}
          style={styles.periodMonthly}
        />
        <Text style={styles.periodTotal}>
          {t('calc.totalShort', { amount: formatPLN(period.totalAmount) })}
        </Text>
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
  title: { fontSize: 28, fontWeight: '800', color: '#14213d' },
  subtitle: { fontSize: 15, color: '#666' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    gap: 10,
    boxShadow: '0 6px 20px rgba(20, 33, 61, 0.07)',
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
  resultHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  printButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#0b3a5e',
  },
  printButtonHover: { backgroundColor: '#eef2f8' },
  printButtonText: { color: '#0b3a5e', fontWeight: '700', fontSize: 14 },
  timelineWrap: {
    backgroundColor: '#f7f9fc',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: '#14213d' },
  timelineBar: {
    flexDirection: 'row',
    height: 34,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  timelineSegment: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 2,
    borderRightColor: '#fff',
  },
  timelineSegmentText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  timelineMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  timelineAxis: { flexDirection: 'row', height: 18, position: 'relative' },
  timelineAxisText: { fontSize: 12, color: '#5b6475', fontWeight: '600' },
  timelineAxisMarker: {
    position: 'absolute',
    fontSize: 11,
    color: '#5b6475',
    transform: [{ translateX: -22 }],
  },
  legend: { gap: 6, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontSize: 13, color: '#333', flex: 1 },
  grandTotalBox: {
    marginTop: 8,
    backgroundColor: '#0b3a5e',
    borderRadius: 14,
    padding: 18,
    gap: 4,
  },
  grandTotalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  grandTotalValue: { color: '#ffc857', fontSize: 30, fontWeight: '800' },
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
