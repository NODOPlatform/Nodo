export const shadows = {
  sm: '0 1px 3px rgba(0,0,0,0.3)',
  md: '0 4px 12px rgba(0,0,0,0.3)',
  lg: '0 8px 24px rgba(0,0,0,0.4)',
  xl: '0 12px 40px rgba(0,0,0,0.5)',
  glowRed: '0 0 32px rgba(220,38,38,0.15)',
  glowGreen: '0 0 32px rgba(34,197,94,0.12)',
  glowBlue: '0 0 32px rgba(59,130,246,0.12)',
  glowAmber: '0 0 32px rgba(234,179,8,0.12)',
  inner: 'inset 0 1px 2px rgba(0,0,0,0.2)',
} as const

export type ShadowToken = keyof typeof shadows
