import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { useEffect } from 'preact/hooks'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'
import { CoverImage, PhotoGallery } from '../components/ui/MultiPhotoInput'
import { INFO_CATEGORIES } from '../lib/constants'
import type { VerifiedInfo as VerifiedInfoType } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  hospital: '#3b82f6',
  road: '#f97316',
  shelter: '#eab308',
  distribution: '#22c55e',
  services: '#8b5cf6',
  weather: '#06b6d4',
  official: '#dc2626',
  transport: '#f59e0b',
  alert: '#dc2626',
  general: '#6b7280',
}

export function VerifiedInfo() {
  const { route } = useLocation()
  const items = useSignal<VerifiedInfoType[]>([])
  const loading = useSignal(true)
  const activeCategory = useSignal<string>('')

  useEffect(() => {
    loadInfo()
  }, [])

  async function loadInfo() {
    if (!supabase) { loading.value = false; return }
    loading.value = true
    try {
      let q = supabase.from('verified_info')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)

      if (activeCategory.value) {
        q = q.eq('category', activeCategory.value)
      }

      const { data } = await q
      items.value = (data ?? []) as VerifiedInfoType[]
    } catch {
      items.value = []
    } finally {
      loading.value = false
    }
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })

  const activeCat = INFO_CATEGORIES.find(c => c.value === activeCategory.value)

  return (
    <div class="p-4 pb-20 max-w-lg mx-auto">
      <div class="flex items-center gap-3 mb-4">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 class="text-lg font-bold flex items-center gap-2">📢 Centro de Informacion Oficial</h2>
          <p class="text-[11px] text-nodo-muted">Informacion publicada por el equipo de coordinacion</p>
        </div>
      </div>

      {/* Category grid */}
      <div class="grid grid-cols-2 gap-2 mb-4">
        {INFO_CATEGORIES.map((cat) => {
          const isActive = activeCategory.value === cat.value
          return (
            <button
              key={cat.value}
              class={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-200 active:scale-[0.97] ${
                isActive
                  ? 'bg-white/[0.08] border-white/20 text-white'
                  : 'bg-nodo-card border-nodo-border text-nodo-muted hover:bg-white/[0.04] hover:text-nodo-text'
              }`}
              onClick={() => { activeCategory.value = isActive ? '' : cat.value; loadInfo() }}
            >
              <span class="text-lg">{cat.icon}</span>
              <span class="text-[12px] font-semibold leading-tight">{cat.label}</span>
            </button>
          )
        })}
      </div>

      {loading.value && (
        <div class="flex justify-center py-8"><Spinner size={32} /></div>
      )}

      {!loading.value && items.value.length === 0 && (
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-8 text-center">
          <div class="text-3xl mb-3">{activeCat?.icon || '📢'}</div>
          <p class="text-nodo-muted text-sm font-medium">
            {activeCategory.value
              ? `No hay informacion publicada para ${activeCat?.label || 'esta categoria'}.`
              : 'No hay informacion publicada aun.'}
          </p>
          <p class="text-nodo-muted text-xs mt-1.5">Se publicara desde el panel de coordinacion.</p>
        </div>
      )}

      <div class="space-y-3 stagger">
        {items.value.map((item) => {
          const images = (item.metadata?.images as string[]) || []
          return (
          <Card key={item.id} class="!p-0 overflow-hidden">
            <CoverImage images={images} name={item.title} height="h-36" />
            <div class="p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="flex items-center gap-2">
                <span class="text-base">{INFO_CATEGORIES.find(c => c.value === item.category)?.icon || '📋'}</span>
                <Badge color={CATEGORY_COLORS[item.category] || '#6b7280'}>
                  {INFO_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                </Badge>
              </div>
              {item.is_pinned && (
                <span class="text-[10px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-full">Fijado</span>
              )}
            </div>
            <h3 class="font-semibold mb-1">{item.title}</h3>
            <PhotoGallery images={images} />
            <p class="text-sm text-nodo-muted leading-relaxed">{item.content}</p>
            <div class="flex items-center justify-between mt-3 text-xs text-nodo-muted">
              {item.source && <span>Fuente: {item.source}</span>}
              <span>{formatDate(item.created_at)}</span>
            </div>
            </div>
          </Card>
          )
        })}
      </div>
    </div>
  )
}
