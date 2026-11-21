import { Stack } from 'expo-router'
import { useState, useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { JwtPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Auth from '../components/Auth'

const MAX_WIDTH = 760

export default function RootLayout() {
  const [claims, setClaims] = useState<JwtPayload | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!claims) {
    return (
      <View style={styles.authPage}>
        <View style={styles.authBox}>
          <Auth />
        </View>
      </View>
    )
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: '#0b3a5e',
        contentStyle: styles.content,
      }}
    />
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  authPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
    padding: 16,
  },
  authBox: { width: '100%', maxWidth: 420 },
  content: {
    width: '100%',
    maxWidth: MAX_WIDTH,
    alignSelf: 'center',
    backgroundColor: '#f5f6f8',
  },
})