import { useCallback, useEffect, useState } from 'react'
import { getInfoCards, InfoCard, InfoCategory } from './infoService'

export function useInfoCards(categories: InfoCategory[]) {
  const [cards, setCards] = useState<InfoCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stable key so the effect does not re-run on every render
  const key = categories.join(',')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setCards(await getInfoCards(key.split(',') as InfoCategory[]))
    } catch (e: any) {
      console.log('INFO CARDS ERROR:', e)
      setError(e?.message ?? 'Could not load information')
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    load()
  }, [load])

  return { cards, loading, error, reload: load }
}