import { supabase } from '../../lib/supabase'
import { NationalityType } from '../profileService'

export type Step = {
  id: string
  title: string
  deadline_days: number | null
  where_to_go: string | null
  documents: string[]
  tips: string | null
  source_url: string | null
  applies_to: 'all' | 'eu' | 'non_eu'
  sort_order: number
  needs_review: boolean
}

export type StepStatus = 'done' | 'overdue' | 'asap' | 'soon' | 'later'

export type TimelineItem = Step & {
  done: boolean
  dueDate: Date | null
  daysLeft: number | null
  status: StepStatus
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('Not logged in')
  }
  return data.user.id
}

export async function getSteps(nationality: NationalityType): Promise<Step[]> {
  const { data, error } = await supabase
    .from('steps')
    .select(
      'id, title, deadline_days, where_to_go, documents, tips, source_url, applies_to, sort_order, needs_review'
    )
    .in('applies_to', ['all', nationality])
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as Step[]
}

export async function getProgress(): Promise<Record<string, boolean>> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('step_id, done')

  if (error) throw error

  const map: Record<string, boolean> = {}
  for (const row of data ?? []) {
    map[row.step_id] = row.done
  }
  return map
}

export async function setStepDone(stepId: string, done: boolean): Promise<void> {
  const userId = await getUserId()

  const { error } = await supabase.from('user_progress').upsert({
    user_id: userId,
    step_id: stepId,
    done,
    done_at: done ? new Date().toISOString() : null,
  })

  if (error) throw error
}

// ---------- Date + status logic ----------

const DAY_MS = 24 * 60 * 60 * 1000

function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const STATUS_ORDER: Record<StepStatus, number> = {
  overdue: 0,
  asap: 1,
  soon: 2,
  later: 3,
  done: 4,
}

export function buildTimeline(
  steps: Step[],
  progress: Record<string, boolean>,
  birthDate: string
): TimelineItem[] {
  const birth = parseDate(birthDate)
  const today = startOfToday()

  const items: TimelineItem[] = steps.map((step) => {
    const done = progress[step.id] ?? false

    let dueDate: Date | null = null
    let daysLeft: number | null = null

    if (step.deadline_days !== null) {
      dueDate = new Date(
        birth.getFullYear(),
        birth.getMonth(),
        birth.getDate() + step.deadline_days
      )
      daysLeft = Math.round((dueDate.getTime() - today.getTime()) / DAY_MS)
    }

    let status: StepStatus
    if (done) status = 'done'
    else if (daysLeft === null) status = 'asap'
    else if (daysLeft < 0) status = 'overdue'
    else if (daysLeft <= 7) status = 'soon'
    else status = 'later'

    return { ...step, done, dueDate, daysLeft, status }
  })

  return items.sort((a, b) => {
    const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (diff !== 0) return diff
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime()
    return a.sort_order - b.sort_order
  })
}