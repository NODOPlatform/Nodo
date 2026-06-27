import { useSignal } from '@preact/signals'
import { useLocation } from 'preact-iso'
import { IconShare } from '../components/ui/Icons'

const SHARE_URL = 'https://nodoayuda.com'
const SHARE_TEXT = `🚨 Estamos usando NODO para coordinar ayuda durante la emergencia.\n\nSi necesitas ayuda o puedes ayudar entra aqui:\n\n${SHARE_URL}`

const STEPS = [
  { num: '1', icon: '🆘', text: 'Una persona publica una necesidad.' },
  { num: '2', icon: '❤️', text: 'Otra persona puede ofrecer ayuda.' },
  { num: '3', icon: '📢', text: 'La comunidad comparte la informacion.' },
  { num: '4', icon: '🤝', text: 'Se coordinan los recursos.' },
  { num: '5', icon: '✅', text: 'La ayuda llega donde realmente se necesita.' },
]

const ACTIONS = [
  { icon: '🆘', title: 'Solicitar ayuda', desc: 'Publica lo que necesitas y tu ubicacion para que otros puedan ayudarte.' },
  { icon: '🤝', title: 'Ofrecer ayuda', desc: 'Comparte lo que tienes disponible: agua, comida, transporte, herramientas.' },
  { icon: '🔍', title: 'Buscar personas', desc: 'Registra la busqueda de un familiar o reporta que alguien fue encontrado.' },
  { icon: '🚨', title: 'Reportar incidentes', desc: 'Informa sobre derrumbes, inundaciones, calles bloqueadas u otros peligros.' },
  { icon: '🏠', title: 'Encontrar refugios', desc: 'Consulta refugios temporales disponibles con estado en tiempo real.' },
  { icon: '🏥', title: 'Consultar hospitales', desc: 'Accede a los telefonos de emergencia y centros medicos cercanos.' },
  { icon: '📦', title: 'Ver centros de acopio', desc: 'Encuentra puntos de recepcion y distribucion de ayuda humanitaria.' },
  { icon: '📢', title: 'Consultar informacion oficial', desc: 'Revisa comunicados, vias cerradas, servicios y alertas verificadas.' },
]

const PRINCIPLES = [
  { icon: '❤️', title: 'Humanidad', desc: 'Las personas estan primero.' },
  { icon: '🤝', title: 'Colaboracion', desc: 'Cada ciudadano puede ayudar.' },
  { icon: '✅', title: 'Transparencia', desc: 'Diferenciamos la informacion oficial de la colaborativa.' },
  { icon: '🔒', title: 'Privacidad', desc: 'Solicitamos unicamente la informacion necesaria para coordinar la ayuda.' },
  { icon: '🌎', title: 'Comunidad', desc: 'Creemos en la fuerza de las comunidades organizadas.' },
]

const TECH_FEATURES = [
  'Funciona desde el navegador.',
  'Puede instalarse como aplicacion (PWA).',
  'Compatible con Android e iPhone.',
  'Se adapta a conexiones lentas.',
  'Actualizacion casi en tiempo real.',
  'Disenada con prioridad para dispositivos moviles.',
]

const FAQ = [
  { q: 'Como puedo pedir ayuda?', a: 'Toca el boton "Necesito ayuda" en la pantalla principal, describe tu situacion, selecciona tu ubicacion y envia el reporte. Se publicara inmediatamente en el mapa.' },
  { q: 'Como puedo ayudar?', a: 'Toca "Quiero ayudar" y comparte lo que tienes disponible: agua, comida, transporte, herramientas, espacio para alojar, medicamentos u otros recursos.' },
  { q: 'Como busco a un familiar?', a: 'Usa "Buscar personas" para registrar la busqueda de alguien. Si alguien reporta haberlo encontrado, la informacion se actualizara automaticamente.' },
  { q: 'Quien verifica la informacion?', a: 'NODO diferencia entre informacion oficial (publicada desde el panel de coordinacion) e informacion ciudadana (reportada por los usuarios). Siempre se indica el origen cuando es posible.' },
  { q: 'Como instalo NODO?', a: 'Al visitar nodoayuda.com desde tu telefono, el navegador te ofrecera "Agregar a pantalla de inicio". Tambien puedes hacerlo desde el menu del navegador. No necesitas descargar nada desde una tienda de aplicaciones.' },
  { q: 'Es gratuito?', a: 'Si. NODO es completamente gratuito y no tiene publicidad. Es un proyecto de coordinacion ciudadana sin fines de lucro.' },
  { q: 'Necesito crear una cuenta?', a: 'No. No necesitas registrarte ni crear una cuenta. Puedes usar NODO inmediatamente sin ningun tipo de registro.' },
]

const SOURCES = [
  { icon: '🏥', title: 'Hospitales en Venezuela', desc: 'Directorio de centros de salud y telefonos de emergencia medica.' },
  { icon: '🌎', title: 'Personas reportadas durante la emergencia', desc: 'Registro colaborativo de personas buscadas y encontradas por la comunidad.' },
]

export function About() {
  const { route } = useLocation()
  const copied = useSignal(false)
  const openFaq = useSignal<number | null>(null)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NODO — Coordinacion Ciudadana', text: SHARE_TEXT, url: SHARE_URL })
      } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(SHARE_TEXT)
        copied.value = true
        setTimeout(() => { copied.value = false }, 2500)
      } catch { /* fallback */ }
    }
  }

  return (
    <div class="pb-20 animate-fade-in max-w-2xl mx-auto">
      {/* Back button */}
      <div class="px-4 pt-4 max-w-2xl mx-auto">
        <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-nodo-card border border-nodo-border hover:bg-white/[0.06] transition-colors" aria-label="Volver" onClick={() => route('/')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      {/* Hero */}
      <section class="px-6 pt-8 pb-10 text-center max-w-2xl mx-auto">
        <img src="/logo.png" alt="NODO" class="mx-auto mb-5 w-20 h-20 rounded-2xl" width="80" height="80" />
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-3">Centro de Coordinacion Ciudadana</h1>
        <p class="text-base sm:text-lg font-semibold text-blue-300/90 leading-snug mb-4">Conectamos a quienes necesitan ayuda con quienes pueden brindarla durante una emergencia.</p>
        <p class="text-sm text-nodo-muted leading-relaxed max-w-md mx-auto mb-6">Cuando ocurre una emergencia, el tiempo es el recurso mas valioso. NODO reune en un solo lugar la informacion que las comunidades necesitan para coordinar ayuda, encontrar personas, compartir recursos y mantenerse informadas.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          <button onClick={() => route('/mapa')} class="flex-1 bg-nodo-card border border-nodo-border rounded-xl py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-all duration-200 active:scale-[0.97]">
            <span>🗺️</span> Abrir el mapa
          </button>
          <button onClick={() => route('/quiero-ayudar')} class="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl py-3 px-5 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all duration-200 active:scale-[0.97]">
            <span>🤝</span> Comenzar a ayudar
          </button>
        </div>
      </section>

      <Divider />

      {/* Nuestra Historia */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-4">Por que nacio NODO?</h2>
        <div class="space-y-3 text-sm text-nodo-muted leading-relaxed">
          <p>Los venezolanos hemos enfrentado durante anos situaciones que nos han obligado a ser resilientes.</p>
          <p>En cada emergencia siempre ocurre algo extraordinario: las personas comienzan a ayudarse entre si.</p>
          <p class="text-nodo-text font-medium">Vecinos ayudan a vecinos. Familias ayudan a familias. Desconocidos ayudan a desconocidos.</p>
          <p>Sin embargo, muchas veces esa ayuda no logra llegar a tiempo porque la informacion esta dispersa.</p>
          <p class="text-nodo-text font-medium">NODO nace para conectar esa solidaridad.</p>
          <p>No reemplaza a las instituciones. Las complementa. Su proposito es facilitar que la ayuda llegue mas rapido a quien la necesita.</p>
        </div>
      </section>

      <Divider />

      {/* Nuestra Misión */}
      <section class="px-6 py-10 max-w-2xl mx-auto text-center">
        <h2 class="text-xl font-bold mb-5">Nuestra mision</h2>
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-6 sm:p-8">
          <p class="text-lg sm:text-xl font-bold text-white leading-snug mb-3">Que ninguna persona quede sola durante una emergencia.</p>
          <p class="text-sm text-nodo-muted leading-relaxed">Creemos que la tecnologia puede acercar a las personas cuando mas la necesitan. Queremos que cualquier ciudadano pueda encontrar ayuda, ofrecer ayuda o compartir informacion confiable desde un mismo lugar.</p>
        </div>
      </section>

      <Divider />

      {/* Cómo funciona */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-6 text-center">Como funciona</h2>
        <div class="space-y-0 max-w-sm mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.num} class="stagger">
              <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-xl bg-nodo-card border border-nodo-border flex items-center justify-center text-lg flex-shrink-0">
                  {step.icon}
                </div>
                <div class="flex-1">
                  <span class="text-[11px] text-nodo-muted font-bold uppercase tracking-wider">Paso {step.num}</span>
                  <p class="text-sm font-medium text-nodo-text leading-snug">{step.text}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div class="ml-5 w-px h-5 bg-nodo-border" />
              )}
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Qué puedes hacer */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5 text-center">Que puedes hacer?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACTIONS.map(a => (
            <div key={a.title} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl flex-shrink-0">{a.icon}</div>
              <div class="min-w-0">
                <h3 class="text-sm font-bold mb-0.5">{a.title}</h3>
                <p class="text-[12px] text-nodo-muted leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Información verificada */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-4">Informacion verificada</h2>
        <p class="text-sm text-nodo-muted leading-relaxed mb-5">NODO reune informacion proveniente de distintas fuentes. Para facilitar su evaluacion, diferenciamos claramente el origen:</p>
        <div class="space-y-3">
          <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg flex-shrink-0">📋</div>
            <div>
              <h3 class="text-sm font-bold mb-0.5">Informacion oficial</h3>
              <p class="text-[12px] text-nodo-muted leading-relaxed">Publicada desde el panel de coordinacion por el equipo administrador.</p>
            </div>
          </div>
          <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg flex-shrink-0">👥</div>
            <div>
              <h3 class="text-sm font-bold mb-0.5">Informacion ciudadana</h3>
              <p class="text-[12px] text-nodo-muted leading-relaxed">Reportada directamente por los usuarios de la plataforma en tiempo real.</p>
            </div>
          </div>
          <div class="bg-nodo-card border border-nodo-border rounded-2xl p-4 flex items-start gap-3.5">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-lg flex-shrink-0">🌐</div>
            <div>
              <h3 class="text-sm font-bold mb-0.5">Informacion colaboradora externa</h3>
              <p class="text-[12px] text-nodo-muted leading-relaxed">Proveniente de organizaciones, instituciones o fuentes externas integradas.</p>
            </div>
          </div>
        </div>
        <p class="text-xs text-nodo-muted mt-4 leading-relaxed">Siempre que sea posible se identifica el origen de la informacion para facilitar su evaluacion.</p>
      </section>

      <Divider />

      {/* Fuentes colaboradoras */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5">Fuentes colaboradoras</h2>
        <div class="space-y-3">
          {SOURCES.map(s => (
            <div key={s.title} class="bg-nodo-card border border-nodo-border rounded-2xl p-4 flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-xl flex-shrink-0">{s.icon}</div>
              <div>
                <h3 class="text-sm font-bold mb-0.5">{s.title}</h3>
                <p class="text-[12px] text-nodo-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => route('/colaborar')}
          class="mt-4 w-full bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3.5 hover:border-blue-500/40 transition-all duration-200 active:scale-[0.98]"
        >
          <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl flex-shrink-0">🤝</div>
          <div class="text-left">
            <h3 class="text-sm font-bold mb-0.5">Quieres colaborar con NODO?</h3>
            <p class="text-[12px] text-nodo-muted leading-relaxed">Conoce nuestra vision y como podemos complementarnos.</p>
          </div>
        </button>
      </section>

      <Divider />

      {/* Tecnología */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5">Tecnologia</h2>
        <div class="bg-nodo-card border border-nodo-border rounded-2xl p-5">
          <div class="space-y-3">
            {TECH_FEATURES.map(f => (
              <div key={f} class="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                <span class="text-sm text-nodo-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* Principios */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5 text-center">Principios de NODO</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRINCIPLES.map(p => (
            <div key={p.title} class="bg-nodo-card border border-nodo-border rounded-2xl p-5 text-center">
              <div class="text-2xl mb-2">{p.icon}</div>
              <h3 class="text-sm font-bold mb-1">{p.title}</h3>
              <p class="text-[12px] text-nodo-muted leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* FAQ */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <h2 class="text-xl font-bold mb-5">Preguntas frecuentes</h2>
        <div class="space-y-2">
          {FAQ.map((item, i) => {
            const isOpen = openFaq.value === i
            return (
              <div key={i} class="bg-nodo-card border border-nodo-border rounded-2xl overflow-hidden">
                <button
                  class="w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors hover:bg-white/[0.04]"
                  onClick={() => { openFaq.value = isOpen ? null : i }}
                  aria-expanded={isOpen}
                >
                  <span class="text-sm font-semibold pr-4">{item.q}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class={`flex-shrink-0 text-nodo-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {isOpen && (
                  <div class="px-4 pb-4 animate-fade-in">
                    <p class="text-[13px] text-nodo-muted leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Divider />

      {/* Llamado final */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <div class="bg-gradient-to-br from-brand-navy via-nodo-card to-brand-navy border border-nodo-border rounded-2xl p-6 sm:p-8 text-center">
          <h2 class="text-xl sm:text-2xl font-extrabold leading-tight mb-4">Una comunidad organizada puede salvar vidas.</h2>
          <div class="text-sm text-nodo-muted leading-relaxed mb-6 space-y-1">
            <p>Cada reporte.</p>
            <p>Cada ayuda.</p>
            <p>Cada ubicacion compartida.</p>
            <p>Cada persona encontrada.</p>
            <p class="text-nodo-text font-medium pt-2">Es posible gracias a ciudadanos que decidieron colaborar.</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={handleShare}
              class="flex-1 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl py-3.5 px-5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all duration-200 active:scale-[0.97]"
            >
              <IconShare size={18} class="text-white" />
              {copied.value ? 'Enlace copiado!' : 'Compartir NODO'}
            </button>
            <button onClick={() => route('/mapa')} class="flex-1 bg-nodo-card border border-nodo-border rounded-xl py-3.5 px-5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-white/[0.08] transition-all duration-200 active:scale-[0.97]">
              <span>🗺️</span> Abrir el mapa
            </button>
          </div>
        </div>
      </section>

      {/* Admin access */}
      <section class="px-6 py-10 max-w-2xl mx-auto">
        <div class="border border-nodo-border rounded-2xl p-6 text-center">
          <div class="text-2xl mb-2">🔒</div>
          <h3 class="text-sm font-bold mb-1.5">Panel de administracion</h3>
          <p class="text-xs text-nodo-muted mb-5">Acceso exclusivo para administradores y moderadores autorizados.</p>
          <button
            onClick={() => route('/admin')}
            class="w-full bg-nodo-card border border-nodo-border rounded-xl py-3.5 px-5 text-sm font-semibold text-white hover:bg-white/[0.08] active:scale-[0.97] transition-all min-h-[48px]"
          >
            Ingresar como administrador
          </button>
        </div>
      </section>

      <Divider />

      {/* Footer */}
      <footer class="px-6 py-8 max-w-2xl mx-auto border-t border-nodo-border">
        <div class="text-center space-y-3">
          <div class="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="" class="w-6 h-6 rounded-md" width="24" height="24" />
            <span class="text-sm font-bold">NODO</span>
          </div>
          <p class="text-[11px] text-nodo-muted">Centro de Coordinacion Ciudadana</p>
          <p class="text-[11px] text-nodo-muted">Version 1.0</p>
          <div class="flex items-center justify-center gap-4 pt-2">
            <a href="mailto:contacto@nodoayuda.com" class="text-[11px] text-nodo-muted hover:text-nodo-text transition-colors">Contacto</a>
            <span class="text-nodo-border">·</span>
            <a href="https://instagram.com/nodoayuda" target="_blank" rel="noopener noreferrer" class="text-[11px] text-nodo-muted hover:text-nodo-text transition-colors">Instagram</a>
            <span class="text-nodo-border">·</span>
            <button onClick={() => route('/politica-privacidad')} class="text-[11px] text-nodo-muted hover:text-nodo-text transition-colors">Privacidad</button>
            <span class="text-nodo-border">·</span>
            <button onClick={() => route('/terminos')} class="text-[11px] text-nodo-muted hover:text-nodo-text transition-colors">Terminos</button>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Divider() {
  return <div class="max-w-2xl mx-auto px-6"><div class="border-t border-nodo-border" /></div>
}
