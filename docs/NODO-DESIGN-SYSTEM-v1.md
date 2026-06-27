# NODO Design System v1.0

**Centro de Coordinacion Ciudadana**
Documento oficial de identidad visual — Referencia para todo desarrollo presente y futuro.

---

## Filosofia

NODO transmite:

- **Confianza** — Cada elemento inspira seguridad.
- **Humanidad** — Las personas estan primero.
- **Organizacion** — Claridad en cada decision visual.
- **Rapidez** — Informacion accesible en segundos.
- **Esperanza** — La solidaridad como motor.
- **Tecnologia** — Herramientas modernas al servicio de la comunidad.
- **Solidaridad** — Conectar a quienes necesitan con quienes pueden ayudar.

NODO nunca se siente: frio, corporativo, militar, politico, agresivo.
NODO siempre se siente: humano, cercano, confiable, organizado.

---

## 1. Logo

El logo actual es el logo oficial aprobado.

### Reglas

- NO modificar formas, proporciones, tipografia ni colores.
- NO crear versiones alternativas.
- NO aplicar efectos, sombras ni degradados sobre el logo.
- El logo debe mantenerse limpio sobre fondo oscuro.
- Espacio minimo alrededor del logo: 8px en todas las direcciones.

### Uso en la aplicacion

| Contexto         | Tamano  | Archivo           |
|------------------|---------|-------------------|
| Header           | 32x32   | `/logo.png`       |
| Splash / Hero    | 80x80   | `/logo.png`       |
| PWA icon         | 192x192 | `/icons/icon-192.png` |
| PWA icon grande  | 512x512 | `/icons/icon-512.png` |
| Maskable         | 512x512 | `/icons/icon-maskable-512.png` |
| Apple Touch      | 180x180 | `/apple-touch-icon.png` |
| Favicon          | 32x32   | `/favicon-32.png` |

---

## 2. Paleta de colores

### Colores de marca (del logo)

| Token            | HEX       | RGB              | Uso                                    |
|------------------|-----------|------------------|----------------------------------------|
| `brand-red`      | `#CF2E2E` | 207, 46, 46      | Identidad, emergencias, SOS            |
| `brand-gold`     | `#D4951A` | 212, 149, 26     | Destacados, actualizaciones, novedades  |
| `brand-blue`     | `#245DA5` | 36, 93, 165      | Institucional, navegacion, informacion  |
| `brand-navy`     | `#172340` | 23, 35, 64       | Fondos institucionales, banners        |

### Colores funcionales

| Token            | HEX       | RGB              | Uso                                    |
|------------------|-----------|------------------|----------------------------------------|
| `nodo-red`       | `#dc2626` | 220, 38, 38      | Botones primarios, alertas activas     |
| `nodo-dark`      | `#0f1724` | 15, 23, 36       | Fondo principal de la aplicacion       |
| `nodo-card`      | `#1a2332` | 26, 35, 50       | Fondo de tarjetas y paneles            |
| `nodo-border`    | `#2a3545` | 42, 53, 69       | Bordes, separadores, lineas            |
| `nodo-text`      | `#f1f5f9` | 241, 245, 249    | Texto principal                        |
| `nodo-muted`     | `#94a3b8` | 148, 163, 184    | Texto secundario, etiquetas, hints     |

### Colores de estado

| Proposito        | HEX       | Contexto                                |
|------------------|-----------|-----------------------------------------|
| Exito / Ayuda    | `#22c55e` | Confirmaciones, ofertas, persona OK     |
| Advertencia      | `#eab308` | Media urgencia, casi lleno, novedades   |
| Peligro          | `#dc2626` | Emergencias, critico, errores           |
| Informacion      | `#3b82f6` | Links, informacion, personas            |
| Naranja          | `#f97316` | Alta urgencia, incidentes               |
| Violeta          | `#8b5cf6` | Refugios, centros medicos               |

### Jerarquia de color

**Rojo** — Emergencias, SOS, alertas, botones criticos. Nunca decorativo.
**Azul** — Navegacion, informacion, mapa, enlaces. Confianza institucional.
**Amarillo/Gold** — Destacados, actualizaciones, novedades. Atencion sin alarma.
**Verde** — Confirmaciones, ayuda disponible, exito. Tranquilidad.
**Gris/Muted** — Texto secundario, deshabilitados, placeholders.

---

## 3. Tipografia

### Fuente

```
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

Fuente nativa del sistema. Carga instantanea, sin descargas externas.

### Escala tipografica

| Nivel      | Tamano    | Peso        | Line-height | Uso                          |
|------------|-----------|-------------|-------------|------------------------------|
| H1         | 24-30px   | 800 (extra) | tight       | Titulos de pagina, hero      |
| H2         | 18-20px   | 700 (bold)  | snug        | Titulos de seccion           |
| H3         | 15-16px   | 700 (bold)  | snug        | Subtitulos, nombres          |
| Body       | 14-15px   | 400-600     | relaxed     | Texto general, descripciones |
| Small      | 12-13px   | 500-600     | snug        | Botones, chips, accesos      |
| Caption    | 10-11px   | 500-600     | none/tight  | Etiquetas, timestamps, muted |
| Micro      | 9px       | 600         | none        | Bottom nav labels            |

### Pesos

| Peso | Token      | Uso                                     |
|------|------------|-----------------------------------------|
| 400  | normal     | Texto descriptivo, parrafos             |
| 500  | medium     | Etiquetas, captions, texto secundario   |
| 600  | semibold   | Botones, chips, labels activos          |
| 700  | bold       | Titulos, nombres, destacados            |
| 800  | extrabold  | Logo "NODO", titulos hero               |

### Tracking

| Contexto            | Valor           |
|---------------------|-----------------|
| Logo "NODO"         | `tracking-wide` |
| Titulos hero        | `tracking-tight`|
| Section headers     | `tracking-wider`|
| Texto general       | normal          |

---

## 4. Espaciado

### Escala oficial (en px)

```
2 — Micro gap (icon-label dentro de nav)
4 — Tiny spacing
8 — XS (padding chips, gap minimo)
10 — SM chips padding
12 — SM gap (entre elementos inline)
16 — MD (padding tarjetas, gap cards)
20 — LG
24 — XL (padding secciones)
32 — 2XL
48 — 3XL
64 — 4XL
```

### Uso recomendado

| Contexto                      | Valor   |
|-------------------------------|---------|
| Gap entre items en lista      | 8-12px  |
| Padding interior de tarjeta   | 16px    |
| Gap entre tarjetas            | 8-12px  |
| Padding de seccion horizontal | 16px    |
| Espacio entre secciones       | 12-16px |
| Margin inferior de pagina     | 80px (pb-20) para bottom nav |

---

## 5. Bordes

### Escala de radios

| Token        | Valor   | Uso                                    |
|--------------|---------|----------------------------------------|
| `rounded-md` | 6px     | Inputs internos                        |
| `rounded-lg` | 8px     | Badges, chips, logo en header          |
| `rounded-xl` | 12px    | Botones, accesos rapidos, back button  |
| `rounded-2xl`| 16px    | Tarjetas, modales, paneles principales |
| `rounded-full`| 9999px | Status dots, avatares, pill badges     |

### Bordes

| Tipo           | Valor                     | Uso                        |
|----------------|---------------------------|----------------------------|
| Borde estandar | `1px solid nodo-border`   | Tarjetas, inputs, paneles  |
| Borde sutil    | `1px solid white/[0.06]`  | Header, bottom nav, glass  |
| Borde activo   | `1px solid white/[0.20]`  | Categoria activa, focus    |
| Sin borde      | ninguno                   | Botones primarios gradient |

---

## 6. Sombras

| Nivel     | Valor                              | Uso                          |
|-----------|------------------------------------|------------------------------|
| SM        | `shadow-sm shadow-black/10`        | Accesos rapidos              |
| LG        | `shadow-lg shadow-black/20`        | Botones primarios, cards CTA |
| XL        | `shadow-xl shadow-black/30`        | Dropdown, filtros mapa       |
| 2XL       | `shadow-2xl shadow-black/40`       | Modales, popups              |
| Color     | `shadow-lg shadow-red-900/20`      | Boton primario rojo          |
| Color     | `shadow-lg shadow-blue-900/30`     | CTA compartir                |
| Color     | `shadow-lg shadow-emerald-900/30`  | CTA ayudar                   |

---

## 7. Gradientes

### Biblioteca oficial

Los gradientes SOLO se usan en: botones principales, CTAs, cards de accion, hero, banners.
NUNCA sobre el logo.

| Nombre          | Valor                                            | Uso               |
|-----------------|--------------------------------------------------|--------------------|
| Emergencia      | `from-red-600 to-red-700`                        | Necesito ayuda     |
| Ayuda           | `from-emerald-600 to-emerald-700`                | Quiero ayudar      |
| Busqueda        | `from-amber-600 to-amber-700`                    | Buscar personas    |
| Informacion     | `from-blue-600 to-blue-700`                      | Reportar incidente |
| Compartir       | `from-blue-600 via-blue-500 to-cyan-500`         | CTA difusion       |
| Alerta          | `from-red-900/90 via-red-800/90 to-red-900/90`   | Banner emergencia  |
| Institucional   | `from-brand-navy via-nodo-card to-brand-navy`     | Llamado final      |

Direccion por defecto: `to-br` (diagonal) para cards, `to-r` (horizontal) para banners.
Todos los gradientes deben ser sutiles, nunca saturados.

---

## 8. Efecto Glass

```css
.glass {
  background: rgba(15, 23, 36, 0.82);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
```

**Uso:** Header, Bottom Navigation, controles flotantes del mapa, dropdowns.
**Nunca:** Sobre tarjetas de contenido regulares ni formularios.

---

## 9. Las tres lineas

Las tres lineas bajo el logo son un elemento de identidad oficial.

```html
<div class="nodo-lines">
  <span></span>
  <span></span>
  <span></span>
</div>
```

Colores: Rojo (`#CF2E2E`), Gold (`#D4951A`), Azul (`#245DA5`).

### Variantes

| Clase           | Tamano linea | Uso                            |
|-----------------|-------------|--------------------------------|
| `.nodo-lines`    | 24x3px      | Separadores, titulos           |
| `.nodo-lines--sm`| 16x2px      | Inline, indicadores pequenos   |
| `.nodo-lines--lg`| 32x4px      | Hero, presentaciones           |

### Usos permitidos

- Separador decorativo entre secciones.
- Debajo de titulos destacados.
- Indicador de carga (con animacion).
- Decoracion en presentaciones y PDF.

### Usos prohibidos

- Nunca como borde de tarjeta.
- Nunca como fondo.
- Nunca mas de una vez por pantalla visible.

---

## 10. Patron de fondo

```css
.nodo-pattern {
  background-image: radial-gradient(circle, var(--color-nodo-border) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.03;
}
```

**Uso:** Landing, Acerca de, presentaciones, PDF, documentacion.
**Opacidad:** 2-4%. Nunca visible, solo textura.
**Nunca:** Competir con el contenido. Si un usuario no lo nota conscientemente, esta bien.

---

## 11. Iconografia

### Especificacion

| Propiedad      | Valor                |
|----------------|----------------------|
| ViewBox        | `0 0 24 24`          |
| Estilo         | Outline (stroke)     |
| stroke-width   | 2 (2.5 para check)   |
| stroke-linecap | round                |
| stroke-linejoin| round                |
| Fill           | none (siempre)       |
| Formato        | SVG inline (JSX)     |

### Tamanos estandar

| Contexto             | Tamano |
|----------------------|--------|
| Bottom navigation    | 18px   |
| Accesos rapidos      | 16px   |
| Botones primarios    | 32px   |
| Back button          | 18px   |
| Inline con texto     | 16px   |

### Reglas

- Todos los iconos deben parecer de la misma familia.
- Nunca mezclar estilos filled y outline en la misma vista.
- Nunca usar iconos de librerias externas.
- Cada icono nuevo debe seguir la misma interfaz: `{ size?: number; class?: string }`.

### Catalogo actual

Home, MapPin, Phone, Building, Info, SOS, Heart, Search, Alert, ArrowLeft, Share, Refresh, Filter, Close, Box, Check, Navigation.

---

## 12. Componentes

### Card

```
Fondo:      bg-nodo-card
Borde:      1px solid nodo-border
Radio:      rounded-2xl (16px)
Padding:    p-4 (16px)
Transicion: duration-200
Hover:      bg-white/[0.06] (solo si es clickable)
Pressed:    scale-[0.98] (solo si es clickable)
```

### Button

| Variante   | Fondo                          | Texto        | Borde             |
|------------|--------------------------------|--------------|-------------------|
| Primary    | `bg-nodo-red`                  | white        | ninguno           |
| Secondary  | `bg-nodo-card`                 | white        | `nodo-border`     |
| Danger     | `bg-red-900/60`                | red-200      | `red-700/50`      |
| Ghost      | transparente                   | nodo-muted   | ninguno           |
| Gradient   | gradiente (ver seccion 7)       | white        | ninguno           |

**Tamanos:**

| Size | Padding      | Font    | Min-height | Gap   |
|------|-------------|---------|------------|-------|
| sm   | px-3.5 py-2  | 14px    | 36px       | 6px   |
| md   | px-5 py-3    | 15px    | 44px       | 8px   |
| lg   | px-6 py-3.5  | 16px    | 48px       | 8px   |
| xl   | px-6 py-4    | 18px    | 56px       | 8px   |

**Estados:**

| Estado    | Efecto                            |
|-----------|-----------------------------------|
| Normal    | Estado base                       |
| Hover     | Fondo mas claro / sombra mayor    |
| Pressed   | `active:scale-[0.97]`            |
| Disabled  | `opacity-40`, pointer-events-none |
| Loading   | Spinner SVG animado a la izquierda|

**Radio:** Siempre `rounded-xl` (12px).

### Back Button

```
Tamano:   w-9 h-9 (36x36px)
Radio:    rounded-xl
Fondo:    bg-nodo-card
Borde:    border-nodo-border
Hover:    bg-white/[0.06]
Icono:    ArrowLeft 18px
```

### Badge / Chip

```
Padding:    px-2 py-0.5
Radio:      rounded-full
Font:       text-xs (12px) font-medium
Fondo:      color al 13% opacidad
Texto:      color del estado
Borde:      color al 27% opacidad
```

### Status Badge

Variantes: RequestStatus, PersonStatus, Urgency — cada una usa el color de su estado.

### Spinner

```
SVG animado con animate-spin.
Circulo exterior: opacity-25, stroke del color actual.
Arco de progreso: opacity-75, fill del color actual.
Tamano por defecto: 24px.
```

### Modal

```
Overlay:     bg-black/60 backdrop-blur-sm
Contenedor:  bg-nodo-card border-nodo-border
Radio:       rounded-t-2xl (mobile) / rounded-2xl (desktop)
Max width:   max-w-lg
Max height:  max-h-[80vh]
Padding:     p-6
Animacion:   animate-slide-up
Sombra:      shadow-2xl shadow-black/40
Close btn:   w-8 h-8 rounded-lg con icono X
```

### Skeleton Loader

```css
background: linear-gradient(90deg, nodo-card 25%, nodo-border 50%, nodo-card 75%);
background-size: 200% 100%;
animation: shimmer 1.5s ease-in-out infinite;
border-radius: 8px;
```

### Header

```
Posicion:    sticky top-0 z-40
Fondo:       glass
Borde:       border-b border-white/[0.06]
Logo:        32x32px rounded-lg
Titulo:      "NODO" extrabold 15px tracking-wide
Indicador:   1.5px dot con pulse animation
Max width:   max-w-lg centrado
```

### Bottom Navigation

```
Posicion:    fixed bottom-0 z-40
Fondo:       glass
Borde:       border-t border-white/[0.06]
Altura:      42px + safe-area-inset-bottom
Iconos:      18px
Labels:      9px semibold
Max width:   max-w-lg centrado
Activo:      text-white + linea indicadora superior (2px blanca)
Inactivo:    text-gray-500
```

### Empty State

```
Contenedor:  bg-nodo-card border-nodo-border rounded-2xl p-8 text-center
Icono:       emoji 3xl (30px)
Titulo:      text-sm font-medium text-nodo-muted
Subtitulo:   text-xs text-nodo-muted mt-1.5
```

---

## 13. Animaciones

### Catalogo

| Nombre       | Duracion | Easing                          | Uso                          |
|--------------|----------|---------------------------------|------------------------------|
| fadeIn        | 300ms    | ease-out                        | Entrada de paginas, datos    |
| slideUp       | 400ms    | cubic-bezier(0.16, 1, 0.3, 1)  | Modales, listas, tarjetas    |
| scaleIn       | 250ms    | ease-out                        | Indicadores, tooltips        |
| shimmer       | 1500ms   | ease-in-out (loop)              | Skeleton loaders             |
| pulse-dot     | 2000ms   | ease-in-out (loop)              | Indicador en linea           |
| spin          | nativo   | linear (loop)                   | Spinner de carga             |

### Stagger

Cuando multiples elementos entran en secuencia:
```
Delay entre hijos: 60ms
Animacion: slideUp
Maximo 6 hijos con delay (despues todos en 300ms)
```

### Reglas

- Nunca mas de 400ms para una animacion de entrada.
- Las animaciones de salida no son necesarias (el contenido simplemente desaparece).
- Todas las transiciones de hover/active usan `duration-200`.
- `active:scale-[0.97]` para botones, `active:scale-[0.98]` para cards.
- Nunca animaciones que bloqueen la interaccion.
- Nunca animaciones decorativas sin proposito funcional.

---

## 14. Estados interactivos

### Hover

| Componente       | Efecto                          |
|------------------|---------------------------------|
| Card clickable   | `bg-white/[0.06]`              |
| Boton primario   | Color de fondo mas oscuro       |
| Boton secundario | `bg-white/[0.08]`              |
| Boton ghost      | `bg-white/[0.06]` + text-white |
| Acceso rapido    | `bg-white/[0.08]`              |
| Link             | text-white (si era muted)       |

### Focus

```css
outline: none;
border-color: #3b82f6;
box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
```

Se aplica a: inputs, selects, textareas.
Para botones: no se usa focus visible externo (el active scale es suficiente).

### Disabled

```
opacity: 0.40
pointer-events: none
```

---

## 15. Fotografia e ilustraciones

### Fotografia

Las imagenes deben transmitir: solidaridad, comunidad, esperanza, accion, trabajo conjunto.

**Prohibido:**
- Imagenes morbosas o violentas.
- Fotografias que vulneren la dignidad de las personas.
- Imagenes con contenido politico.
- Imagenes que generen panico.

### Ilustraciones

Estilo: limpio, minimalista, moderno, optimista.
Paleta: usar colores de marca.
Formato: SVG preferido sobre PNG para escalabilidad.

---

## 16. Tono de comunicacion

NODO siempre habla: **claro, humano, simple, empatico.**

| Situacion            | Bien                                          | Mal                                     |
|----------------------|-----------------------------------------------|------------------------------------------|
| Error                | "No pudimos enviar. Intenta de nuevo."        | "ERROR 500: Internal Server Error"       |
| Vacio                | "No hay refugios registrados todavia."        | "Sin datos"                              |
| Exito                | "Tu reporte fue enviado."                     | "Operacion completada exitosamente."     |
| Confirmacion         | "Enlace copiado!"                             | "El contenido ha sido copiado al clipboard."|
| Carga                | (spinner silencioso)                          | "Cargando datos, por favor espere..."    |

**Nunca:** alarmista, politico, dramatico, tecnico.
**Siempre:** directo, empatetico, orientado a la accion.

---

## 17. Redes sociales

### Lenguaje visual

Toda pieza de comunicacion externa debe usar:

- Logo oficial sin modificaciones.
- Colores de la paleta oficial.
- Tipografia del sistema o sans-serif neutra.
- Las tres lineas como elemento decorativo.
- Fondo oscuro (nodo-dark o brand-navy).

### Formatos

| Pieza              | Tamano             | Fondo recomendado  |
|--------------------|--------------------|--------------------|
| Instagram post     | 1080x1080          | nodo-dark          |
| Instagram story    | 1080x1920          | brand-navy         |
| Facebook cover     | 820x312            | brand-navy         |
| WhatsApp share     | 1200x630           | nodo-dark          |
| Flyer A4           | 2480x3508          | nodo-dark          |
| Presentacion 16:9  | 1920x1080          | brand-navy         |

### Reglas

- Logo siempre centrado o esquina superior izquierda.
- Nunca mas de 3 colores de marca por pieza.
- Texto siempre nodo-text o white sobre fondos oscuros.
- Gradientes solo para CTAs o destacados, nunca como fondo completo.

---

## 18. Responsive

### Breakpoints

| Nombre | Valor  | Uso                              |
|--------|--------|----------------------------------|
| Mobile | <640px | Diseno principal, prioridad       |
| SM     | 640px+ | Ajustes de grid (2 columnas)     |
| MD     | 768px+ | Contenido mas ancho              |
| LG     | 1024px+| Max-width contenedor             |

### Max-width de contenido

| Contexto      | Valor     |
|---------------|-----------|
| Main content  | `max-w-lg` (512px) |
| About page    | `max-w-2xl` (672px)|
| Header/Nav    | `max-w-lg` (512px) |

### Mobile-first

Toda propiedad CSS se escribe para mobile por defecto.
Las adaptaciones a desktop usan prefijos `sm:` o `md:`.

---

## 19. Accesibilidad

### Requisitos minimos

- Todo boton interactivo debe tener `aria-label` si no tiene texto visible.
- Cards clickeables deben tener `role="button"` y `tabIndex={0}`.
- El modal debe tener `role="dialog"` y `aria-modal="true"`.
- Los inputs deben tener `font-size: 16px` minimo para evitar zoom en iOS.
- Nunca usar color como unico indicador de estado (siempre acompanar con texto o icono).
- Contraste minimo entre texto y fondo: 4.5:1.
- Focus visible en todos los elementos interactivos.

### Tamanos minimos de touch target

| Componente       | Tamano minimo  |
|------------------|---------------|
| Boton            | 44x44px (md)  |
| Back button      | 36x36px       |
| Bottom nav item  | 42px alto     |
| Chip/Tag         | 36px alto     |

---

## 20. Buenas y malas practicas

### Buenas practicas

- Usar tokens de color definidos, nunca valores HEX directos.
- Usar componentes existentes (Button, Card, Badge, Modal).
- Seguir la escala de espaciado.
- Seguir la escala de radios (no inventar nuevos).
- Mantener animaciones sutiles y funcionales.
- Escribir texto claro, humano y directo.
- Priorizar mobile-first.
- Usar SVG inline para iconos, nunca imagenes.
- Toda nueva pantalla debe sentirse parte de la misma aplicacion.

### Malas practicas

- Agregar librerias de iconos externas.
- Usar colores fuera de la paleta oficial.
- Mezclar estilos de iconos (filled + outline).
- Usar animaciones largas (>400ms) o agresivas.
- Usar sombras excesivas o de colores saturados.
- Escribir texto tecnico, alarmista o dramatico.
- Modificar el logo de cualquier manera.
- Usar gradientes sobre el logo.
- Crear componentes visuales que no sigan este sistema.
- Usar bordes redondeados fuera de la escala definida.

---

## 21. Archivos de referencia

| Archivo                              | Proposito                          |
|--------------------------------------|------------------------------------|
| `src/index.css`                      | Tokens, animaciones, utilidades    |
| `src/components/ui/Button.tsx`       | Componente boton oficial           |
| `src/components/ui/Card.tsx`         | Componente tarjeta oficial         |
| `src/components/ui/Badge.tsx`        | Componente badge oficial           |
| `src/components/ui/Modal.tsx`        | Componente modal oficial           |
| `src/components/ui/Spinner.tsx`      | Indicador de carga                 |
| `src/components/ui/Icons.tsx`        | Catalogo de iconos SVG             |
| `src/components/ui/StatusBadge.tsx`  | Badges de estado                   |
| `src/components/layout/Header.tsx`   | Header oficial                     |
| `src/components/layout/BottomNav.tsx`| Navegacion inferior oficial        |

---

## 22. Regla fundamental

> Cada nueva pantalla, componente o pieza visual que se construya
> debe parecer disenada por el mismo equipo.
>
> NODO no es una coleccion de componentes.
> Es un ecosistema visual.

---

*NODO Design System v1.0*
*Centro de Coordinacion Ciudadana*
*Documento oficial — Referencia para todo desarrollo presente y futuro.*
