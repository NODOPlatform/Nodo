import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { adminAuthenticated } from '../store/admin-session'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ActionCard } from '../components/ui/ActionCard'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Skeleton } from '../components/ui/Skeleton'
import { Spinner } from '../components/ui/Spinner'
import { Sheet } from '../components/ui/Sheet'
import { Divider } from '../components/ui/Divider'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { Modal } from '../components/ui/Modal'
import { IconSOS, IconHeart, IconSearch, IconMapPin, IconAlert } from '../components/ui/Icons'
import { colors } from '../design/colors'
import { spacing } from '../design/spacing'
import { typography } from '../design/typography'
import { radius } from '../design/radius'
import { shadows } from '../design/shadows'

function ColorSwatch({ name, value }: { name: string; value: string }) {
  const isGradient = value.startsWith('linear')
  return (
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 rounded-lg border border-white/10 flex-shrink-0"
        style={{ background: value }}
      />
      <div>
        <p class="text-xs font-semibold">{name}</p>
        <p class="text-[10px] text-nodo-muted font-mono">{isGradient ? 'gradient' : value}</p>
      </div>
    </div>
  )
}

function TokenGrid({ title, items }: { title: string; items: Record<string, string> }) {
  return (
    <div>
      <h4 class="text-sm font-bold mb-3">{title}</h4>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(items).map(([k, v]) => (
          <div key={k} class="bg-nodo-card border border-nodo-border rounded-lg p-3">
            <p class="text-xs font-semibold">{k}</p>
            <p class="text-[10px] text-nodo-muted font-mono mt-0.5">{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DesignSystem() {
  const { route } = useLocation()
  const sheetOpen = useSignal(false)
  const modalOpen = useSignal(false)
  const btnLoading = useSignal(false)
  const btnSuccess = useSignal(false)

  if (!adminAuthenticated.value) {
    return (
      <div class="p-6 text-center">
        <p class="text-nodo-muted">Acceso restringido. Inicia sesion como administrador.</p>
        <button onClick={() => route('/admin')} class="text-blue-400 text-sm mt-3">Ir a Admin</button>
      </div>
    )
  }

  const simulateLoading = () => {
    btnLoading.value = true
    setTimeout(() => {
      btnLoading.value = false
      btnSuccess.value = true
      setTimeout(() => { btnSuccess.value = false }, 2000)
    }, 1500)
  }

  return (
    <div class="px-4 py-6 pb-24 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <div class="nodo-lines mb-3"><span /><span /><span /></div>
        <h1 class="text-2xl font-extrabold text-center">NODO Design System</h1>
        <p class="text-sm text-nodo-muted text-center mt-1">v3.0 — Componentes y tokens</p>
      </div>

      <Divider label="Colores" />

      {/* Colors */}
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Backgrounds & Borders</h3>
        <div class="grid grid-cols-2 gap-3">
          <ColorSwatch name="dark" value={colors.dark} />
          <ColorSwatch name="card" value={colors.card} />
          <ColorSwatch name="surface" value={colors.surface} />
          <ColorSwatch name="border" value={colors.border} />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider mt-4">Brand</h3>
        <div class="grid grid-cols-2 gap-3">
          <ColorSwatch name="brandRed" value={colors.brandRed} />
          <ColorSwatch name="brandGold" value={colors.brandGold} />
          <ColorSwatch name="brandBlue" value={colors.brandBlue} />
          <ColorSwatch name="brandNavy" value={colors.brandNavy} />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider mt-4">Semantic</h3>
        <div class="grid grid-cols-2 gap-3">
          <ColorSwatch name="emergency" value={colors.emergency} />
          <ColorSwatch name="success" value={colors.success} />
          <ColorSwatch name="warning" value={colors.warning} />
          <ColorSwatch name="info" value={colors.info} />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider mt-4">Action Gradients</h3>
        <div class="grid grid-cols-2 gap-3">
          <ColorSwatch name="actionRed" value={colors.actionRed} />
          <ColorSwatch name="actionGreen" value={colors.actionGreen} />
          <ColorSwatch name="actionAmber" value={colors.actionAmber} />
          <ColorSwatch name="actionBlue" value={colors.actionBlue} />
        </div>
      </div>

      <Divider label="Tipografia" />

      {/* Typography */}
      <div class="space-y-3">
        {Object.entries(typography).map(([name, style]) => (
          <div key={name} class="flex items-baseline gap-4">
            <span class="text-[10px] text-nodo-muted font-mono w-20 flex-shrink-0">{name}</span>
            <span style={{ fontSize: style.size, fontWeight: style.weight, lineHeight: style.lineHeight }}>
              NODO Coordinacion
            </span>
          </div>
        ))}
      </div>

      <Divider label="Tokens" />

      <TokenGrid title="Spacing" items={spacing} />
      <TokenGrid title="Border Radius" items={radius} />
      <TokenGrid title="Shadows" items={shadows} />

      <Divider label="Buttons" />

      {/* Buttons */}
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Variantes</h3>
        <div class="flex flex-wrap gap-2">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Tamanos</h3>
        <div class="flex flex-wrap items-end gap-2">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Estados</h3>
        <div class="flex flex-wrap gap-2">
          <Button loading={btnLoading.value} success={btnSuccess.value} onClick={simulateLoading}>
            {btnSuccess.value ? 'Enviado' : btnLoading.value ? 'Enviando...' : 'Probar loading → success'}
          </Button>
          <Button disabled>Disabled</Button>
          <Button icon={<IconHeart size={18} />}>Con icono</Button>
          <Button variant="secondary" iconOnly icon={<IconSearch size={18} />} />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Full Width</h3>
        <Button fullWidth size="lg">Boton completo</Button>
      </div>

      <Divider label="Action Cards" />

      {/* ActionCard */}
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Tamano LG (acciones principales)</h3>
        <div class="grid grid-cols-2 gap-2">
          <ActionCard label="Necesito ayuda" Icon={IconSOS} gradient={colors.actionRed} onClick={() => {}} size="lg" />
          <ActionCard label="Quiero ayudar" Icon={IconHeart} gradient={colors.actionGreen} onClick={() => {}} size="lg" />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Tamano MD (secundarias)</h3>
        <div class="grid grid-cols-3 gap-2">
          <ActionCard label="Buscar personas" Icon={IconSearch} gradient={colors.actionAmber} onClick={() => {}} />
          <ActionCard label="Solicitud de salud" Icon={IconHeart} gradient={colors.actionRose} onClick={() => {}} />
          <ActionCard label="Abrir mapa" Icon={IconMapPin} gradient={colors.actionBlue} onClick={() => {}} />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Tamano SM (compactas)</h3>
        <div class="grid grid-cols-3 gap-2">
          <ActionCard label="Refugios" icon="🏠" gradient={colors.actionBlue} onClick={() => {}} size="sm" />
          <ActionCard label="Acopio" icon="📦" gradient={colors.actionAmber} onClick={() => {}} size="sm" />
          <ActionCard label="Campanas" icon="📢" gradient={colors.actionGreen} onClick={() => {}} size="sm" />
        </div>

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Con subtitulo</h3>
        <ActionCard label="Reportar incidente" Icon={IconAlert} gradient={colors.actionRed} onClick={() => {}} subtitle="Derrumbe, incendio, via bloqueada" />
      </div>

      <Divider label="Cards" />

      {/* Cards */}
      <div class="space-y-3">
        <Card variant="default"><p class="text-sm">Card default — contenido estatico</p></Card>
        <Card variant="interactive" onClick={() => {}}><p class="text-sm">Card interactive — clickable con hover</p></Card>
        <Card variant="emergency"><p class="text-sm">Card emergency — alertas criticas</p></Card>
        <Card variant="highlighted"><p class="text-sm">Card highlighted — informacion relevante</p></Card>
        <Card padding="sm"><p class="text-sm">Card con padding small</p></Card>
        <Card padding="lg"><p class="text-sm">Card con padding large</p></Card>
      </div>

      <Divider label="Section Headers" />

      {/* SectionHeader */}
      <div class="space-y-4">
        <SectionHeader icon="🎯" title="Necesidades cerca de ti" badge={23} badgeColor="#dc2626" />
        <SectionHeader icon="📡" title="Feed nacional" subtitle="Actualizado cada 45s" badge={30} />
        <SectionHeader icon="🧠" title="Inteligencia" action={<button class="text-[11px] text-blue-400">Ver todo</button>} />
        <SectionHeader title="Sin icono ni badge" />
      </div>

      <Divider label="Badges" />

      {/* Badges */}
      <div class="flex flex-wrap gap-2">
        <Badge color="#dc2626">Critico</Badge>
        <Badge color="#f97316">Alto</Badge>
        <Badge color="#eab308">Medio</Badge>
        <Badge color="#22c55e">Bajo</Badge>
        <Badge color="#3b82f6">Info</Badge>
        <Badge color="#8b5cf6" icon="📢">Campana</Badge>
        <Badge size="sm" color="#dc2626">Small</Badge>
      </div>

      <Divider label="Skeleton" />

      {/* Skeleton */}
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Lines</h3>
        <Skeleton count={3} />

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Cards</h3>
        <Skeleton variant="card" count={2} />

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Circles</h3>
        <Skeleton variant="circle" count={4} />

        <h3 class="text-sm font-bold text-nodo-muted uppercase tracking-wider">Actions</h3>
        <Skeleton variant="action" count={4} />
      </div>

      <Divider label="Spinners" />

      <div class="flex items-center gap-6">
        <div class="text-center"><Spinner size="sm" class="text-nodo-muted" /><p class="text-[10px] text-nodo-muted mt-2">sm</p></div>
        <div class="text-center"><Spinner size="md" class="text-nodo-muted" /><p class="text-[10px] text-nodo-muted mt-2">md</p></div>
        <div class="text-center"><Spinner size="lg" class="text-nodo-muted" /><p class="text-[10px] text-nodo-muted mt-2">lg</p></div>
      </div>

      <Divider label="States" />

      <EmptyState icon="📭" title="Sin resultados" description="No hay datos disponibles en este momento." action={{ label: 'Reintentar', onClick: () => {} }} />

      <LoadingState message="Cargando datos..." />

      <ErrorState message="No se pudo conectar con el servidor." onRetry={() => {}} />

      <Divider label="Dividers" />

      <Divider />
      <Divider label="Con etiqueta" />

      <Divider label="Sheet & Modal" />

      <div class="flex gap-2">
        <Button variant="secondary" onClick={() => { sheetOpen.value = true }}>Abrir Sheet</Button>
        <Button variant="secondary" onClick={() => { modalOpen.value = true }}>Abrir Modal</Button>
      </div>

      <Sheet open={sheetOpen.value} onClose={() => { sheetOpen.value = false }} title="Sheet de ejemplo">
        <div class="space-y-3">
          <p class="text-sm text-nodo-muted">Este es un Sheet bottom-sheet para opciones secundarias.</p>
          <Button fullWidth variant="secondary" onClick={() => { sheetOpen.value = false }}>Opcion 1</Button>
          <Button fullWidth variant="secondary" onClick={() => { sheetOpen.value = false }}>Opcion 2</Button>
          <Button fullWidth variant="secondary" onClick={() => { sheetOpen.value = false }}>Opcion 3</Button>
        </div>
      </Sheet>

      <Modal open={modalOpen.value} onClose={() => { modalOpen.value = false }} title="Modal de ejemplo">
        <p class="text-sm text-nodo-muted mb-4">Este es un Modal centrado para confirmaciones y formularios.</p>
        <div class="flex gap-2">
          <Button variant="secondary" onClick={() => { modalOpen.value = false }}>Cancelar</Button>
          <Button onClick={() => { modalOpen.value = false }}>Confirmar</Button>
        </div>
      </Modal>

      <Divider label="Animaciones" />

      <div class="space-y-3">
        <div class="animate-fade-in bg-nodo-card border border-nodo-border rounded-xl p-3 text-sm">fade-in (0.2s)</div>
        <div class="animate-slide-up bg-nodo-card border border-nodo-border rounded-xl p-3 text-sm">slide-up (0.3s spring)</div>
        <div class="animate-scale-in bg-nodo-card border border-nodo-border rounded-xl p-3 text-sm">scale-in (0.15s)</div>
      </div>

      <Divider label="Touch Targets" />

      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-nodo-card border border-nodo-border flex items-center justify-center text-[10px] text-nodo-muted">44px</div>
          <div class="w-12 h-12 rounded-xl bg-nodo-card border border-nodo-border flex items-center justify-center text-[10px] text-nodo-muted">48px</div>
          <div class="w-14 h-14 rounded-xl bg-nodo-card border border-nodo-border flex items-center justify-center text-[10px] text-nodo-muted">56px</div>
          <div class="w-16 h-16 rounded-xl bg-nodo-card border border-nodo-border flex items-center justify-center text-[10px] text-nodo-muted">64px</div>
        </div>
        <p class="text-[11px] text-nodo-muted">Minimo 44px para touch targets. Recomendado 48px. Acciones primarias 56px+.</p>
      </div>

      <Divider label="Brand Elements" />

      <div class="space-y-4">
        <div>
          <p class="text-[10px] text-nodo-muted mb-2">nodo-lines (default)</p>
          <div class="nodo-lines"><span /><span /><span /></div>
        </div>
        <div>
          <p class="text-[10px] text-nodo-muted mb-2">nodo-lines--sm</p>
          <div class="nodo-lines nodo-lines--sm"><span /><span /><span /></div>
        </div>
        <div>
          <p class="text-[10px] text-nodo-muted mb-2">nodo-lines--lg</p>
          <div class="nodo-lines nodo-lines--lg"><span /><span /><span /></div>
        </div>
      </div>

      <div class="h-8" />
    </div>
  )
}
