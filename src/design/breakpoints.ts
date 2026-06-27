export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const

export const containers = {
  mobile: '448px',
  desktop: '1100px',
} as const

export type BreakpointToken = keyof typeof breakpoints
