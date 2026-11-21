import { useCallback, useEffect, useState } from 'react'
import { getPhrases, Phrase } from './phrasebookService'

export function usePhrasebook() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPhrases()
      setPhrases(data)
    } catch (e: any) {
      console.log('PHRASES ERROR:', e)
      setError(e?.message ?? 'Could not load phrases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { phrases, loading, error, reload: load }
}