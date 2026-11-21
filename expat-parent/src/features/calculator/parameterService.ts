import { supabase } from '../../lib/supabase'

export type ParamRow = {
  key: string
  value: number
  label: string
  unit: string | null
  category: string
}

export async function getParameterRows(): Promise<ParamRow[]> {
  const { data, error } = await supabase
    .from('benefit_parameters')
    .select('key, value, label, unit, category')
    .order('category', { ascending: true })
    .order('key', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r) => ({ ...r, value: Number(r.value) }))
}

export async function getParameters(): Promise<Record<string, number>> {
  const rows = await getParameterRows()
  const map: Record<string, number> = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}