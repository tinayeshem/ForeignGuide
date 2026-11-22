import { useEffect, useState } from 'react'
import { checkIsAdmin } from './adminService'

export function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false
    checkIsAdmin()
      .then((result) => {
        if (!cancelled) setIsAdmin(result)
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { isAdmin, checking }
}