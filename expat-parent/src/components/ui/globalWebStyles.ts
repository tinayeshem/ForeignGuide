import { Platform } from 'react-native'

const STYLE_ID = 'parent-guide-global-styles'

/** Web only: nicer font, selection colour, focus rings, scrollbar. Safe to call many times. */
export function injectGlobalWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return

  const font = document.createElement('link')
  font.rel = 'stylesheet'
  font.href =
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(font)

  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    html, body { background: #f4f6fb; scroll-behavior: smooth; }
    body, div, span, input, textarea, button {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif !important;
    }
    ::selection { background: #ffc857; color: #14213d; }
    input:focus, textarea:focus {
      outline: 2px solid #5b8def !important;
      outline-offset: 1px;
      border-radius: 10px;
    }
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #c5cede; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #9fb0c8; }
    @media (prefers-reduced-motion: reduce) {
      * { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
    }
  `
  document.head.appendChild(style)
}
