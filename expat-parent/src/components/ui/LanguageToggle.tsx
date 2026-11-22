import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useLanguage } from '../../i18n/LanguageContext'
import { Lang } from '../../i18n/translations'
import { colors } from './theme'

const OPTIONS: { key: Lang; label: string }[] = [
  { key: 'pl', label: '🇵🇱 PL' },
  { key: 'en', label: '🇬🇧 EN' },
]

/** PL / EN switch. Use variant="light" on dark backgrounds. */
export function LanguageToggle({ variant = 'default' }: { variant?: 'default' | 'light' }) {
  const { lang, setLang } = useLanguage()
  const light = variant === 'light'

  return (
    <View style={[styles.wrap, light && styles.wrapLight]} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => {
        const active = lang === o.key
        return (
          <Pressable
            key={o.key}
            onPress={() => setLang(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            style={({ hovered }: any) => [
              styles.option,
              hovered && !active && (light ? styles.hoverLight : styles.hover),
              active && (light ? styles.activeLight : styles.active),
            ]}
          >
            <Text
              style={[
                styles.text,
                light && styles.textLight,
                active && (light ? styles.textActiveLight : styles.textActive),
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#eef2f8',
    borderRadius: 999,
    padding: 3,
  },
  wrapLight: { backgroundColor: 'rgba(255,255,255,0.16)' },
  option: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  hover: { backgroundColor: '#e0e7f1' },
  hoverLight: { backgroundColor: 'rgba(255,255,255,0.14)' },
  active: { backgroundColor: colors.primary },
  activeLight: { backgroundColor: '#fff' },
  text: { fontSize: 13, fontWeight: '700', color: colors.muted },
  textLight: { color: 'rgba(255,255,255,0.85)' },
  textActive: { color: '#fff' },
  textActiveLight: { color: colors.primary },
})
