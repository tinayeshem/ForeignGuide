import { supabase } from '../../lib/supabase'
import { Mode, ParentKey, PeriodType } from '../calculator/calculator'

export type SampleCase = {
  id: string
  title: string
  description: string | null
  mode: Mode
  children: number
  za_zyciem: boolean
  child_age: number
  single_application: boolean
  supplementary_weeks: number
  transfer_weeks: number
  father_paternity: boolean
  mother_insured: boolean
  mother_base: number | null
  mother_parental_weeks: number
  mother_work_percent: number
  father_insured: boolean
  father_base: number | null
  father_parental_weeks: number
  father_work_percent: number
  zus_decision: 'granted' | 'refused'
  zus_parent: ParentKey
  zus_period: PeriodType
  zus_monthly_amount: number | null
  zus_notes: string | null
  sort_order: number
}

const toNum = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))
const toNumOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v))

// Supabase can return "numeric" columns as strings – convert them safely
function normalize(row: any): SampleCase {
  return {
    ...row,
    children: toNum(row.children),
    child_age: toNum(row.child_age),
    supplementary_weeks: toNum(row.supplementary_weeks),
    transfer_weeks: toNum(row.transfer_weeks),
    mother_base: toNumOrNull(row.mother_base),
    mother_parental_weeks: toNum(row.mother_parental_weeks),
    mother_work_percent: toNum(row.mother_work_percent),
    father_base: toNumOrNull(row.father_base),
    father_parental_weeks: toNum(row.father_parental_weeks),
    father_work_percent: toNum(row.father_work_percent),
    zus_monthly_amount: toNumOrNull(row.zus_monthly_amount),
    sort_order: toNum(row.sort_order),
  }
}

export async function getCases(): Promise<SampleCase[]> {
  const { data, error } = await supabase
    .from('sample_cases')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []).map(normalize)
}

export async function getCaseById(id: string): Promise<SampleCase | null> {
  const { data, error } = await supabase
    .from('sample_cases')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? normalize(data) : null
}