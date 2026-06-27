# NODO Design System v3.0

**Fecha:** 2026-06-27
**Estado:** Activo
**Playground:** `/design-system` (requiere sesion admin)

---

## Filosofia

El Design System de NODO existe para garantizar que toda la interfaz sea:

1. **Clara** — El usuario entiende que hacer en < 3 segundos.
2. **Rapida** — Las personas en crisis no esperan.
3. **Consistente** — Todo componente se ve y se comporta igual en toda la app.
4. **Accesible** — Contraste AA, touch targets 48px+, tipografia legible.
5. **Reutilizable** — Ningun estilo se repite. Todo sale de tokens.

---

## Tokens

Los tokens viven en `src/design/` y se importan desde `src/design/index.ts`.

### Colores (`colors.ts`)

| Grupo | Tokens |
|-------|--------|
| **Backgrounds** | `dark`, `card`, `cardHover`, `cardActive`, `surface` |
| **Borders** | `border`, `borderLight`, `borderFocus` |
| **Text** | `text`, `muted`, `dimmed` |
| **Brand** | `brandRed`, `brandGold`, `brandBlue`, `brandNavy` |
| **Semantic** | `emergency`, `success`, `warning`, `info` + versiones `Muted` |
| **Urgency** | `critical`, `high`, `medium`, `low` |
| **Gradients** | `actionRed`, `actionGreen`, `actionAmber`, `actionBlue`, `actionRose` |
| **Overlay** | `overlay`, `glass` |

**Uso:**
```tsx
import { colors } from '../design'

<div style={{ background: colors.actionRed }}>...</div>
```

### Spacing (`spacing.ts`)

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Gap minimo |
| `sm` | 8px | Gap entre elementos relacionados |
| `md` | 16px | Padding de cards |
| `lg` | 24px | Separacion entre secciones |
| `xl` | 32px | Separacion entre bloques |
| `2xl` | 48px | Espaciado mayor |
| `page` | 16px | Padding horizontal de pagina |
| `sectionGap` | 24px | Gap entre secciones Home |
| `cardPadding` | 16px | Padding default de Card |
| `cardPaddingSm` | 12px | Padding compacto de Card |

### Tipografia (`typography.ts`)

| Nivel | Size | Weight | Uso |
|-------|------|--------|-----|
| `display` | 24px | 800 | Titulos de pagina |
| `title` | 18px | 700 | Titulos de seccion |
| `subtitle` | 15px | 600 | Subtitulos |
| `body` | 15px | 400 | Texto principal |
| `caption` | 13px | 500 | Labels |
| `micro` | 11px | 600 | Badges, timestamps |
| `nano` | 9px | 700 | Solo en KPIs compactos |
| `sectionTitle` | 13px | 700 | Titulos de seccion (uppercase) |

### Border Radius (`radius.ts`)

| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 8px | Chips, badges |
| `md` | 12px | Botones, inputs |
| `lg` | 16px | Cards |
| `xl` | 20px | Modales, sheets |
| `full` | 9999px | Circulos, pills |

### Sombras (`shadows.ts`)

| Token | Uso |
|-------|-----|
| `sm` | Sombra sutil |
| `md` | Cards elevadas |
| `lg` | Modales |
| `xl` | Overlays |
| `glowRed` | Elementos de emergencia |
| `glowGreen` | Exito |
| `glowBlue` | Informacion |
| `glowAmber` | Atencion |
| `inner` | Inputs focused |

### Animaciones (`animations.ts`)

| Token | Duracion | Uso |
|-------|----------|-----|
| `fadeIn` | 200ms | Entrada de elementos |
| `slideUp` | 300ms spring | Modales, sheets |
| `scaleIn` | 150ms | Badges, botones |
| `skeleton` | 1.5s loop | Placeholders |
| `pulseDot` | 2s loop | Indicadores de estado |
| `spin` | 800ms | Spinners |

### Otros tokens (`tokens.ts`)

- **Touch targets:** `minimum: 44px`, `recommended: 48px`, `large: 56px`, `action: 64px`
- **z-index:** `base(0)`, `card(1)`, `sticky(10)`, `header(40)`, `overlay(50)`, `modal(50)`, `toast(70)`
- **Icon sizes:** `xs(14)`, `sm(18)`, `md(24)`, `lg(28)`, `xl(32)`

---

## Componentes

Todos viven en `src/components/ui/`.

### Button

```tsx
import { Button } from '../components/ui/Button'

<Button variant="primary" size="lg" fullWidth>Enviar</Button>
<Button variant="secondary" icon={<IconHeart size={18} />}>Con icono</Button>
<Button loading>Cargando...</Button>
<Button success>Enviado</Button>
<Button disabled>Deshabilitado</Button>
<Button variant="outline" iconOnly icon={<IconSearch size={18} />} />
```

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `variant` | `primary \| secondary \| danger \| ghost \| outline` | `primary` | Estilo visual |
| `size` | `sm \| md \| lg \| xl` | `md` | Tamano (minHeight: 36/44/48/56px) |
| `loading` | `boolean` | `false` | Muestra spinner |
| `success` | `boolean` | `false` | Muestra checkmark verde |
| `disabled` | `boolean` | `false` | Deshabilitado |
| `fullWidth` | `boolean` | `false` | Ancho completo |
| `icon` | `ComponentChildren` | — | Icono a la izquierda |
| `iconOnly` | `boolean` | `false` | Solo icono (cuadrado) |

### Card

```tsx
import { Card } from '../components/ui/Card'

<Card>Contenido estatico</Card>
<Card variant="interactive" onClick={() => {}}>Clickable</Card>
<Card variant="emergency">Alerta critica</Card>
<Card variant="highlighted">Informacion relevante</Card>
<Card padding="sm">Compacta</Card>
```

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `variant` | `default \| interactive \| emergency \| highlighted` | `default` | Estilo visual |
| `padding` | `sm \| md \| lg` | `md` | Padding interno (12/16/20px) |
| `onClick` | `() => void` | — | Auto-aplica variant interactive |

### ActionCard

```tsx
import { ActionCard } from '../components/ui/ActionCard'
import { IconSOS } from '../components/ui/Icons'
import { colors } from '../design'

<ActionCard
  label="Necesito ayuda"
  Icon={IconSOS}
  gradient={colors.actionRed}
  onClick={() => route('/necesito-ayuda')}
  size="lg"
/>
```

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `label` | `string` | — | Texto del boton |
| `icon` | `string` | — | Emoji como icono |
| `Icon` | `ComponentType` | — | Componente SVG como icono |
| `gradient` | `string` | — | CSS gradient o color de fondo |
| `size` | `sm \| md \| lg` | `md` | Tamano (56/80/100px minHeight) |
| `subtitle` | `string` | — | Texto secundario |
| `onClick` | `() => void` | — | Handler de click |

### SectionHeader

```tsx
import { SectionHeader } from '../components/ui/SectionHeader'

<SectionHeader
  icon="🎯"
  title="Necesidades cerca de ti"
  badge={23}
  badgeColor="#dc2626"
/>
```

| Prop | Tipo | Default | Descripcion |
|------|------|---------|-------------|
| `icon` | `string` | — | Emoji |
| `title` | `string` | — | Titulo (uppercase automatico) |
| `subtitle` | `string` | — | Linea secundaria |
| `badge` | `string \| number` | — | Badge a la derecha |
| `badgeColor` | `string` | — | Color del badge |
| `action` | `ComponentChildren` | — | Elemento a la derecha |

### Badge

```tsx
import { Badge } from '../components/ui/Badge'

<Badge color="#dc2626">Critico</Badge>
<Badge color="#22c55e" icon="✅" size="sm">Activo</Badge>
```

### Skeleton

```tsx
import { Skeleton } from '../components/ui/Skeleton'

<Skeleton count={3} />               // 3 lineas
<Skeleton variant="card" count={2} /> // 2 cards placeholder
<Skeleton variant="circle" count={4} /> // 4 circulos
<Skeleton variant="action" count={4} /> // Grid de acciones
```

### Spinner

```tsx
import { Spinner } from '../components/ui/Spinner'

<Spinner size="sm" />  // 16px
<Spinner size="md" />  // 24px
<Spinner size="lg" />  // 32px
<Spinner size={20} />  // Custom 20px
```

### Sheet

```tsx
import { Sheet } from '../components/ui/Sheet'

<Sheet open={isOpen} onClose={() => {}} title="Opciones">
  <Button fullWidth>Opcion 1</Button>
</Sheet>
```

Bottom-sheet mobile-first. Cierra con Escape, click outside, o boton X.

### Modal

```tsx
import { Modal } from '../components/ui/Modal'

<Modal open={isOpen} onClose={() => {}} title="Confirmar">
  <p>Contenido del modal</p>
</Modal>
```

Centrado en desktop, bottom-sheet en mobile.

### Divider

```tsx
import { Divider } from '../components/ui/Divider'

<Divider />
<Divider label="Seccion" />
```

### EmptyState

```tsx
import { EmptyState } from '../components/ui/EmptyState'

<EmptyState
  icon="📭"
  title="Sin resultados"
  description="No hay datos disponibles."
  action={{ label: 'Reintentar', onClick: () => {} }}
/>
```

### LoadingState

```tsx
import { LoadingState } from '../components/ui/LoadingState'

<LoadingState message="Cargando datos..." />
```

### ErrorState

```tsx
import { ErrorState } from '../components/ui/ErrorState'

<ErrorState
  message="No se pudo conectar."
  onRetry={() => {}}
/>
```

---

## Convenciones

### Usar tokens, no valores inline

```tsx
// MAL
<div style={{ padding: '16px', borderRadius: '12px' }}>

// BIEN
import { spacing, radius } from '../design'
<div style={{ padding: spacing.md, borderRadius: radius.md }}>
```

### Reutilizar componentes

```tsx
// MAL
<div class="bg-nodo-card border border-nodo-border rounded-2xl p-4">

// BIEN
<Card>
```

### SectionHeader para consistencia

```tsx
// MAL
<h2 class="text-[13px] font-bold text-nodo-muted uppercase tracking-wider mb-2.5 flex items-center gap-2">
  <span class="text-base">📊</span> Centro de situacion
</h2>

// BIEN
<SectionHeader icon="📊" title="Centro de situacion" />
```

### Touch targets

Todo elemento interactivo debe tener minHeight 44px. Acciones primarias 48px+. Botones de formulario 56px.

### Skeletons sobre spinners

Usar `<Skeleton variant="card" />` en lugar de un spinner generico cuando la estructura del contenido es predecible.

### States

Usar `<EmptyState />`, `<LoadingState />`, `<ErrorState />` en lugar de construir estos estados ad-hoc en cada componente.

---

## Playground

Accesible en `/design-system` (requiere sesion de admin).

Muestra todos los componentes con todas sus variantes para validacion visual antes de integrar en la aplicacion.
