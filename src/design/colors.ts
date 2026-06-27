export const colors = {
  // Backgrounds
  dark: '#0f1724',
  card: '#1a2332',
  cardHover: 'rgba(255,255,255,0.04)',
  cardActive: 'rgba(255,255,255,0.06)',
  surface: '#1e2a3a',

  // Borders
  border: '#2a3545',
  borderLight: 'rgba(255,255,255,0.06)',
  borderFocus: '#3b82f6',

  // Text
  text: '#f1f5f9',
  muted: '#94a3b8',
  dimmed: '#64748b',

  // Brand
  brandRed: '#CF2E2E',
  brandGold: '#D4951A',
  brandBlue: '#245DA5',
  brandNavy: '#172340',

  // Semantic
  emergency: '#dc2626',
  emergencyMuted: 'rgba(220,38,38,0.15)',
  success: '#22c55e',
  successMuted: 'rgba(34,197,94,0.12)',
  warning: '#eab308',
  warningMuted: 'rgba(234,179,8,0.10)',
  info: '#3b82f6',
  infoMuted: 'rgba(59,130,246,0.10)',

  // Urgency
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',

  // Actions
  actionRed: 'linear-gradient(135deg, #dc2626, #b91c1c)',
  actionGreen: 'linear-gradient(135deg, #059669, #047857)',
  actionAmber: 'linear-gradient(135deg, #d97706, #b45309)',
  actionBlue: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
  actionRose: 'linear-gradient(135deg, #e11d48, #be123c)',

  // Overlay
  overlay: 'rgba(0,0,0,0.60)',
  glass: 'rgba(15,23,36,0.82)',
} as const

export type ColorToken = keyof typeof colors
