import { supabase } from '../../lib/supabase'
import { Step } from '../timeline/timelineService'

export type StepDetail = Step & {
  last_verified: string | null
}

export async function getStepById(id: string): Promise<StepDetail | null> {
  const { data, error } = await supabase
    .from('steps')
    .select(
      'id, title, deadline_days, where_to_go, documents, tips, source_url, applies_to, sort_order, needs_review, last_verified'
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as StepDetail | null
}