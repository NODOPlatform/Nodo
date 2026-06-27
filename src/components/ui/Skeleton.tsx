interface SkeletonProps {
  variant?: 'line' | 'card' | 'circle' | 'action'
  width?: string
  height?: string
  class?: string
  count?: number
}

function SkeletonBlock({ width, height, class: className = '', borderRadius }: { width?: string; height?: string; class?: string; borderRadius?: string }) {
  return (
    <div
      class={`skeleton ${className}`}
      style={{ width: width || '100%', height: height || '16px', borderRadius: borderRadius || '8px' }}
      aria-hidden="true"
    />
  )
}

export function Skeleton({ variant = 'line', width, height, class: className = '', count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count })

  if (variant === 'circle') {
    return (
      <div class={`flex gap-2 ${className}`}>
        {items.map((_, i) => (
          <SkeletonBlock key={i} width={width || '40px'} height={height || '40px'} borderRadius="9999px" />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div class={`space-y-2 ${className}`}>
        {items.map((_, i) => (
          <div key={i} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 space-y-3">
            <div class="flex items-center gap-3">
              <SkeletonBlock width="40px" height="40px" borderRadius="12px" />
              <div class="flex-1 space-y-2">
                <SkeletonBlock height="14px" width="70%" />
                <SkeletonBlock height="10px" width="40%" />
              </div>
            </div>
            <SkeletonBlock height="12px" />
            <SkeletonBlock height="12px" width="80%" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'action') {
    return (
      <div class={`grid grid-cols-2 gap-2 ${className}`}>
        {items.map((_, i) => (
          <SkeletonBlock key={i} height={height || '80px'} borderRadius="16px" />
        ))}
      </div>
    )
  }

  return (
    <div class={`space-y-2 ${className}`}>
      {items.map((_, i) => (
        <SkeletonBlock key={i} width={width} height={height} />
      ))}
    </div>
  )
}
