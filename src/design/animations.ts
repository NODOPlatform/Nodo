export const durations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
} as const

export const easings = {
  default: 'ease-out',
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
  smooth: 'ease-in-out',
} as const

export const transitions = {
  fast: `all ${durations.fast} ${easings.default}`,
  normal: `all ${durations.normal} ${easings.default}`,
  spring: `all ${durations.slow} ${easings.spring}`,
  color: `color ${durations.normal} ${easings.default}, background-color ${durations.normal} ${easings.default}`,
} as const

export const keyframes = {
  fadeIn: 'fadeIn 0.2s ease-out both',
  slideUp: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) both',
  scaleIn: 'scaleIn 0.15s ease-out both',
  skeleton: 'shimmer 1.5s ease-in-out infinite',
  pulseDot: 'pulse-dot 2s ease-in-out infinite',
  spin: 'spin 0.8s linear infinite',
} as const

export const staggerDelayMs = 60
