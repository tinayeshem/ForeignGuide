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
import {
  MOCK_PROFILES,
  MockProfile,
  getMockProfile,
  isSicknessInsuredToday,
  simulatedReference,
} from '../features/zus/mockZus'

type Stage = 'login' | 'confirm' | 'account'
type Tab = 'insurance' | 'ezla' | 'certificates' | 'applications'
type FormType = 'zam' | 'leave' | 'birth'
type LeaveType = 'maternity' | 'parental' | 'paternity'

function formatPLN(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec} zł`
}

function formatDate(value: string | null): string {
  if (!value) return 'now'
  const [y, m, d] = value.split('-')
  return `${d}.${m}.${y}`
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

export default function ZusScreen() {
  const [stage, setStage] = useState<Stage>('login')
  const [profileId, setProfileId] = useState(MOCK_PROFILES[0].id)
  const [loading, setLoading] = useState(false)
  const [code] = useState(() => String(Math.floor(100000 + Math.random() * 900000)))
  const [tab, setTab] = useState<Tab>('insurance')

  const profile = getMockProfile(profileId)

  const confirmLogin = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStage('account')
    }, 1200)
  }

  // ---------- 1. Login ----------
  if (stage === 'login') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen options={{ title: 'My ZUS (simulation)' }} />
        <SimulationBanner />

        <View style={styles.loginCard}>
          <Text style={styles.title}>🏛️ Log in to your ZUS account</Text>
          <Text style={styles.body}>
            In the real service you log in to PUE/eZUS with mObywatel, a trusted profile or online
            banking. Here you can try the flow with a fictional person.
          </Text>

          <Text style={styles.label}>Choose a demo person</Text>
          {MOCK_PROFILES.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.profileOption, profileId === p.id && styles.profileOptionActive]}
              onPress={() => setProfileId(p.id)}
            >
              <Text style={styles.profileName}>
                {profileId === p.id ? '● ' : '○ '}
                {p.name}
              </Text>
              <Text style={styles.muted}>{p.summary}</Text>
            </Pressable>
          ))}

          <Pressable style={styles.mobywatelButton} onPress={() => setStage('confirm')}>
            <Text style={styles.mobywatelText}>Log in with mObywatel</Text>
          </Pressable>
        </View>
      </ScrollView>
    )
  }

  // ---------- 2. Confirm in mObywatel ----------
  if (stage === 'confirm') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen options={{ title: 'My ZUS (simulation)' }} />
        <SimulationBanner />

        <View style={styles.loginCard}>
          <Text style={styles.title}>📱 Confirm in the mObywatel app</Text>
          <Text style={styles.body}>
            Open mObywatel on your phone and check that the code matches:
          </Text>
          <Text style={styles.code}>
            {code.slice(0, 3)} {code.slice(3)}
          </Text>

          {loading ? (
            <View style={styles.row}>
              <ActivityIndicator />
              <Text style={styles.body}>Verifying identity…</Text>
            </View>
          ) : (
            <>
              <Pressable style={styles.mobywatelButton} onPress={confirmLogin}>
                <Text style={styles.mobywatelText}>I confirmed in the app</Text>
              </Pressable>
              <Pressable style={styles.outlineButton} onPress={() => setStage('login')}>
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    )
  }

  // ---------- 3. Account ----------
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'My ZUS (simulation)' }} />
      <SimulationBanner />

      <View style={styles.accountHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.accountName}>{profile.name}</Text>
          <Text style={styles.muted}>PESEL {profile.pesel} · logged in with mObywatel</Text>
        </View>
        <Pressable
          style={styles.outlineButton}
          onPress={() => {
            setStage('login')
            setTab('insurance')
          }}
        >
          <Text style={styles.outlineButtonText}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <TabButton label="🛡️ Insurance" active={tab === 'insurance'} onPress={() => setTab('insurance')} />
        <TabButton label="🩺 e-ZLA" active={tab === 'ezla'} onPress={() => setTab('ezla')} />
        <TabButton label="📜 Certificates" active={tab === 'certificates'} onPress={() => setTab('certificates')} />
        <TabButton label="📝 Applications" active={tab === 'applications'} onPress={() => setTab('applications')} />
      </View>

      {tab === 'insurance' && <InsuranceTab profile={profile} />}
      {tab === 'ezla' && <EzlaTab profile={profile} />}
      {tab === 'certificates' && <CertificatesTab key={profile.id} profile={profile} />}
      {tab === 'applications' && <ApplicationsTab key={profile.id} profile={profile} />}
    </ScrollView>
  )
}

// =====================================================
// Tabs
// =====================================================

function InsuranceTab({ profile }: { profile: MockProfile }) {
  const insured = isSicknessInsuredToday(profile)

  return (
    <View style={styles.tabContent}>
      <View style={[styles.statusCard, insured ? styles.statusOk : styles.statusBad]}>
        <Text style={styles.statusTitle}>
          {insured ? '✅ Covered by sickness insurance today' : '❌ NOT covered by sickness insurance'}
        </Text>
        <Text style={styles.body}>
          {insured
            ? 'You can get sickness benefit in pregnancy and maternity benefit, if the other conditions are met.'
            : 'Without sickness insurance there is no sickness benefit in pregnancy and no maternity benefit. You can join voluntary sickness insurance – usually with a 90-day waiting period.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Insurance history</Text>
        {profile.insurance.map((p, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={styles.rowTitle}>{p.title}</Text>
            <Text style={styles.body}>{p.payer}</Text>
            <Text style={styles.muted}>
              {formatDate(p.from)} – {formatDate(p.to)} · sickness insurance:{' '}
              {p.sickness === 'compulsory' ? 'compulsory' : p.sickness === 'voluntary' ? 'voluntary' : 'none'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function EzlaTab({ profile }: { profile: MockProfile }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Electronic sick notes (e-ZLA)</Text>
        <Text style={styles.muted}>
          Code "B" means sick leave during pregnancy – the benefit is 100% of the benefit base.
        </Text>
        {profile.ezla.map((z) => (
          <View key={z.number} style={styles.listRow}>
            <View style={styles.rowHeader}>
              <Text style={styles.rowTitle}>{z.number}</Text>
              <Text style={styles.codeBadge}>code {z.code}</Text>
            </View>
            <Text style={styles.body}>
              {formatDate(z.from)} – {formatDate(z.to)} · {z.reason}
            </Text>
            <Text style={styles.muted}>Status: {z.status}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function CertificatesTab({ profile }: { profile: MockProfile }) {
  const [issued, setIssued] = useState<string | null>(null)
  const hasArrears = profile.arrears > 0

  return (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Certificate of no contribution arrears</Text>
        <Text style={styles.body}>
          Confirms you have no unpaid ZUS contributions. Important for people running a business: ZUS
          does not pay benefits while there is a debt.
        </Text>

        <Text style={styles.body}>
          Account balance:{' '}
          <Text style={[styles.bold, { color: hasArrears ? '#c0392b' : '#27ae60' }]}>
            {hasArrears ? `${formatPLN(profile.arrears)} unpaid` : 'no arrears'}
          </Text>
        </Text>

        {!issued && (
          <Pressable style={styles.button} onPress={() => setIssued(simulatedReference('SIM-ZAS'))}>
            <Text style={styles.buttonText}>Request certificate</Text>
          </Pressable>
        )}

        {issued && !hasArrears && (
          <View style={[styles.resultCard, styles.statusOk]}>
            <Text style={styles.statusTitle}>✅ Certificate issued</Text>
            <Text style={styles.body}>Number: {issued}</Text>
            <Text style={styles.body}>
              {profile.name} has no contribution arrears as of {formatDate(new Date().toISOString().slice(0, 10))}.
            </Text>
          </View>
        )}

        {issued && hasArrears && (
          <View style={[styles.resultCard, styles.statusBad]}>
            <Text style={styles.statusTitle}>❌ Certificate refused</Text>
            <Text style={styles.body}>
              There are unpaid contributions of {formatPLN(profile.arrears)}. Pay the debt first – until
              then, benefits will not be paid.
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

function ApplicationsTab({ profile }: { profile: MockProfile }) {
  const [form, setForm] = useState<FormType>('zam')
  const [childBirth, setChildBirth] = useState('')
  const [startDate, setStartDate] = useState('')
  const [weeks, setWeeks] = useState('20')
  const [leaveType, setLeaveType] = useState<LeaveType>('maternity')
  const [option815, setOption815] = useState(false)
  const [bankAccount, setBankAccount] = useState('')
  const [childName, setChildName] = useState('')
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const insured = isSicknessInsuredToday(profile)

  const submit = () => {
    setError(null)

    if (form === 'birth') {
      if (!childName.trim() || !isValidDate(childBirth)) {
        setError('Enter the child\'s name and birth date (YYYY-MM-DD).')
        return
      }
    } else {
      if (!isValidDate(childBirth) || !isValidDate(startDate)) {
        setError('Enter valid dates (YYYY-MM-DD).')
        return
      }
      const w = parseFloat(weeks)
      if (isNaN(w) || w <= 0) {
        setError('Enter the number of weeks.')
        return
      }
      if (form === 'zam' && bankAccount.replace(/\s/g, '').length < 10) {
        setError('Enter a bank account number for the payment.')
        return
      }
    }

    const prefix = form === 'zam' ? 'SIM-ZAM' : form === 'leave' ? 'SIM-LEAVE' : 'SIM-USC'
    setSubmitted(simulatedReference(prefix))
  }

  const reset = () => {
    setSubmitted(null)
    setError(null)
  }

  const FORM_INFO: Record<FormType, { title: string; text: string }> = {
    zam: {
      title: 'ZAM – application for maternity benefit',
      text: 'For people on a mandate contract or running a business. Submitted to ZUS on PUE/eZUS. Employees apply through their employer.',
    },
    leave: {
      title: 'Leave application to your employer',
      text: 'Maternity, parental or paternity leave. Parental leave: at least 21 days before it starts. Paternity leave: at least 7 days before.',
    },
    birth: {
      title: 'Copy of the birth certificate (gov.pl)',
      text: 'Order a copy of the child\'s birth certificate online. It is often needed for benefit and leave applications.',
    },
  }

  if (submitted) {
    return (
      <View style={styles.tabContent}>
        <View style={[styles.resultCard, styles.statusOk]}>
          <Text style={styles.statusTitle}>✅ Application sent (simulation)</Text>
          <Text style={styles.body}>{FORM_INFO[form].title}</Text>
          <Text style={styles.body}>
            Confirmation number (UPO): <Text style={styles.bold}>{submitted}</Text>
          </Text>
          <Text style={styles.muted}>
            In the real service you would receive an official confirmation of submission (UPO) on
            your account.
          </Text>
        </View>
        <Pressable style={styles.outlineButton} onPress={reset}>
          <Text style={styles.outlineButtonText}>Fill in another application</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.row}>
        <Chip label="ZAM (ZUS)" selected={form === 'zam'} onPress={() => setForm('zam')} />
        <Chip label="Leave (employer)" selected={form === 'leave'} onPress={() => setForm('leave')} />
        <Chip label="Birth certificate" selected={form === 'birth'} onPress={() => setForm('birth')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{FORM_INFO[form].title}</Text>
        <Text style={styles.muted}>{FORM_INFO[form].text}</Text>

        <Field label="Applicant" value={profile.name} editable={false} />

        {form === 'zam' && !insured && (
          <View style={[styles.resultCard, styles.statusBad]}>
            <Text style={styles.body}>
              ⚠️ This person is not covered by sickness insurance – ZUS would refuse this
              application.
            </Text>
          </View>
        )}

        {form === 'birth' && (
          <Field label="Child's full name" value={childName} onChange={setChildName} />
        )}

        <Field
          label="Child's birth date (YYYY-MM-DD)"
          value={childBirth}
          onChange={setChildBirth}
          placeholder="2026-11-01"
        />

        {form !== 'birth' && (
          <>
            {form === 'leave' && (
              <>
                <Text style={styles.label}>Type of leave</Text>
                <View style={styles.row}>
                  <Chip label="Maternity" selected={leaveType === 'maternity'} onPress={() => setLeaveType('maternity')} />
                  <Chip label="Parental" selected={leaveType === 'parental'} onPress={() => setLeaveType('parental')} />
                  <Chip label="Paternity" selected={leaveType === 'paternity'} onPress={() => setLeaveType('paternity')} />
                </View>
              </>
            )}

            <Field
              label="Leave / benefit from (YYYY-MM-DD)"
              value={startDate}
              onChange={setStartDate}
              placeholder="2026-11-01"
            />
            <Field label="Number of weeks" value={weeks} onChange={setWeeks} numeric />

            {(form === 'zam' || leaveType !== 'paternity') && (
              <Pressable style={styles.toggleRow} onPress={() => setOption815(!option815)}>
                <View style={[styles.toggleBox, option815 && styles.toggleBoxOn]}>
                  {option815 && <Text style={styles.toggleCheck}>✓</Text>}
                </View>
                <Text style={styles.toggleLabel}>
                  81.5% option – applying for the whole maternity and parental leave at once
                </Text>
              </Pressable>
            )}

            {form === 'zam' && (
              <Field
                label="Bank account for the payment"
                value={bankAccount}
                onChange={setBankAccount}
                placeholder="PL00 0000 0000 0000 0000 0000 0000"
              />
            )}
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable style={styles.button} onPress={submit}>
          <Text style={styles.buttonText}>Sign and send (simulation)</Text>
        </Pressable>
      </View>
    </View>
  )
}

// =====================================================
// Small components
// =====================================================

function SimulationBanner() {
  return (
    <View style={styles.simBanner}>
      <Text style={styles.simText}>
        🧪 SIMULATION – fictional data. Not connected to ZUS, PUE/eZUS or mObywatel.
      </Text>
    </View>
  )
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  numeric,
  editable = true,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  numeric?: boolean
  editable?: boolean
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputDisabled]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        editable={editable}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '700' },
  body: { fontSize: 15, color: '#333', lineHeight: 22 },
  bold: { fontWeight: '700' },
  muted: { fontSize: 13, color: '#777' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  simBanner: { backgroundColor: '#fff4e5', borderRadius: 10, padding: 10 },
  simText: { color: '#8a4b00', fontSize: 13, fontWeight: '600' },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    gap: 12,
    elevation: 2,
  },
  profileOption: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    gap: 2,
  },
  profileOptionActive: { borderColor: '#0b3a5e', backgroundColor: '#f2f6fa' },
  profileName: { fontSize: 15, fontWeight: '600' },
  mobywatelButton: {
    backgroundColor: '#d4213d',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  mobywatelText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  code: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    color: '#0b3a5e',
    paddingVertical: 8,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  accountName: { fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tab: {
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0b3a5e',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#0b3a5e' },
  tabText: { color: '#0b3a5e', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },
  tabContent: { gap: 12 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  statusCard: { borderRadius: 12, padding: 16, gap: 6, borderWidth: 1 },
  resultCard: { borderRadius: 10, padding: 12, gap: 4, borderWidth: 1 },
  statusOk: { backgroundColor: '#eaf7ee', borderColor: '#27ae60' },
  statusBad: { backgroundColor: '#fdecea', borderColor: '#c0392b' },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  listRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
    gap: 2,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  codeBadge: {
    backgroundColor: '#0b3a5e',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  field: { gap: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  inputDisabled: { backgroundColor: '#f2f2f2', color: '#666' },
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
  button: {
    backgroundColor: '#0b3a5e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#0b3a5e',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  outlineButtonText: { color: '#0b3a5e', fontWeight: '600' },
  errorText: { color: '#c0392b' },
})
