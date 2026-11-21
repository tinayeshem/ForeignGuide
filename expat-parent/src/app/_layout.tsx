import { Stack } from 'expo-router'
import { useState, useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { JwtPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import Auth from '../components/Auth'

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!claims) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Auth />
      </View>
    )
  }

  return <Stack />
}