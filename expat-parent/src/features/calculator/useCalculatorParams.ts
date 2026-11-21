import { useCallback, useEffect, useState } from 'react'
import { getParameters } from './parameterService'

export function useCalculatorParams() {
  const [params, setParams] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setParams(await getParameters())
    } catch (e: any) {
      console.log('PARAMS ERROR:', e)
      setError(e?.message ?? 'Could not load parameters')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { params, loading, error, reload: load }
}