import { View, Text, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { Stack, router, Href } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useIsAdmin } from '../features/admin/useIsAdmin'
import { FadeIn } from '../components/ui/FadeIn'
import { HoverCard } from '../components/ui/HoverCard'
import { FloatingBlobs } from '../components/ui/FloatingBlobs'
import { colors, gradients, radius } from '../components/ui/theme'
import { useLanguage } from '../i18n/LanguageContext'

type Tile = {
  icon: string
  key: string
  href: Href
  tint: string
}

const TILES: Tile[] = [
  { icon: '🧮', key: 'calculator', href: '/calculator', tint: '#e8f0fe' },
  { icon: '📂', key: 'cases', href: '/cases', tint: '#fff4e0' },
  { icon: '🤰', key: 'pregnancy', href: '/pregnancy', tint: '#fde8ef' },
  { icon: '🏛️', key: 'zus', href: '/zus', tint: '#e6f6ef' },
  { icon: '⚠️', key: 'risks', href: '/risks', tint: '#fff1e6' },
  { icon: '✅', key: 'checklist', href: '/timeline', tint: '#eaf7ee' },
  { icon: '💛', key: 'support', href: '/support', tint: '#fff8dc' },
  { icon: '🗣️', key: 'phrases', href: '/phrasebook', tint: '#f1ebfd' },
]

const ADMIN_TILE: Tile = { icon: '🛠️', key: 'admin', href: '/admin', tint: '#eceff4' }

const MAX_CONTENT = 1160
const GAP = 16

const PILLS = ['home.pill1', 'home.pill2', 'home.pill3', 'home.pill4', 'home.pill5']

export default function HomeScreen() {
  const { isAdmin } = useIsAdmin()
  const { t } = useLanguage()
  const { width } = useWindowDimensions()
  const tiles = isAdmin ? [...TILES, ADMIN_TILE] : TILES

  // Responsive grid: 3 / 2 / 1 columns, tiles sized to fill each row exactly
  const compact = width < 640
  const columns = width >= 1000 ? 3 : width >= 640 ? 2 : 1
  const padding = compact ? 14 : 24
  const contentWidth = Math.min(width, MAX_CONTENT) - padding * 2
  const tileWidth = Math.floor((contentWidth - GAP * (columns - 1)) / columns)

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { padding },
        compact && styles.containerCompact,
      ]}
    >
      <Stack.Screen options={{ title: t('home.title'), contentStyle: styles.fullWidth }} />

      {/* ---------- Hero ---------- */}
      <FadeIn>
        <LinearGradient
          colors={gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, compact && styles.heroCompact]}
        >
          <FloatingBlobs />

          <Text style={styles.heroKicker}>{t('home.kicker')}</Text>
          <Text style={[styles.heroTitle, compact && styles.heroTitleCompact]}>
            {t('home.heroTitle')}
          </Text>
          <Text style={styles.heroText}>
            {t('home.heroText')}
          </Text>

          <View style={styles.heroButtons}>
            <Pressable
              onPress={() => router.push('/calculator')}
              style={({ pressed, hovered }: any) => [
                styles.ctaPrimary,
                hovered && styles.ctaHover,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaPrimaryText}>{t('home.ctaCalc')}</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/zus')}
              style={({ pressed, hovered }: any) => [
                styles.ctaSecondary,
                hovered && styles.ctaSecondaryHover,
                pressed && styles.ctaPressed,
              ]}
            >
              <Text style={styles.ctaSecondaryText}>{t('home.ctaZus')}</Text>
            </Pressable>
          </View>

          <View style={styles.pills}>
            {PILLS.map((p) => (
              <Text key={p} style={styles.pill}>
                {t(p)}
              </Text>
            ))}
          </View>
        </LinearGradient>
      </FadeIn>

      {/* ---------- Tiles ---------- */}
      <FadeIn delay={150}>
        <Text style={styles.sectionTitle}>{t('home.section')}</Text>
      </FadeIn>

      <View style={styles.grid}>
        {tiles.map((tile, i) => (
          <FadeIn
            key={tile.key}
            delay={200 + i * 70}
            style={{ width: tileWidth }}
          >
            <HoverCard onPress={() => router.push(tile.href)} style={styles.tile}>
              <View style={[styles.iconBubble, { backgroundColor: tile.tint }]}>
                <Text style={styles.tileIcon}>{tile.icon}</Text>
              </View>
              <Text style={styles.tileTitle}>{t(`tile.${tile.key}.title`)}</Text>
              <Text style={styles.tileText}>{t(`tile.${tile.key}.text`)}</Text>
              <Text style={styles.tileLink}>{t('home.open')}</Text>
            </HoverCard>
          </FadeIn>
        ))}
      </View>

      <FadeIn delay={200 + tiles.length * 70}>
        <Text style={styles.footer}>
          {t('home.footer')}
        </Text>
      </FadeIn>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%', backgroundColor: colors.bg },
  container: {
    width: '100%',
    maxWidth: MAX_CONTENT,
    alignSelf: 'center',
    gap: 18,
    paddingBottom: 48,
  },
  containerCompact: { gap: 14 },
  hero: {
    borderRadius: radius.xl,
    padding: 36,
    gap: 14,
    overflow: 'hidden',
  },
  heroCompact: { padding: 22, borderRadius: radius.lg },
  heroKicker: {
    color: colors.sun,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: { color: '#fff', fontSize: 38, lineHeight: 46, fontWeight: '800' },
  heroTitleCompact: { fontSize: 26, lineHeight: 33 },
  heroText: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 620,
  },
  heroButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  ctaPrimary: {
    backgroundColor: colors.sun,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  ctaPrimaryText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  ctaSecondary: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 999,
  },
  ctaSecondaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaHover: { transform: [{ translateY: -2 }], boxShadow: '0 8px 20px rgba(0,0,0,0.2)' },
  ctaSecondaryHover: { backgroundColor: 'rgba(255,255,255,0.12)' },
  ctaPressed: { transform: [{ scale: 0.97 }] },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pill: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    gap: 8,
    minHeight: 200,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tileIcon: { fontSize: 26 },
  tileTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  tileText: { fontSize: 14, color: colors.muted, lineHeight: 21, flex: 1 },
  tileLink: { fontSize: 14, fontWeight: '700', color: colors.primaryLight, marginTop: 4 },
  footer: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 },
})
