export const colors = {
  primary: '#0b3a5e',
  primaryLight: '#1f6fb2',
  sky: '#5b8def',
  accent: '#ff7a59',
  sun: '#ffc857',
  bg: '#f4f6fb',
  card: '#ffffff',
  text: '#14213d',
  muted: '#5b6475',
  border: '#e3e8f0',
  success: '#27ae60',
  danger: '#c0392b',
}

export const gradients = {
  hero: ['#0b3a5e', '#1f6fb2', '#5b8def'] as const,
  warm: ['#ff7a59', '#ffc857'] as const,
}

export const shadow = {
  card: { boxShadow: '0 6px 20px rgba(20, 33, 61, 0.08)' },
  cardHover: { boxShadow: '0 16px 36px rgba(20, 33, 61, 0.18)' },
  soft: { boxShadow: '0 2px 8px rgba(20, 33, 61, 0.06)' },
}

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
}
