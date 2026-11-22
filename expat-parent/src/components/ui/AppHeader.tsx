import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { router, usePathname, Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '../../lib/supabase'
import { useIsAdmin } from '../../features/admin/useIsAdmin'
import { FadeIn } from './FadeIn'
import { LanguageToggle } from './LanguageToggle'
import { useLanguage } from '../../i18n/LanguageContext'
import { colors } from './theme'

type NavItem = { labelKey: string; icon: string; href: Href; match: string }

const NAV: NavItem[] = [
  { labelKey: 'nav.home', icon: '🏠', href: '/', match: '/' },
  { labelKey: 'nav.calculator', icon: '🧮', href: '/calculator', match: '/calculator' },
  { labelKey: 'nav.cases', icon: '📂', href: '/cases', match: '/cases' },
  { labelKey: 'nav.pregnancy', icon: '🤰', href: '/pregnancy', match: '/pregnancy' },
  { labelKey: 'nav.zus', icon: '🏛️', href: '/zus', match: '/zus' },
  { labelKey: 'nav.checklist', icon: '✅', href: '/timeline', match: '/timeline' },
  { labelKey: 'nav.risks', icon: '⚠️', href: '/risks', match: '/risks' },
  { labelKey: 'nav.support', icon: '💛', href: '/support', match: '/support' },
  { labelKey: 'nav.phrases', icon: '🗣️', href: '/phrasebook', match: '/phrasebook' },
]

const ADMIN_ITEM: NavItem = { labelKey: 'nav.admin', icon: '🛠️', href: '/admin', match: '/admin' }

function isActive(pathname: string, match: string): boolean {
  if (match === '/') return pathname === '/'
  // Checklist also covers the step detail pages
  if (match === '/timeline' && pathname.startsWith('/step')) return true
  return pathname === match || pathname.startsWith(`${match}/`)
}

export function AppHeader() {
  const pathname = usePathname()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { isAdmin } = useIsAdmin()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)

  const items = isAdmin ? [...NAV, ADMIN_ITEM] : NAV
  const wide = width >= 1280

  const go = (href: Href) => {
    setMenuOpen(false)
    router.push(href)
  }

  const current = items.find((i) => isActive(pathname, i.match))

  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top }]}
      {...({ dataSet: { noprint: 'true' } } as any)}
    >
      <View style={styles.bar}>
        {/* Logo */}
        <Pressable onPress={() => go('/')} style={styles.logo}>
          <View style={styles.logoBubble}>
            <Text style={styles.logoEmoji}>👶</Text>
          </View>
          <Text style={styles.logoText}>Parent Guide</Text>
        </Pressable>

        {/* Desktop links */}
        {wide && (
          <View style={styles.links}>
            {items.map((item) => {
              const active = isActive(pathname, item.match)
              return (
                <Pressable
                  key={item.labelKey}
                  onPress={() => go(item.href)}
                  style={({ hovered, pressed }: any) => [
                    styles.link,
                    hovered && !active && styles.linkHover,
                    active && styles.linkActive,
                    pressed && styles.linkPressed,
                  ]}
                >
                  <Text style={[styles.linkText, active && styles.linkTextActive]}>
                    {item.icon} {t(item.labelKey)}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        )}

        {/* Right side */}
        <View style={styles.right}>
          <LanguageToggle />

          {!wide && current && width >= 520 && (
            <Text style={styles.currentLabel} numberOfLines={1}>
              {current.icon} {t(current.labelKey)}
            </Text>
          )}

          <Pressable
            onPress={() => supabase.auth.signOut()}
            style={({ hovered }: any) => [styles.signOut, hovered && styles.signOutHover]}
          >
            <Text style={styles.signOutText}>{t('nav.signOut')}</Text>
          </Pressable>

          {!wide && (
            <Pressable
              onPress={() => setMenuOpen(!menuOpen)}
              style={({ hovered }: any) => [styles.burger, hovered && styles.linkHover]}
              accessibilityLabel={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              <Text style={styles.burgerText}>{menuOpen ? '✕' : '☰'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Mobile / tablet menu */}
      {!wide && menuOpen && (
        <View style={styles.menu}>
          {items.map((item, i) => {
            const active = isActive(pathname, item.match)
            return (
              <FadeIn key={item.labelKey} delay={i * 30} distance={8} duration={250}>
                <Pressable
                  onPress={() => go(item.href)}
                  style={({ hovered }: any) => [
                    styles.menuItem,
                    hovered && styles.linkHover,
                    active && styles.linkActive,
                  ]}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuText, active && styles.linkTextActive]}>
                    {t(item.labelKey)}
                  </Text>
                  {active && <Text style={styles.menuDot}>●</Text>}
                </Pressable>
              </FadeIn>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    boxShadow: '0 2px 12px rgba(20, 33, 61, 0.06)',
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.sun,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 20 },
  logoText: { fontSize: 18, fontWeight: '800', color: colors.text },
  links: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  link: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  linkHover: { backgroundColor: '#eef2f8' },
  linkActive: { backgroundColor: colors.primary },
  linkPressed: { transform: [{ scale: 0.96 }] },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  linkTextActive: { color: '#fff' },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
    flexShrink: 1,
  },
  currentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#eef2f8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    overflow: 'hidden',
    flexShrink: 1,
  },
  signOut: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signOutHover: { backgroundColor: '#fdecea', borderColor: '#f5c6c0' },
  signOutText: { fontSize: 14, fontWeight: '700', color: colors.text },
  burger: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6fb',
  },
  burgerText: { fontSize: 20, color: colors.text, fontWeight: '700' },
  menu: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
    width: '100%',
    maxWidth: 1400,
    alignSelf: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  menuIcon: { fontSize: 20 },
  menuText: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  menuDot: { color: '#fff', fontSize: 10 },
})
