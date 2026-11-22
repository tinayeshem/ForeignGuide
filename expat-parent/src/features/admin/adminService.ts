import { supabase } from '../../lib/supabase'
import { InfoCard, InfoCategory } from '../info/infoService'

export type AdminParam = {
  key: string
  value: number
  label: string
  unit: string | null
  category: string
  updated_at: string | null
}

export type InfoCardDraft = {
  id?: number
  category: InfoCategory
  title: string
  body: string
  link_url: string | null
  sort_order: number
}

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin')
  if (error) {
    console.log('IS ADMIN ERROR:', error)
    return false
  }
  return data === true
}

// ---------- Parameters ----------

export async function getAdminParameters(): Promise<AdminParam[]> {
  const { data, error } = await supabase
    .from('benefit_parameters')
    .select('key, value, label, unit, category, updated_at')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, value: Number(r.value) }))
}

export async function updateParameter(key: string, value: number): Promise<AdminParam> {
  const { data, error } = await supabase
    .from('benefit_parameters')
    .update({ value })
    .eq('key', key)
    .select('key, value, label, unit, category, updated_at')

  if (error) throw error
  // RLS returns 0 rows (not an error) when the user is not allowed
  if (!data || data.length === 0) throw new Error('Not allowed – admin only')
  return { ...data[0], value: Number(data[0].value) }
}

// ---------- Info cards ----------

export async function getAllInfoCards(): Promise<InfoCard[]> {
  const { data, error } = await supabase
    .from('info_cards')
    .select('id, category, title, body, link_url, sort_order')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as InfoCard[]
}

export async function saveInfoCard(card: InfoCardDraft): Promise<void> {
  const payload = {
    category: card.category,
    title: card.title.trim(),
    body: card.body.trim(),
    link_url: card.link_url?.trim() ? card.link_url.trim() : null,
    sort_order: card.sort_order,
  }

  const query = card.id
    ? supabase.from('info_cards').update(payload).eq('id', card.id).select('id')
    : supabase.from('info_cards').insert(payload).select('id')

  const { data, error } = await query
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Not allowed – admin only')
}

export async function deleteInfoCard(id: number): Promise<void> {
  const { data, error } = await supabase.from('info_cards').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Not allowed – admin only')
}