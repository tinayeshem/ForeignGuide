import { useCallback, useEffect, useState } from 'react'
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
import { useIsAdmin } from '../features/admin/useIsAdmin'
import {
  AdminParam,
  InfoCardDraft,
  deleteInfoCard,
  getAdminParameters,
  getAllInfoCards,
  saveInfoCard,
  updateParameter,
} from '../features/admin/adminService'
import { InfoCard, InfoCategory } from '../features/info/infoService'

type Tab = 'params' | 'cards'

const CATEGORY_LABEL: Record<string, string> = {
  maternity: '👶 Maternity leave',
  parental: '👨‍👩‍👧 Parental leave',
  paternity: '👨 Paternity leave',
  rates: '💰 Benefit rates',
  base: '🧾 Benefit base',
  adoption: '🏠 Adoption / foster care',
  pregnancy: '🤰 Pregnancy',
}

const CARD_CATEGORIES: { key: InfoCategory; label: string }[] = [
  { key: 'risk', label: '⚠️ Risk' },
  { key: 'right', label: '🛡️ Right' },
  { key: 'charity', label: '💛 Support organisation' },
]

function formatDateTime(value: string | null): string {
  if (!value) return '–'
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminScreen() {
  const { isAdmin, checking } = useIsAdmin()
  const [tab, setTab] = useState<Tab>('params')

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Admin panel' }} />
        <Text style={styles.noAccessTitle}>🔒 Admin only</Text>
        <Text style={styles.body}>Your account does not have admin access.</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Admin panel' }} />

      <Text style={styles.title}>🛠️ Admin panel</Text>
      <View style={styles.liveBox}>
        <Text style={styles.liveText}>
          Changes go live immediately for all users – no new app version needed. Use this when the
          law changes (rates, leave lengths) or to update information.
        </Text>
      </View>

      <View style={styles.tabs}>
        <TabButton label="📊 Parameters" active={tab === 'params'} onPress={() => setTab('params')} />
        <TabButton label="📝 Information cards" active={tab === 'cards'} onPress={() => setTab('cards')} />
      </View>

      {tab === 'params' ? <ParametersTab /> : <CardsTab />}
    </ScrollView>
  )
}

// =====================================================
// Parameters tab
// =====================================================

function ParametersTab() {
  const [params, setParams] = useState<AdminParam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminParameters()
      .then(setParams)
      .catch((e) => setError(e?.message ?? 'Could not load parameters'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <ActivityIndicator size="large" />
  if (error) return <Text style={styles.errorText}>{error}</Text>

  const categories = Array.from(new Set(params.map((p) => p.category)))

  const replaceParam = (updated: AdminParam) => {
    setParams((prev) => prev.map((p) => (p.key === updated.key ? updated : p)))
  }

  return (
    <View style={styles.tabContent}>
      {categories.map((cat) => (
        <View key={cat} style={styles.section}>
          <Text style={styles.sectionTitle}>{CATEGORY_LABEL[cat] ?? cat}</Text>
          {params
            .filter((p) => p.category === cat)
            .map((p) => (
              <ParamRow key={p.key} param={p} onSaved={replaceParam} />
            ))}
        </View>
      ))}
    </View>
  )
}

function ParamRow({ param, onSaved }: { param: AdminParam; onSaved: (p: AdminParam) => void }) {
  const [value, setValue] = useState(String(param.value))
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null)

  const parsed = parseFloat(value.replace(',', '.'))
  const valid = !isNaN(parsed) && parsed >= 0
  const dirty = valid && parsed !== param.value

  const save = async () => {
    if (!valid) return
    setSaving(true)
    setStatus(null)
    try {
      const updated = await updateParameter(param.key, parsed)
      onSaved(updated)
      setValue(String(updated.value))
      setStatus({ ok: true, text: 'Saved' })
    } catch (e: any) {
      setStatus({ ok: false, text: e?.message ?? 'Could not save' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.paramRow}>
      <View style={styles.paramInfo}>
        <Text style={styles.paramLabel}>{param.label}</Text>
        <Text style={styles.paramMeta}>
          {param.key} · last change {formatDateTime(param.updated_at)}
        </Text>
        {status && (
          <Text style={[styles.paramStatus, { color: status.ok ? '#27ae60' : '#c0392b' }]}>
            {status.ok ? '✅ ' : '⚠️ '}
            {status.text}
          </Text>
        )}
      </View>

      <View style={styles.paramControls}>
        <TextInput
          style={[styles.paramInput, !valid && styles.inputInvalid, dirty && styles.inputDirty]}
          value={value}
          onChangeText={(v) => {
            setValue(v)
            setStatus(null)
          }}
          keyboardType="decimal-pad"
        />
        {param.unit && <Text style={styles.paramUnit}>{param.unit}</Text>}
        <Pressable
          style={[styles.smallButton, (!dirty || saving) && styles.buttonDisabled]}
          onPress={save}
          disabled={!dirty || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.smallButtonText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

// =====================================================
// Information cards tab
// =====================================================

const emptyDraft = (): InfoCardDraft => ({
  category: 'risk',
  title: '',
  body: '',
  link_url: '',
  sort_order: 99,
})

function CardsTab() {
  const [cards, setCards] = useState<InfoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<InfoCardDraft | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCards(await getAllInfoCards())
    } catch (e: any) {
      setError(e?.message ?? 'Could not load cards')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onSaved = async () => {
    setEditing(null)
    await load()
  }

  if (loading && cards.length === 0) return <ActivityIndicator size="large" />

  return (
    <View style={styles.tabContent}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {editing && !editing.id ? (
        <CardEditor draft={editing} onCancel={() => setEditing(null)} onSaved={onSaved} />
      ) : (
        <Pressable style={styles.button} onPress={() => setEditing(emptyDraft())}>
          <Text style={styles.buttonText}>+ Add new card</Text>
        </Pressable>
      )}

      {CARD_CATEGORIES.map((cat) => {
        const list = cards.filter((c) => c.category === cat.key)
        return (
          <View key={cat.key} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {cat.label} ({list.length})
            </Text>

            {list.length === 0 && <Text style={styles.muted}>No cards yet.</Text>}

            {list.map((card) =>
              editing?.id === card.id ? (
                <CardEditor
                  key={card.id}
                  draft={editing}
                  onCancel={() => setEditing(null)}
                  onSaved={onSaved}
                />
              ) : (
                <View key={card.id} style={styles.cardRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text style={styles.muted} numberOfLines={2}>
                      {card.body}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.outlineButton}
                    onPress={() =>
                      setEditing({
                        id: card.id,
                        category: card.category,
                        title: card.title,
                        body: card.body,
                        link_url: card.link_url ?? '',
                        sort_order: card.sort_order,
                      })
                    }
                  >
                    <Text style={styles.outlineButtonText}>Edit</Text>
                  </Pressable>
                </View>
              )
            )}
          </View>
        )
      })}
    </View>
  )
}

function CardEditor({
  draft,
  onCancel,
  onSaved,
}: {
  draft: InfoCardDraft
  onCancel: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<InfoCardDraft>(draft)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = form.title.trim().length > 0 && form.body.trim().length > 0

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await saveInfoCard(form)
      onSaved()
    } catch (e: any) {
      setError(e?.message ?? 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!form.id) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setSaving(true)
    try {
      await deleteInfoCard(form.id)
      onSaved()
    } catch (e: any) {
      setError(e?.message ?? 'Could not delete')
      setSaving(false)
    }
  }

  return (
    <View style={styles.editor}>
      <Text style={styles.editorTitle}>{form.id ? 'Edit card' : 'New card'}</Text>

      <View style={styles.row}>
        {CARD_CATEGORIES.map((c) => (
          <Pressable
            key={c.key}
            style={[styles.chip, form.category === c.key && styles.chipSelected]}
            onPress={() => setForm({ ...form, category: c.key })}
          >
            <Text style={[styles.chipText, form.category === c.key && styles.chipTextSelected]}>
              {c.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={form.title}
        onChangeText={(v) => setForm({ ...form, title: v })}
      />

      <Text style={styles.label}>Text</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={form.body}
        onChangeText={(v) => setForm({ ...form, body: v })}
        multiline
      />

      <Text style={styles.label}>Link (optional)</Text>
      <TextInput
        style={styles.input}
        value={form.link_url ?? ''}
        onChangeText={(v) => setForm({ ...form, link_url: v })}
        autoCapitalize="none"
        placeholder="https://"
      />

      <Text style={styles.label}>Order (lower = higher on the list)</Text>
      <TextInput
        style={[styles.input, { width: 100 }]}
        value={String(form.sort_order)}
        onChangeText={(v) => setForm({ ...form, sort_order: parseInt(v, 10) || 0 })}
        keyboardType="number-pad"
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.row}>
        <Pressable
          style={[styles.smallButton, (!valid || saving) && styles.buttonDisabled]}
          onPress={save}
          disabled={!valid || saving}
        >
          <Text style={styles.smallButtonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={onCancel}>
          <Text style={styles.outlineButtonText}>Cancel</Text>
        </Pressable>
        {form.id && (
          <Pressable style={styles.deleteButton} onPress={remove} disabled={saving}>
            <Text style={styles.deleteButtonText}>
              {confirmDelete ? 'Tap again to delete' : 'Delete'}
            </Text>
          </Pressable>
        )}
      </View>
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

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  container: { padding: 16, gap: 12, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 15, color: '#333' },
  muted: { fontSize: 14, color: '#777' },
  noAccessTitle: { fontSize: 22, fontWeight: '700' },
  liveBox: { backgroundColor: '#fff4e5', borderRadius: 12, padding: 12 },
  liveText: { color: '#8a4b00', fontSize: 14, lineHeight: 20 },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0b3a5e',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#0b3a5e' },
  tabText: { color: '#0b3a5e', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabContent: { gap: 12 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  paramRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paramInfo: { flexGrow: 1, flexBasis: 240, gap: 2 },
  paramLabel: { fontSize: 15, fontWeight: '600' },
  paramMeta: { fontSize: 12, color: '#999' },
  paramStatus: { fontSize: 13, fontWeight: '600' },
  paramControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paramInput: {
    width: 90,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 15,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
  inputInvalid: { borderColor: '#c0392b' },
  inputDirty: { borderColor: '#e67e22', backgroundColor: '#fffaf2' },
  paramUnit: { fontSize: 13, color: '#666', minWidth: 50 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  editor: {
    backgroundColor: '#f5f8fb',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#d0dbe6',
  },
  editorTitle: { fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0b3a5e',
    backgroundColor: '#fff',
  },
  chipSelected: { backgroundColor: '#0b3a5e' },
  chipText: { color: '#0b3a5e', fontSize: 13 },
  chipTextSelected: { color: '#fff' },
  button: { backgroundColor: '#0b3a5e', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  smallButton: {
    backgroundColor: '#0b3a5e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  smallButtonText: { color: '#fff', fontWeight: '600' },
  buttonDisabled: { opacity: 0.35 },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#0b3a5e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  outlineButtonText: { color: '#0b3a5e', fontWeight: '600' },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#c0392b',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteButtonText: { color: '#c0392b', fontWeight: '600' },
  errorText: { color: '#c0392b' },
})
