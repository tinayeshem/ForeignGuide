import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../lib/supabase'
import { FadeIn } from './ui/FadeIn'
import { FloatingBlobs } from './ui/FloatingBlobs'
import { colors, gradients, radius, shadow } from './ui/theme'
import { LanguageToggle } from './ui/LanguageToggle'
import { useLanguage } from '../i18n/LanguageContext'

const FEATURES = [
  { icon: '🧮', key: 'auth.feature1' },
  { icon: '🤰', key: 'auth.feature2' },
  { icon: '⏰', key: 'auth.feature3' },
  { icon: '🌍', key: 'auth.feature4' },
]

export default function Auth() {
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const { t } = useLanguage()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && password.length >= 6 && !loading

  const signIn = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const signUp = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })
    if (error) {
      setError(error.message)
    } else if (!data.session) {
      setMessage(t('auth.checkInbox'))
    }
    setLoading(false)
  }

  const brandPanel = (
    <LinearGradient
      colors={gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.brand, wide ? styles.brandWide : styles.brandNarrow]}
    >
      <FloatingBlobs />
      <FadeIn style={styles.brandTop}>
        <Text style={styles.logo}>👶 {t('home.title')}</Text>
        <LanguageToggle variant="light" />
      </FadeIn>
      <FadeIn delay={120}>
        <Text style={[styles.brandTitle, !wide && styles.brandTitleNarrow]}>
          {t('auth.brandTitle')}
        </Text>
      </FadeIn>
      {wide && (
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <FadeIn key={f.key} delay={260 + i * 90}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureText}>{t(f.key)}</Text>
              </View>
            </FadeIn>
          ))}
        </View>
      )}
    </LinearGradient>
  )

  const form = (
    <FadeIn delay={wide ? 200 : 150} style={styles.formWrap}>
      <View style={[styles.card, shadow.card]}>
        <Text style={styles.title}>{t('auth.welcome')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          placeholder="email@example.com"
          placeholderTextColor="#9aa3b2"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>{t('auth.password')}</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor="#9aa3b2"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            onSubmitEditing={() => canSubmit && signIn()}
          />
          <Pressable style={styles.eye} onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeText}>{showPassword ? t('auth.hide') : t('auth.show')}</Text>
          </Pressable>
        </View>

        {error && (
          <FadeIn distance={6} duration={250}>
            <Text style={styles.error}>⚠️ {error}</Text>
          </FadeIn>
        )}
        {message && (
          <FadeIn distance={6} duration={250}>
            <Text style={styles.message}>✅ {message}</Text>
          </FadeIn>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
          onPress={signIn}
          disabled={!canSubmit}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.signIn')}</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.buttonOutline,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
          onPress={signUp}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonOutlineText}>{t('auth.createAccount')}</Text>
        </Pressable>

        <Text style={styles.small}>
          {t('auth.disclaimer')}
        </Text>
      </View>
    </FadeIn>
  )

  if (wide) {
    return (
      <View style={styles.wideRoot}>
        {brandPanel}
        <View style={styles.wideFormSide}>{form}</View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.narrowRoot} contentContainerStyle={styles.narrowContent}>
      {brandPanel}
      {form}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wideRoot: { flex: 1, flexDirection: 'row', backgroundColor: colors.bg },
  wideFormSide: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  narrowRoot: { flex: 1, backgroundColor: colors.bg },
  narrowContent: { paddingBottom: 40 },
  brand: { overflow: 'hidden', justifyContent: 'center', gap: 20 },
  brandWide: { flex: 1, padding: 56 },
  brandNarrow: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 72,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  brandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  logo: { color: '#fff', fontSize: 18, fontWeight: '800', opacity: 0.95 },
  brandTitle: { color: '#fff', fontSize: 44, lineHeight: 52, fontWeight: '800' },
  brandTitleNarrow: { fontSize: 30, lineHeight: 38 },
  features: { gap: 14, marginTop: 8 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  featureIcon: { fontSize: 22 },
  featureText: { color: '#fff', fontSize: 15, flex: 1, lineHeight: 21 },
  formWrap: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 28,
    gap: 8,
    marginHorizontal: 16,
    marginTop: -40,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 8, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#f9fafc',
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, paddingRight: 70 },
  eye: { position: 'absolute', right: 12, paddingVertical: 6, paddingHorizontal: 8 },
  eyeText: { color: colors.primaryLight, fontWeight: '700', fontSize: 13 },
  error: { color: colors.danger, marginTop: 8 },
  message: { color: colors.success, marginTop: 8 },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonPressed: { transform: [{ scale: 0.98 }], opacity: 0.9 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    padding: 16,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  buttonOutlineText: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.4 },
  small: { fontSize: 12, color: colors.muted, marginTop: 12, textAlign: 'center' },
})
