import { useCallback, useEffect, useState } from 'react'
import { getProfile, Profile } from '../profileService'
import {
  buildTimeline,
  getProgress,
  getSteps,
  setStepDone,
  Step,
  TimelineItem,
} from './timelineService'

export function useTimeline() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [progress, setProgress] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const p = await getProfile()
      setProfile(p)

      if (p) {
        const [s, pr] = await Promise.all([
          getSteps(p.nationality_type),
          getProgress(),
        ])
        setSteps(s)
        setProgress(pr)
      }
    } catch (e: any) {
      console.log('TIMELINE ERROR:', e)
      setError(e?.message ?? 'Could not load timeline')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const toggleStep = async (stepId: string) => {
    const newValue = !(progress[stepId] ?? false)

    // Optimistic update: change the UI first, then save
    setProgress((prev) => ({ ...prev, [stepId]: newValue }))

    try {
      await setStepDone(stepId, newValue)
    } catch (e: any) {
      console.log('TOGGLE ERROR:', e)
      setProgress((prev) => ({ ...prev, [stepId]: !newValue }))
      setError('Could not save. Try again.')
    }
  }

  const items: TimelineItem[] = profile
    ? buildTimeline(steps, progress, profile.birth_date)
    : []

  const doneCount = items.filter((i) => i.done).length

  return {
    profile,
    items,
    doneCount,
    total: items.length,
    loading,
    error,
    toggleStep,
    reload: load,
  }
}