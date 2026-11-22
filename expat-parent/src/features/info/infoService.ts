import { supabase } from '../../lib/supabase'

export type InfoCategory = 'risk' | 'right' | 'charity'

export type InfoCard = {
  id: number
  category: InfoCategory
  title: string
  body: string
  link_url: string | null
  sort_order: number
}

export async function getInfoCards(categories: InfoCategory[]): Promise<InfoCard[]> {
  const { data, error } = await supabase
    .from('info_cards')
    .select('id, category, title, body, link_url, sort_order')
    .in('category', categories)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as InfoCard[]
}