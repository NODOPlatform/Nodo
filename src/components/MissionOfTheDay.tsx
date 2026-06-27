import { useLocation } from 'preact-iso'
import { missionOfTheDay } from '../store/intelligence'

export function MissionOfTheDay() {
  const { route } = useLocation()
  const mission = missionOfTheDay.value
  if (!mission) return null

  return (
    <div class="px-4 mb-4">
      <button
        onClick={() => route(mission.actionUrl)}
        class="w-full text-left rounded-2xl p-4 border transition-all duration-200 active:scale-[0.97] hover:brightness-110"
        style={{
          background: `linear-gradient(135deg, ${mission.color}15, ${mission.color}08)`,
          borderColor: `${mission.color}30`,
        }}
      >
        <div class="flex items-center gap-1.5 mb-2">
          <span class="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${mission.color}90` }}>
            Prioridad del dia
          </span>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${mission.color}20` }}
          >
            <span class="text-2xl">{mission.icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[15px] font-bold text-white">{mission.title}</h3>
            <p class="text-[11px] text-nodo-muted mt-0.5 leading-snug">{mission.subtitle}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-2xl font-black" style={{ color: mission.color }}>{mission.metric}</div>
            <div class="text-[9px] text-nodo-muted">{mission.metricLabel}</div>
          </div>
        </div>
      </button>
    </div>
  )
}
