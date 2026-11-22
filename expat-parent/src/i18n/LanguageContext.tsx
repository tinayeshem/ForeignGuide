import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Lang, translate } from './translations'

const STORAGE_KEY = 'app-language'
const DEFAULT_LANG: Lang = 'pl'

type LanguageContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG)

  // Load the saved choice
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'pl' || saved === 'en') setLangState(saved)
      })
      .catch(() => {})
  }, [])

  // Keep <html lang="..."> correct for screen readers and search engines
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.lang = lang
    }
  }, [lang])

  const setLang = (next: Lang) => {
    setLangState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }

  const t = (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars)

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
