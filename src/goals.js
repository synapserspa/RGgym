// Metas de entrenamiento y cómo ajustan series, repeticiones y descansos de cualquier rutina.

export const GOALS = [
  {
    id: 'fuerza-definicion', name: 'Fuerza y definición', emoji: '🔥',
    short: 'Ser más fuerte mientras bajas grasa y te marcas.',
    train: ['Básicos pesados: 4-5 series de 4-6 repeticiones (RIR 1-2).', 'Accesorios: 8-12 repeticiones, cerca del fallo.', 'Descansos: 2-3 min en básicos, 60-75 s en accesorios.', 'Cierra con un finisher metabólico de 8-10 min (escaladores, burpees, plancha).'],
    nutrition: ['Déficit leve: mantenimiento menos ~300 kcal.', 'Proteína alta: 1,8-2,2 g/kg.', 'Grasas ~0,8 g/kg y el resto carbohidratos, más alrededor del entreno.'],
    activity: ['10.000-12.000 pasos al día.', 'Si la fuerza baja 2 semanas seguidas, sube calorías o haz una semana de descarga.'],
    macros: { deficit: 300, prot: 2.0, fat: 0.8 },
  },
  {
    id: 'fuerza', name: 'Fuerza', emoji: '🏋️',
    short: 'Levantar más peso y dominar movimientos difíciles.',
    train: ['Básicos: 4-5 series de 3-5 repeticiones (RIR 1-2).', 'Accesorios: 6-10 repeticiones.', 'Descansos largos: 3 min en básicos, 90 s en accesorios.', 'Progresa subiendo peso o la dificultad de la variante cada semana.'],
    nutrition: ['Calorías de mantenimiento o un leve superávit.', 'Proteína 1,6-2,0 g/kg.', 'No recortes carbohidratos: son el combustible de las series pesadas.'],
    activity: ['8.000-10.000 pasos al día.', 'Prioriza el sueño: la fuerza se gana descansando.'],
    macros: { deficit: 0, prot: 1.8, fat: 1.0 },
  },
  {
    id: 'bajar-peso', name: 'Bajar de peso', emoji: '⚖️',
    short: 'Perder grasa conservando el músculo.',
    train: ['Más repeticiones: 8-12 en básicos y 12-15 en accesorios.', 'Descansos cortos: 45-60 s para mantener el pulso alto.', 'Circuitos y finishers de 15-25 min.', 'Suma cardio suave 2-3 veces por semana (20-30 min).'],
    nutrition: ['Déficit moderado: mantenimiento menos 400-500 kcal.', 'Proteína alta: 1,8-2,0 g/kg para no perder músculo.', 'Ritmo sano: 0,5-1 % del peso por semana.'],
    activity: ['10.000-12.000 pasos al día (es lo que más suma).', 'Duerme 8 h: dormir poco aumenta el hambre.'],
    macros: { deficit: 500, prot: 2.0, fat: 0.8 },
  },
  {
    id: 'masa', name: 'Ganar músculo', emoji: '💪',
    short: 'Aumentar el tamaño muscular.',
    train: ['6-10 repeticiones en básicos y 8-12 en accesorios.', '12-20 series por músculo a la semana, cerca del fallo.', 'Descansos de 75-120 s.', 'Sobrecarga progresiva: más peso o más repeticiones cada semana.'],
    nutrition: ['Leve superávit: mantenimiento más ~250 kcal.', 'Proteína 1,6-2,2 g/kg.', 'Grasas ~1 g/kg y muchos carbohidratos.'],
    activity: ['8.000 pasos al día.', 'Sueño de 8 h y semanas de descarga cada 6-8 semanas.'],
    macros: { deficit: -250, prot: 1.8, fat: 1.0 },
  },
]
export const goalOf = (id) => GOALS.find((g) => g.id === id) || GOALS[0]

// Básicos compuestos (se cargan pesados)
const MAIN = new Set(['press-banca', 'press-inclinado', 'press-militar', 'sentadilla', 'sentadilla-hack', 'peso-muerto-rumano', 'hip-thrust', 'prensa', 'jalon-pecho', 'remo-apoyado',
  'cal-dominada', 'cal-dominada-supina', 'cal-dominada-lastre', 'cal-dominada-explosiva', 'cal-dominada-arquera', 'cal-bulgara', 'cal-pistol-asistida'])

// main | bodyweight | accessory | hold | skip
export function roleOf(ex, item) {
  if (!ex || ex.id.startsWith('cal-mov') || ex.zone === 'Cardio') return 'skip'
  if (/\d+\s*(s|seg|min)\b/i.test(String(item.reps))) return 'hold'
  if (MAIN.has(ex.id)) return 'main'
  if (ex.cali && !(ex.equip || []).some((e) => e === 'mancuernas' || e === 'discos')) return 'bodyweight'
  return 'accessory'
}

const P = {
  fuerza: { main: { reps: '3-5', rir: '1-2', rest: 180, add: 1, min: 4, cap: 5 }, bodyweight: { reps: '5-8', rir: '1-2', rest: 120 }, accessory: { reps: '6-10', rir: '1-2', rest: 90 }, hold: { rest: 60 } },
  'fuerza-definicion': { main: { reps: '4-6', rir: '1-2', rest: 150, min: 4, cap: 5 }, bodyweight: { reps: '6-10', rir: '1-2', rest: 90 }, accessory: { reps: '8-12', rir: '1', rest: 75 }, hold: { rest: 45 } },
  'bajar-peso': { main: { reps: '8-12', rir: '1-2', rest: 90 }, bodyweight: { reps: '12-20', rir: '1', rest: 45 }, accessory: { reps: '12-15', rir: '1', rest: 45 }, hold: { rest: 30 } },
  masa: { main: { reps: '6-10', rir: '1-2', rest: 120, min: 3 }, bodyweight: { reps: '8-12', rir: '0-1', rest: 75 }, accessory: { reps: '8-12', rir: '0-1', rest: 75, min: 3 }, hold: { rest: 45 } },
}

// Ajusta series/repeticiones/RIR/descanso de una lista de ejercicios a la meta. Guarda el original en `base`.
export function adaptItems(items, goal, exMap) {
  return items.map((item) => {
    const ex = exMap[item.exId]; const role = roleOf(ex, item)
    const base = item.base || { sets: item.sets, reps: item.reps, rir: item.rir, rest: item.rest }
    if (role === 'skip') return { ...item, base }
    const p = (P[goal] || P['fuerza-definicion'])[role]
    const suffix = /por lado/i.test(base.reps) ? ' por lado' : ''
    let sets = base.sets
    if (role !== 'hold') sets = Math.min(p.cap ?? Math.max(sets, 5), Math.max(sets + (p.add || 0), p.min ?? sets))
    return { ...item, sets, reps: role === 'hold' ? base.reps : p.reps + suffix, rir: role === 'hold' ? base.rir : p.rir, rest: base.rest != null && (role === 'hold' || base.rest < p.rest) ? base.rest : p.rest, base }
  })
}

// Vuelve a los valores originales de la rutina
export const restoreItems = (items) => items.map((item) => {
  if (!item.base) return item
  const { base, rest, ...rest2 } = item // eslint-disable-line no-unused-vars
  return { ...rest2, sets: base.sets, reps: base.reps, rir: base.rir, ...(base.rest != null ? { rest: base.rest } : {}) }
})

// Aplica la meta a todo el plan semanal y a los cambios por fecha de hoy en adelante
export function applyGoalToState(state, goal, exMap, restore = false) {
  const fn = (p) => ({ ...p, items: restore ? restoreItems(p.items) : adaptItems(p.items, goal, exMap) })
  const plan = Object.fromEntries(Object.entries(state.plan).map(([d, p]) => [d, p.items?.length ? fn(p) : p]))
  const today = new Date(); const tk = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const overrides = Object.fromEntries(Object.entries(state.overrides || {}).map(([k, p]) => [k, k >= tk && p.items?.length ? fn(p) : p]))
  return { ...state, plan, overrides }
}
