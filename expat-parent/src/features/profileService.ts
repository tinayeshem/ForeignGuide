import { supabase } from '../lib/supabase'

export type NationalityType = 'eu' | 'non_eu'

export type Profile = {
  user_id: string
  birth_date: string
  nationality_type: NationalityType
  city: string
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('Not logged in')
  }
  return data.user.id
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, birth_date, nationality_type, city')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function saveProfile(input: Omit<Profile, 'user_id'>): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...input })

  if (error) throw error
}