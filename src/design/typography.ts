export const typography = {
  display: { size: '24px', weight: '800', lineHeight: '1.2', letterSpacing: '-0.02em' },
  title: { size: '18px', weight: '700', lineHeight: '1.3', letterSpacing: '-0.01em' },
  subtitle: { size: '15px', weight: '600', lineHeight: '1.4', letterSpacing: '0' },
  body: { size: '15px', weight: '400', lineHeight: '1.5', letterSpacing: '0' },
  caption: { size: '13px', weight: '500', lineHeight: '1.4', letterSpacing: '0' },
  micro: { size: '11px', weight: '600', lineHeight: '1.3', letterSpacing: '0.01em' },
  nano: { size: '9px', weight: '700', lineHeight: '1.2', letterSpacing: '0.04em' },
  sectionTitle: { size: '13px', weight: '700', lineHeight: '1.3', letterSpacing: '0.05em', textTransform: 'uppercase' as const },
} as const

export const fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"

export type TypographyToken = keyof typeof typography
