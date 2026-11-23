// Hoja de ruta de 12 semanas: fases, tareas, chequeo semanal y semana de descarga.
import { addDays, dateKey, parseKey } from './lib'
import { calculate } from './Calculator'
import { planOn, isRestPlan, hasSession } from './moves'

export const PHASES = [
  { id: 'prep', name: 'Preparación', weeks: 'Semana 0', blurb: 'Deja listo tu punto de partida y tu plan.' },
  { id: 'adapt', name: 'Adaptación', weeks: 'Semanas 1-4', blurb: 'Técnica limpia, constancia y registrar todo.' },
  { id: 'prog', name: 'Progresión', weeks: 'Semanas 5-8', blurb: 'Más intensidad y sobrecarga progresiva.' },
  { id: 'cons', name: 'Consolidación', weeks: 'Semanas 9-12', blurb: 'Revisa resultados y fija tus estándares.' },
]
export const phaseOf = (week) => (week <= 0 ? PHASES[0] : week <= 4 ? PHASES[1] : week <= 8 ? PHASES[2] : PHASES[3])

export const SIGNALS = ['Mi fuerza baja hace 2 o más semanas', 'Duermo mal o me despierto cansado', 'Tengo dolores articulares persistentes', 'No tengo ganas de entrenar hace varios días']

// Semana actual (0 a 12; 13 = terminada)
export function currentWeek(rm, today = new Date()) {
  if (!rm) return null
  const days = Math.floor((parseKey(dateKey(today)) - parseKey(rm.start)) / 864e5)
  return Math.max(0, Math.min(13, Math.floor(days / 7)))
}
export const weekRange = (rm, week) => { const a = addDays(parseKey(rm.start), week * 7); return [dateKey(a), dateKey(addDays(a, 6))] }
export const daysIntoWeek = (rm, today = new Date()) => Math.floor((parseKey(dateKey(today)) - parseKey(rm.start)) / 864e5) % 7

const sessionsIn = (state, a, b) => state.history.filter((h) => h.date >= a && h.date <= b)

// Tareas de la semana: auto = se marcan solas cuando se cumplen
export function tasksFor(state, week) {
  const rm = state.roadmap; const [a, b] = weekRange(rm, week); const ses = sessionsIn(state, a, b)
  const calcOk = !!calculate(state.calc || {}, state.settings.goal)
  const m = state.method
  if (week === 0) return [
    { id: 'fotos', label: 'Tomar fotos de frente, perfil y espalda', auto: (state.photos || []).some((p) => p.date >= rm.start) },
    { id: 'medidas', label: 'Medir cintura y registrar peso', auto: state.measures.some((x) => x.date >= rm.start && x.waist > 0 && x.weight > 0) },
    { id: 'macros', label: 'Calcular tus calorías y macros', auto: calcOk },
    { id: 'objetivos', label: 'Escribir tus objetivos 3-4-5', auto: !!m && m.goals.every((g) => g.trim()) && m.morning.every((g) => g.trim()) },
    { id: 'journal', label: 'Journaling en la naturaleza: tu plan a 1 y 5 años' },
    { id: 'detox', label: 'Un día de 24 h sin distracciones digitales' },
  ]
  if (week <= 4) return [
    { id: 'rutina', label: `Entrenar 3-4 días esta semana (técnica, RIR 2) · llevas ${ses.length}`, auto: ses.length >= 3 },
    { id: 'registro', label: 'Registrar cada serie con su peso', auto: ses.length > 0 && ses.every((h) => h.sets.length > 0) },
    { id: 'pasos', label: 'Cumplir tu meta de pasos la mayoría de los días' },
    { id: 'sueno', label: 'Mantener un horario de sueño fijo' },
  ]
  if (week <= 8) return [
    { id: 'rutina', label: `Entrenar 3-4 días esta semana · llevas ${ses.length}`, auto: ses.length >= 3 },
    { id: 'sobrecarga', label: 'Mejorar algo en casi cada sesión (récord o repetición extra)', auto: ses.some((h) => h.prs?.length) },
    { id: 'rir', label: 'Llevar los ejercicios de aislamiento a RIR 0-1' },
    { id: 'calorias', label: 'Ajustar calorías si bajas menos de 0,5 % por semana' },
    { id: 'descarga', label: 'Hacer descarga si hay señales de fatiga' },
  ]
  return [
    { id: 'rutina', label: `Entrenar 3-4 días esta semana · llevas ${ses.length}`, auto: ses.length >= 3 },
    { id: 'fotos', label: 'Revisar fotos y medidas contra la semana 0', auto: (state.photos || []).some((p) => p.date >= a && p.date <= b) },
    { id: 'estandares', label: 'Fijar tus estándares personales' },
    { id: 'nuevos', label: 'Escribir nuevos objetivos 3-4-5' },
    { id: 'decidir', label: 'Decidir: seguir definiendo o pasar a mantenimiento' },
  ]
}

export const taskDone = (state, week, t) => !!t.auto || !!state.roadmap.done?.[`${week}:${t.id}`]

// ¿Toca chequeo? (últimos 2 días de la semana o semana 0, y aún no hecho)
export function checkinDue(state, today = new Date()) {
  const rm = state.roadmap; if (!rm) return null
  const w = currentWeek(rm, today); if (w > 12) return null
  if (rm.checkins?.[w]) return null
  return w === 0 || daysIntoWeek(rm, today) >= 5 ? w : null
}

// Evaluación del chequeo: ritmo de peso y señales de fatiga
export function evaluate(state, week, data) {
  const rm = state.roadmap; const out = []
  const prevWeeks = Object.keys(rm.checkins || {}).map(Number).filter((w) => w < week && rm.checkins[w].weight > 0).sort((a, b) => b - a)
  const w = Number(data.weight) || 0
  const deficit = (state.calc?.pct ?? null) !== null ? state.calc.pct < 0 : true
  if (w > 0 && prevWeeks.length) {
    const pw = prevWeeks[0]; const prev = rm.checkins[pw].weight
    const rate = ((prev - w) / prev / (week - pw)) * 100
    const txt = `${rate >= 0 ? 'Bajaste' : 'Subiste'} ${Math.abs(rate).toFixed(2).replace('.', ',')} % por semana.`
    if (deficit && week >= 1) {
      if (rate < 0.5) out.push({ tone: 'warn', text: `${txt} Es menos de 0,5 %: baja unas 100 kcal al día o suma ~2.000 pasos.` })
      else if (rate > 1) out.push({ tone: 'warn', text: `${txt} Es demasiado rápido: sube unas 100-150 kcal para cuidar tu músculo y tu energía.` })
      else out.push({ tone: 'ok', text: `${txt} ¡Ritmo ideal, sigue así!` })
    } else out.push({ tone: 'ok', text: txt })
  }
  const n = (data.fatigue || []).filter(Boolean).length
  if (n >= 2) out.push({ tone: 'warn', text: `Marcaste ${n} señales de fatiga. Haz una semana de descarga: ~30 % menos de series, y revisa sueño y calorías.`, deload: true })
  else if (n === 1) out.push({ tone: 'warn', text: 'Tienes una señal de fatiga. Vigílala: si aparece otra, haz una descarga.' })
  return out
}

// Descarga: baja ~30 % las series de los días con entrenamiento que quedan de esta semana (hoy a domingo)
export function applyDeload(state, today = new Date()) {
  const ov = { ...(state.overrides || {}) }
  const dow = (today.getDay() + 6) % 7
  for (let i = 0; i <= 6 - dow; i++) {
    const k = dateKey(addDays(today, i)); const p = planOn(state, k)
    if (isRestPlan(p) || hasSession(state, k)) continue
    ov[k] = { ...p, label: /descarga/i.test(p.label) ? p.label : `${p.label} (descarga)`, items: p.items.map((it) => ({ ...it, sets: Math.max(1, Math.round(it.sets * 0.7)) })) }
  }
  return { ...state, overrides: ov }
}
