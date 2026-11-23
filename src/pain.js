// Molestias: alternativas parecidas a un ejercicio que duele y cambio en el plan.
const GROUPS = [
  ['press-banca', 'press-inclinado', 'cal-flexion', 'cal-flexion-inclinada', 'cal-flexion-pies-elevados', 'aperturas-mancuernas', 'aperturas-polea'],
  ['press-militar', 'cal-pike', 'elevaciones-laterales', 'press-inclinado'],
  ['triceps-polea', 'press-frances', 'cal-fondos-banca', 'cal-flexion-diamante', 'fondos'],
  ['cal-dominada', 'cal-dominada-supina', 'cal-dominada-lastre', 'jalon-pecho', 'cal-dominada-negativa', 'pullover-polea'],
  ['remo-apoyado', 'cal-remo-mancuerna', 'cal-remo-invertido', 'cal-remo-banda'],
  ['curl-biceps', 'curl-martillo', 'cal-dominada-supina'],
  ['sentadilla', 'sentadilla-hack', 'prensa', 'cal-bulgara', 'cal-zancada', 'cal-sentadilla', 'extension-cuadriceps'],
  ['peso-muerto-rumano', 'hip-thrust', 'cal-puente-gluteo', 'curl-femoral', 'curl-femoral-sentado'],
  ['gemelos-pie', 'gemelos-sentado', 'cal-gemelo-unipodal'],
  ['crunch', 'cal-plancha', 'cal-hollow', 'elevacion-piernas', 'cal-escaladores', 'cal-lsit'],
  ['caminata', 'cinta-bici', 'comba', 'cal-burpee'],
]
const LEVEL = { Principiante: 0, Intermedio: 1, Avanzado: 2 }

// Hasta 6 alternativas: primero las de movimiento parecido, luego las de la misma zona y nivel cercano
export function alternativesFor(ex, exercises, pain = {}) {
  const map = Object.fromEntries(exercises.map((e) => [e.id, e])); const out = []
  const add = (e) => { if (e && e.id !== ex.id && !pain[e.id] && !out.some((o) => o.id === e.id)) out.push(e) }
  GROUPS.filter((g) => g.includes(ex.id)).forEach((g) => g.forEach((id) => add(map[id])))
  exercises.filter((e) => e.zone === ex.zone).sort((a, b) => Math.abs(LEVEL[a.level] - LEVEL[ex.level]) - Math.abs(LEVEL[b.level] - LEVEL[ex.level])).forEach(add)
  return out.slice(0, 6)
}

// Cambia un ejercicio por otro en el plan semanal y en los cambios por fecha de hoy en adelante
export function replaceInPlan(state, oldId, newId) {
  const fix = (p) => (p?.items ? { ...p, items: p.items.map((i) => (i.exId === oldId ? { ...i, exId: newId, weight: 0, base: undefined } : i)) } : p)
  const d = new Date(); const tk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    ...state,
    plan: Object.fromEntries(Object.entries(state.plan).map(([k, p]) => [k, fix(p)])),
    overrides: Object.fromEntries(Object.entries(state.overrides || {}).map(([k, p]) => [k, k >= tk ? fix(p) : p])),
  }
}
