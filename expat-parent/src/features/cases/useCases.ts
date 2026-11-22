import { useCallback, useEffect, useState } from 'react'
import { getCases, SampleCase } from './caseService'

export function useCases() {
  const [cases, setCases] = useState<SampleCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCases(await getCases())
    } catch (e: any) {
      console.log('CASES ERROR:', e)
      setError(e?.message ?? 'Could not load sample cases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { cases, loading, error, reload: load }
}