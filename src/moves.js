// Mover / intercambiar / copiar el entrenamiento de un día a otro (usa los planes por fecha "overrides").
import { addDays, dateKey, parseKey } from './lib'

export const REST_DAY = { label: 'Descanso', zones: [], items: [], rest: true }
export const planOn = (state, key) => state.overrides?.[key] || state.plan[parseKey(key).getDay()]
export const isRestPlan = (p) => !p || p.rest || !p.items?.length
export const hasSession = (state, key) => state.history.some((h) => h.date === key)

// mode: 'mover' (origen queda en descanso) | 'intercambiar' | 'copiar'
export function applyMove(state, from, to, mode) {
  const pf = planOn(state, from); const pt = planOn(state, to)
  const ov = { ...(state.overrides || {}) }
  ov[to] = { ...pf }
  if (mode === 'mover') ov[from] = { ...REST_DAY }
  if (mode === 'intercambiar') ov[from] = { ...pt }
  return { ...state, overrides: ov }
}

// Primer día de descanso libre después de `fromKey` (máx. `max` días)
export function nextRestKey(state, fromKey, max = 4) {
  for (let i = 1; i <= max; i++) {
    const k = dateKey(addDays(parseKey(fromKey), i))
    if (isRestPlan(planOn(state, k)) && !hasSession(state, k)) return k
  }
  return null
}

// Último día perdido (hasta 3 días atrás): tenía entrenamiento, no se hizo y no se descartó
export function missedDay(state, today = new Date()) {
  for (let i = 1; i <= 3; i++) {
    const k = dateKey(addDays(today, -i)); const p = planOn(state, k)
    if (!isRestPlan(p) && !hasSession(state, k)) return { key: k, plan: p }
  }
  return null
}

// Pasa el entrenamiento perdido a hoy. Si hoy ya había rutina, esa se corre al siguiente día de descanso.
// Devuelve { state, pushedTo } o { needsConfirm: true } si no hay dónde correr la de hoy.
export function moveMissedToToday(state, missedKey, todayKey, force = false) {
  const pm = planOn(state, missedKey); const pt = planOn(state, todayKey)
  const ov = { ...(state.overrides || {}) }
  let pushedTo = null
  if (!isRestPlan(pt) && !hasSession(state, todayKey)) {
    pushedTo = nextRestKey(state, todayKey)
    if (!pushedTo && !force) return { needsConfirm: true }
    if (pushedTo) ov[pushedTo] = { ...pt }
  }
  ov[todayKey] = { ...pm }; ov[missedKey] = { ...REST_DAY }
  return { state: { ...state, overrides: ov }, pushedTo }
}

// Copia la rutina de otro día dentro de este día (solo para esa fecha)
export function copyInto(state, srcKey, destKey) {
  const p = planOn(state, srcKey)
  return { ...state, overrides: { ...(state.overrides || {}), [destKey]: { ...p, rest: false, items: p.items.map((i) => ({ ...i })) } } }
}
