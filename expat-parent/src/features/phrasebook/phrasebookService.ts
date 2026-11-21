import { supabase } from '../../lib/supabase'

export type PhraseCategory = 'hospital' | 'office' | 'doctor'

export type Phrase = {
  id: number
  category: PhraseCategory
  english: string
  polish: string
}

export async function getPhrases(): Promise<Phrase[]> {
  const { data, error } = await supabase
    .from('phrases')
    .select('id, category, english, polish')
    .order('category', { ascending: true })
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []) as Phrase[]
}