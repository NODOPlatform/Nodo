import { useLocation } from 'preact-iso'
import { useSignal } from '@preact/signals'
import { IconShare } from '../components/ui/Icons'

const SHARE_URL = 'https://nodoayuda.com/colaborar'
const SHARE_TEXT = `Conoce NODO — Centro de Coordinacion Ciudadana para emergencias en Venezuela.\n\nSi tu organizacion quiere colaborar, entra aqui:\n\n${SHARE_URL}`

const PLATFORMS = [
  'Directorios de hospitales.',
  'Listados de centros de acopio.',
  'Personas desaparecidas.',
  'Campanas de donacion.',
  'Refugios.',
  'Informacion verificada.',
]

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Centro de coordinacion en tiempo real',
    desc: 'Toda la informacion se representa geograficamente para que las personas puedan encontrar rapidamente recursos cercanos.',
  },
  {
    icon: '🤝',
    title: 'Conectar ayuda con quien la necesita',
    desc: 'No solo se publican solicitudes. Tambien personas que quieren ayudar. La plataforma relaciona automaticamente ambas partes.',
  },
  {
    icon: '👥',
    title: 'Buscar personas',
    desc: 'Reportar personas desaparecidas y encontradas. Casos de reunificacion familiar. Integracion con plataformas colaboradoras verificadas.',
  },
  {
    icon: '❤️',
    title: 'Solicitudes urgentes de salud',
    desc: 'Donantes de sangre, informacion del hospital, cantidad de donantes necesarios, contacto directo por WhatsApp y nivel de prioridad.',
  },
  {
    icon: '📦',
    title: 'Centros de acopio',
    desc: 'Ubicaciones verificadas con informacion detallada, mapa y administracion centralizada.',
  },
  {
    icon: '🏠',
    title: 'Refugios',
    desc: 'Ubicacion, capacidad, informacion de contacto y acceso directo desde el mapa.',
  },
  {
    icon: '📢',
    title: 'Campanas verificadas',
    desc: 'Jornadas de donacion, vacunacion, entrega de alimentos, recoleccion de insumos. Creacion manual o mediante IA a partir de una imagen o flyer.',
  },
  {
    icon: '🚨',
    title: 'Reporte de incidentes',
    desc: 'Derrumbes, inundaciones, vias cerradas y peligros geolocalizados en tiempo real.',
  },
  {
    icon: '📰',
    title: 'Informacion verificada',
    desc: 'Espacio dedicado para publicar unicamente informacion revisada y confiable.',
  },
  {
    icon: '🌎',
    title: 'Integracion con otras plataformas',
    desc: 'NODO incorpora enlaces a plataformas colaboradoras verificadas para que el usuario consulte multiples fuentes confiables.',
  },
]

const AI_CAPABILITIES = [
  'Clasificar publicaciones.',
  'Extraer informacion desde imagenes y flyers.',
  'Detectar campanas.',
  'Extraer telefonos, fechas y ubicaciones.',
  'Preparar la informacion para revision humana.',
]

export function Collaborate() {
  const { route } = useLocation()
  const copied = useSignal(false)

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'NODO — Colaborar', text: SHARE_TEXT, url: SHARE_URL }) } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(SHARE_TEXT)
        copied.value = true
        setTimeout(() => { copied.value = false }, 2500)
      } catch {}
    }
  }

  return (
    <div class="pb-20 animate-fade-in">
      {/* Back */}
      <div class="px-4 pt-4 max-w-2xl mx-auto">
        <button
          class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors"
          aria-label="Volver"
          onClick={() => route('/')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      {/* Hero */}
      <section class="px-6 pt-8 pb-6 max-w-2xl mx-auto">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-4">
          Que es NODO y por que queremos colaborar?
        </h1>
        <p class="text-sm text-nodo-muted leading-relaxed">
          Antes que nada, queremos agradecer el trabajo que cada organizacion, comunidad y voluntario esta realizando. En una emergencia, cualquier iniciativa que ayude a las personas tiene un enorme valor.
        </p>
        <p class="text-sm text-nodo-muted leading-relaxed mt-3">
          Nos gustaria contarles cual es la vision de NODO y por que creemos que podemos complementarnos.
        </p>
      </section>

      <Divider />

      {/* No competir */}
      <section class="px-6 py-8 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-4">NODO no busca competir.</h2>
        <div class="space-y-3 text-sm text-nodo-muted leading-relaxed">
          <p>No queremos reemplazar plataformas que publican hospitales, centros de acopio, refugios o campanas.</p>
          <p class="text-nodo-text font-medium">Al contrario.</p>
          <p>Queremos que toda esa informacion pueda convivir en un mismo ecosistema y ayudar a conectar mucho mas rapido a quienes necesitan ayuda con quienes pueden brindarla.</p>
        </div>
      </section>

      <Divider />

      {/* Diferencia */}
      <section class="px-6 py-8 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-4">Cual es la diferencia?</h2>
        <p class="text-sm text-nodo-muted leading-relaxed mb-4">
          Muchas plataformas resuelven una necesidad especifica. Por ejemplo:
        </p>
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-5">
          <ul class="space-y-2">
            {PLATFORMS.map(p => (
              <li key={p} class="flex items-center gap-2.5 text-sm text-nodo-muted">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p class="text-sm text-nodo-muted leading-relaxed mb-2">Todo eso es fundamental.</p>
        <p class="text-sm text-nodo-text font-semibold leading-relaxed mb-2">NODO busca ir un paso mas alla.</p>
        <p class="text-sm text-nodo-muted leading-relaxed mb-1">No solo mostrar informacion.</p>
        <p class="text-sm text-nodo-text font-bold leading-relaxed">Sino coordinarla.</p>
      </section>

      <Divider />

      {/* Funcionalidades */}
      <section class="px-6 py-8 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5">Hoy NODO permite:</h2>
        <div class="space-y-3">
          {FEATURES.map(f => (
            <div key={f.title} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 flex items-start gap-3.5">
              <div class="w-11 h-11 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl flex-shrink-0">
                {f.icon}
              </div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold mb-1">{f.title}</h3>
                <p class="text-[12px] text-nodo-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* IA */}
      <section class="px-6 py-8 max-w-2xl mx-auto">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
          <h2 class="text-xl font-bold">Inteligencia Artificial</h2>
        </div>
        <p class="text-sm text-nodo-muted leading-relaxed mb-4">La IA ayuda a:</p>
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 mb-4">
          <ul class="space-y-2">
            {AI_CAPABILITIES.map(c => (
              <li key={c} class="flex items-center gap-2.5 text-sm text-nodo-muted">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
          <p class="text-[12px] text-amber-300 font-semibold leading-relaxed">
            La IA nunca publica automaticamente. Siempre existe validacion humana.
          </p>
        </div>
      </section>

      <Divider />

      {/* Motor Inteligente */}
      <section class="px-6 py-8 max-w-2xl mx-auto">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl flex-shrink-0">🧠</div>
          <h2 class="text-xl font-bold">Motor de Coordinacion Inteligente</h2>
        </div>
        <p class="text-sm text-nodo-muted leading-relaxed">
          NODO comienza a relacionar automaticamente solicitudes, voluntarios, campanas, refugios y recursos cercanos para reducir el tiempo entre una necesidad y una respuesta.
        </p>
      </section>

      <Divider />

      {/* Arquitectura */}
      <section class="px-6 py-8 max-w-2xl mx-auto">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl flex-shrink-0">🌍</div>
          <h2 class="text-xl font-bold">Arquitectura preparada para crecer</h2>
        </div>
        <p class="text-sm text-nodo-muted leading-relaxed">
          La plataforma fue disenada para integrar nuevas organizaciones, nuevas bases de datos y nuevas fuentes de informacion sin necesidad de rehacer el sistema.
        </p>
      </section>

      <Divider />

      {/* Vision */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5">Nuestra vision</h2>
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-6 space-y-4">
          <p class="text-sm text-nodo-muted leading-relaxed">
            Creemos que ninguna organizacion puede resolver una emergencia por si sola.
          </p>
          <p class="text-sm text-nodo-text font-medium leading-relaxed">
            Por eso queremos construir una infraestructura abierta donde distintas iniciativas puedan aportar informacion y fortalecer un mismo ecosistema de coordinacion ciudadana.
          </p>
          <p class="text-sm text-nodo-muted leading-relaxed">
            Si una organizacion ya tiene una excelente base de datos de hospitales, centros de acopio, refugios o campanas, no queremos reemplazarla.
          </p>
          <p class="text-sm text-nodo-text font-semibold leading-relaxed">
            Queremos integrarla.
          </p>
          <p class="text-sm text-nodo-muted leading-relaxed">
            Mientras mas iniciativas colaboren, mayor sera la capacidad de respuesta para las personas que realmente necesitan ayuda.
          </p>
        </div>
      </section>

      <Divider />

      {/* Cierre */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <div class="bg-gradient-to-br from-blue-900/30 via-nodo-card to-emerald-900/20 border border-nodo-border rounded-2xl p-6 sm:p-8 text-center">
          <p class="text-sm text-nodo-muted leading-relaxed mb-3">
            Porque al final, el objetivo no es que una plataforma tenga mas usuarios.
          </p>
          <p class="text-lg sm:text-xl font-extrabold text-white leading-snug mb-6">
            El objetivo es que la ayuda llegue mas rapido a quien la necesita.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <button
              onClick={handleShare}
              class="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl py-3.5 px-5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all duration-200 active:scale-[0.97]"
            >
              <IconShare size={18} class="text-white" />
              {copied.value ? 'Enlace copiado!' : 'Compartir esta pagina'}
            </button>
            <a
              href="mailto:contacto@nodoayuda.com"
              class="flex-1 bg-nodo-card border border-nodo-border rounded-xl py-3.5 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-all duration-200 active:scale-[0.97]"
            >
              Contactarnos
            </a>
          </div>
          <p class="text-[11px] text-nodo-muted mt-4">contacto@nodoayuda.com</p>
        </div>
      </section>
    </div>
  )
}

function Divider() {
  return <div class="max-w-2xl mx-auto px-6"><div class="border-t border-nodo-border" /></div>
}
