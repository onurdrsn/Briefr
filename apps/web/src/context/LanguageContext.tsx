import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'tr'

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('briefr_lang') as Language
    return saved === 'tr' ? 'tr' : 'en' // Default to English for Slack App Directory compliance
  })

  const setLang = (newLang: Language) => {
    setLangState(newLang)
    localStorage.setItem('briefr_lang', newLang)
  }

  const toggleLang = () => {
    setLang(lang === 'en' ? 'tr' : 'en')
  }

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)

export function LanguageToggle() {
  const { lang, toggleLang } = useLanguage()

  return (
    <button
      onClick={toggleLang}
      type="button"
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 hover:text-white transition-all shadow-sm"
      title="Switch Language / Dil Değiştir"
    >
      <span className="text-sm">{lang === 'en' ? '🇺🇸' : '🇹🇷'}</span>
      <span className="uppercase font-mono text-[11px]">{lang === 'en' ? 'EN' : 'TR'}</span>
    </button>
  )
}
