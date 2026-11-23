// Récords personales, sugerencia de progresión y detección de estancamiento a partir del historial.

export const e1rm = (w, r) => (w > 0 && r > 0 ? w * (1 + r / 30) : 0) // Epley
const rnd = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d
export const kg = (n) => String(rnd(n, 2)).replace('.', ',')

// Sesiones de un ejercicio, de la más antigua a la más reciente
export function exerciseSessions(history, exId) {
  return [...history].sort((a, b) => a.startedAt - b.startedAt).map((h) => {
    const sets = h.sets.filter((s) => s.exId === exId && s.reps > 0)
    if (!sets.length) return null
    const top = Math.max(...sets.map((s) => s.weight || 0))
    const atTop = sets.filter((s) => (s.weight || 0) === top)
    return {
      id: h.id, date: h.date, sets, top, atTop,
      repsAtTop: Math.max(...atTop.map((s) => s.reps)),
      e1: Math.max(...sets.map((s) => e1rm(s.weight, s.reps))),
      maxReps: Math.max(...sets.map((s) => s.reps)),
      volume: sets.reduce((a, s) => a + (s.weight || 0) * s.reps, 0),
      weighted: top > 0,
    }
  }).filter(Boolean)
}

// Récords logrados en una sesión nueva comparando con el historial previo (el primer registro no cuenta)
export function findPRs(history, newSets) {
  const ids = [...new Set(newSets.map((s) => s.exId))]
  const out = []
  for (const exId of ids) {
    const prev = exerciseSessions(history, exId)
    if (!prev.length) continue
    const sets = newSets.filter((s) => s.exId === exId && s.reps > 0)
    if (!sets.length) continue
    const name = sets[0].name
    const top = Math.max(...sets.map((s) => s.weight || 0))
    const e1 = Math.max(...sets.map((s) => e1rm(s.weight, s.reps)))
    const maxReps = Math.max(...sets.map((s) => s.reps))
    const pTop = Math.max(...prev.map((p) => p.top)); const pE1 = Math.max(...prev.map((p) => p.e1)); const pReps = Math.max(...prev.map((p) => p.maxReps))
    if (top > 0) {
      if (top > pTop) out.push({ exId, name, kind: 'peso', value: top, prev: pTop })
      else if (e1 > pE1 + 0.01) out.push({ exId, name, kind: '1RM', value: rnd(e1), prev: rnd(pE1) })
    } else if (maxReps > pReps) out.push({ exId, name, kind: 'reps', value: maxReps, prev: pReps })
  }
  return out
}

export const prText = (p) => (p.kind === 'peso' ? `${kg(p.value)} kg (antes ${kg(p.prev)})` : p.kind === '1RM' ? `1RM estimado ${kg(p.value)} kg (antes ${kg(p.prev)})` : `${p.value} repeticiones (antes ${p.prev})`)

// Qué intentar hoy según la última sesión de ese ejercicio
export function suggestNext(history, ex, itemReps) {
  if (!ex || /\d+\s*(s|seg|min)\b/i.test(String(itemReps))) return null
  const ses = exerciseSessions(history, ex.id); const last = ses[ses.length - 1]
  if (!last) return null
  const nums = String(itemReps).match(/\d+/g)?.map(Number) || [8]
  const lo = nums[0]; const hi = nums[1] || nums[0]
  const lastTxt = last.weighted ? `${kg(last.top)} kg × ${last.atTop.map((s) => s.reps).join(', ')}` : `${last.sets.map((s) => s.reps).join(', ')} reps`
  if (last.weighted) {
    const best = last.repsAtTop
    if (last.atTop.every((s) => s.reps >= hi)) return { weight: last.top + 2.5, reps: lo, last: lastTxt, note: `Lograste ${hi} reps con ${kg(last.top)} kg: hoy sube a ${kg(last.top + 2.5)} kg × ${lo}.` }
    if (best < lo) return { weight: last.top, reps: lo, last: lastTxt, note: `Aún no llegas a ${lo} reps con ${kg(last.top)} kg: mantén el peso y busca ${lo}.` }
    return { weight: last.top, reps: Math.min(hi, best + 1), last: lastTxt, note: `Última vez ${lastTxt}. Hoy intenta ${Math.min(hi, best + 1)} reps con ${kg(last.top)} kg.` }
  }
  if (last.maxReps >= hi) return { weight: 0, reps: lo, last: lastTxt, note: `Ya llegas a ${hi} reps (${lastTxt}): agrega peso o pasa a una variante más difícil.` }
  return { weight: 0, reps: Math.min(hi, last.maxReps + 1), last: lastTxt, note: `Última vez ${lastTxt}. Hoy intenta ${Math.min(hi, last.maxReps + 1)} reps.` }
}

// Estancado: en las últimas 3 sesiones no superaste lo anterior (necesita al menos 4 sesiones)
export function isStalled(history, exId) {
  const ses = exerciseSessions(history, exId)
  if (ses.length < 4) return false
  const m = (s) => (s.weighted ? s.e1 : s.maxReps)
  const before = Math.max(...ses.slice(0, -3).map(m)); const recent = Math.max(...ses.slice(-3).map(m))
  return recent <= before + 0.01
}
