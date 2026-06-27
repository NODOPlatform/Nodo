export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  page: '16px',
  sectionGap: '24px',
  cardPadding: '16px',
  cardPaddingSm: '12px',
} as const

export type SpacingToken = keyof typeof spacing
