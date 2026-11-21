import { useCallback, useEffect, useState } from 'react'
import { getProfile } from '../profileService'
import {
  buildTimeline,
  getProgress,
  setStepDone,
  TimelineItem,
} from '../timeline/timelineService'
import { getStepById } from './stepDetailService'

export type StepDetailItem = TimelineItem & {
  last_verified: string | null
}

export function useStepDetail(id: string | undefined) {
  const [item, setItem] = useState<StepDetailItem | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setError('No step selected')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [profile, step, progress] = await Promise.all([
        getProfile(),
        getStepById(id),
        getProgress(),
      ])

      if (!step) throw new Error('Step not found')
      if (!profile) throw new Error('Profile missing')

      const [built] = buildTimeline([step], progress, profile.birth_date)
      setItem({ ...built, last_verified: step.last_verified })
      setCity(profile.city)
    } catch (e: any) {
      console.log('STEP DETAIL ERROR:', e)
      setError(e?.message ?? 'Could not load step')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const toggleDone = async () => {
    if (!item || !id) return
    setSaving(true)
    try {
      await setStepDone(id, !item.done)
      await load()
    } catch (e: any) {
      console.log('TOGGLE ERROR:', e)
      setError('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return { item, city, loading, saving, error, toggleDone }
}