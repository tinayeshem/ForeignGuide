import { Stack } from 'expo-router'
import { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { JwtPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Auth from '../components/Auth'
import { AppHeader } from '../components/ui/AppHeader'
import { injectGlobalWebStyles } from '../components/ui/globalWebStyles'
import { colors } from '../components/ui/theme'
import { LanguageProvider } from '../i18n/LanguageContext'

const MAX_WIDTH = 820

// Same background everywhere – no grey strips at the sides
const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.card,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
  },
}

export default function RootLayout() {
  const [claims, setClaims] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    injectGlobalWebStyles()
  }, [])

  useEffect(() => {
    const loadClaims = async () => {
      const { data, error } = await supabase.auth.getClaims()
      if (error) console.log('AUTH ERROR:', error.message)
      setClaims(data?.claims ?? null)
      setLoading(false)
    }

    loadClaims()

    const { data } = supabase.auth.onAuthStateChange(() => {
      loadClaims()
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  let content
  if (loading) {
    content = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  } else if (!claims) {
    content = <Auth />
  } else {
    content = (
      <ThemeProvider value={appTheme}>
        <Stack
          screenOptions={{
            header: () => <AppHeader />,
            contentStyle: styles.content,
            animation: 'fade',
          }}
        />
      </ThemeProvider>
    )
  }

  return <LanguageProvider>{content}</LanguageProvider>
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  content: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.bg,
  },
})
