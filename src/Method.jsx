import { useEffect, useState } from 'react'
import { BookOpen, Check, Info, Target } from 'lucide-react'
import { dateKey } from './lib'
import { Button, Card, Chip, Sheet, inputCls } from './ui'

// Explicación de cada estándar diario (basado en la guía Método H)
export const HABIT_INFO = {
  rutina: {
    title: 'Rutina de mañana (4 pasos)',
    body: 'Son 4 acciones simples que haces cada mañana, siempre en el mismo orden, antes de empezar el día. Ejemplo: lavarte los dientes → ducha fría → meditación → 3 agradecimientos. Otra opción: caminar 20 minutos o sacar al perro.',
    tip: 'Elige 4 pasos que sí puedas cumplir TODOS los días. Al terminarla, haces tu Método 3-4-5. Se llena en “Mi Método 3-4-5”.',
  },
  345: {
    title: 'Método 3-4-5 escrito',
    body: '5 minutos cada mañana, como último paso de tu rutina. 3 objetivos del año (claros, medibles y los repites cada día), 4 pasos de tu rutina de mañana y 5 tareas para hoy (simples y cumplibles, que te acerquen a tus objetivos).',
    tip: 'Ejemplo de objetivo: llegar a 76 kg limpios, 100 kg en press banca. Ejemplo de tareas: grabar un video, estudiar 1 h, comprar champú.',
  },
  entreno: {
    title: 'Entrenamiento completado y registrado',
    body: 'Se marca solo cuando guardas un entrenamiento en la app. Registrar peso y repeticiones de cada serie es lo que te permite aplicar la sobrecarga progresiva: mejorar algo casi en cada sesión.',
    tip: 'Si lo guardas “en la cabeza”, lo olvidarás y no podrás progresar.',
  },
  proteina: {
    title: 'Proteína objetivo alcanzada',
    body: 'La guía propone 0,8-1,2 g por kg de peso. Muchas guías científicas recomiendan más cuando estás en déficit: 1,6-2,2 g/kg, para conservar músculo. Si te cuesta mantener la fuerza o pasas hambre, súbela.',
    tip: 'Calcula tus gramos en la Calculadora de déficit calórico de esta pantalla.',
  },
  calorias: {
    title: 'Calorías dentro del objetivo',
    body: 'Para definir necesitas un déficit moderado: tus calorías de mantenimiento menos 300-500 kcal. El ritmo sano de pérdida es ~0,5-1 % del peso por semana. Nunca hagas dietas sin grasa.',
    tip: 'Usa la Calculadora de déficit calórico para obtener tus números.',
  },
  pasos: {
    title: 'Pasos diarios',
    body: 'Caminar suma actividad diaria (NEAT), cuida tu salud y te permite comer un poco más estando en déficit. Elige una cantidad que SÍ puedas cumplir todos los días, desde 5.000 pasos, y súbela poco a poco.',
    tip: 'Camina en bloques de 20-30 minutos repartidos en el día.',
  },
  pantallas: {
    title: 'Sin pantallas 1 h antes de dormir',
    body: 'La hora antes de dormir sin celular ni TV mejora el sueño profundo. Tampoco uses pantallas la primera hora después de despertar: empieza tu día con tu rutina, no con las redes.',
    tip: 'Deja el cargador del celular lejos de la cama.',
  },
  sueno: {
    title: '8 h de sueño',
    body: 'Mínimo 8 horas de sueño real: 8 h en la cama no es 8 h dormido, así que acuéstate un poco antes. Mismo horario todos los días, incluso fines de semana. Ejemplo: dormir 22:00 y despertar 07:00.',
    tip: 'Si tu fuerza baja 2 semanas seguidas o duermes mal, es señal de que necesitas más recuperación.',
  },
}

export const STEP_OPTIONS = [5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000]
export const fmtSteps = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Cambia la meta de pasos y actualiza las rutinas de caminata del plan
export function setStepsGoal(update, n) {
  const fix = (p) => (p?.items ? { ...p, items: p.items.map((i) => (i.exId === 'caminata' && /pasos/.test(String(i.reps)) ? { ...i, reps: `${fmtSteps(n)} pasos` } : i)) } : p)
  update((s) => ({
    ...s, settings: { ...s.settings, steps: n },
    plan: Object.fromEntries(Object.entries(s.plan).map(([d, p]) => [d, fix(p)])),
    overrides: Object.fromEntries(Object.entries(s.overrides || {}).map(([k, p]) => [k, fix(p)])),
  }))
}

export function HabitInfoSheet({ id, onClose, state, update }) {
  const h = HABIT_INFO[id]
  if (!h) return null
  const steps = state?.settings?.steps || 10000
  return (
    <Sheet open onClose={onClose} title={id === 'pasos' ? `Pasos diarios: ${fmtSteps(steps)}` : h.title}>
      <p className="text-lg leading-relaxed mb-4">{h.body}</p>
      {id === 'pasos' && (
        <div className="mb-4">
          <div className="text-xs font-bold text-muted mb-2">MI META DIARIA</div>
          <div className="flex flex-wrap gap-2">{STEP_OPTIONS.map((n) => <Chip key={n} active={steps === n} onClick={() => setStepsGoal(update, n)}>{fmtSteps(n)}</Chip>)}</div>
          <p className="text-xs text-muted mt-2">Empieza por la que puedas cumplir sin esfuerzo y sube cuando se te haga fácil.</p>
        </div>
      )}
      <div className="rounded-2xl border border-neon/40 bg-neon/10 p-4"><div className="text-xs font-bold text-neon mb-1">CONSEJO</div><p className="leading-snug">{h.tip}</p></div>
    </Sheet>
  )
}

const Block = ({ n, title, children }) => (
  <Card className="mb-3">
    <div className="flex items-center gap-3 mb-2"><span className="size-9 rounded-full bg-neon text-black font-black flex items-center justify-center shrink-0">{n}</span><h3 className="text-xl font-black leading-tight">{title}</h3></div>
    <div className="text-base leading-relaxed text-white/90 space-y-2">{children}</div>
  </Card>
)

// Guía rápida: qué son los estándares y cómo usarlos
export function StandardsGuide({ onClose, onOpen345 }) {
  return (
    <Sheet open onClose={onClose} title="Cómo usar los estándares">
      <p className="text-muted mb-4">Son 8 hábitos diarios. No negocies con ellos: busca <b className="text-white">consistencia, no perfección</b>. Con 80 % de casillas marcadas ya tuviste una gran semana.</p>
      <Block n="1" title="Rutina de mañana">
        <p>4 pasos simples, siempre en el mismo orden. Ejemplo: lavarte los dientes → ducha fría → meditación → 3 agradecimientos. O: paseo de 20 min, sacar al perro.</p>
        <p className="text-muted text-sm">Es tu ancla: lo primero que haces y lo que arma el resto del día.</p>
      </Block>
      <Block n="2" title="Método 3-4-5 (5 minutos)">
        <p><b>3</b> objetivos del año: claros, medibles, y los repites cada día.</p>
        <p><b>4</b> pasos de tu rutina de mañana.</p>
        <p><b>5</b> tareas para hoy: simples y cumplibles, que te acerquen a tus objetivos.</p>
        <Button className="w-full mt-2 !text-base" onClick={onOpen345}><Target size={20} /> Armar mi Método 3-4-5</Button>
      </Block>
      <Block n="3" title="Detox mental (3 pasos)">
        <p><b>Journaling:</b> escribe en una libreta preguntas sobre ti y contéstalas con honestidad.</p>
        <p><b>En la naturaleza, solo:</b> un parque, aunque sea un árbol. Sin pantallas, a solas con tus pensamientos.</p>
        <p><b>24 horas sin distracciones digitales.</b> Costará, pero es una experiencia muy enriquecedora.</p>
        <div className="mt-2 text-sm text-muted space-y-1"><div className="font-bold text-white">Preguntas para tu journaling</div>
          <p>• ¿Cómo quiero verme y sentirme en 1 año? ¿Y en 5?</p>
          <p>• ¿Qué hábitos me han llevado a mi físico actual?</p>
          <p>• ¿Qué tendría que dejar de hacer desde hoy?</p>
          <p>• ¿Qué excusas me repito más a menudo?</p>
          <p>• ¿Qué creencias sobre mí nunca he cuestionado?</p>
          <p>• ¿Qué haría hoy la persona que quiero ser?</p></div>
      </Block>
      <Block n="4" title="Los otros 5 estándares">
        <p>Entrenamiento registrado, proteína, calorías, tus pasos diarios, sin pantallas 1 h antes de dormir y 8 h de sueño. Toca el <b>ⓘ</b> de cada uno para ver el detalle.</p>
      </Block>
    </Sheet>
  )
}

// Mi Método 3-4-5: objetivos del año, 4 pasos de la mañana y 5 tareas de hoy
export function Method345({ state, update, onClose }) {
  const k = dateKey()
  const m = state.method || { goals: ['', '', ''], morning: ['', '', '', ''], morningDone: {}, tasks: {} }
  const goals = m.goals; const morning = m.morning
  const done = m.morningDone?.[k] || [false, false, false, false]
  const tasks = m.tasks?.[k] || Array.from({ length: 5 }, () => ({ t: '', done: false }))
  const set = (p) => update((s) => ({ ...s, method: { ...(s.method || m), ...p } }))
  const goalsFull = goals.every((g) => g.trim()) && morning.every((g) => g.trim()) && tasks.every((t) => t.t.trim())
  const morningFull = morning.every((x) => x.trim()) && done.every(Boolean)

  // Marca automáticamente los estándares cuando se completan
  useEffect(() => {
    update((s) => {
      const cur = s.habits[k] || []; let next = cur
      if (morningFull && !next.includes('rutina')) next = [...next, 'rutina']
      if (goalsFull && !next.includes('345')) next = [...next, '345']
      return next === cur ? s : { ...s, habits: { ...s.habits, [k]: next } }
    })
  }, [morningFull, goalsFull]) // eslint-disable-line

  const setGoal = (i, v) => set({ goals: goals.map((g, j) => (j === i ? v : g)) })
  const setMorning = (i, v) => set({ morning: morning.map((g, j) => (j === i ? v : g)) })
  const toggleMorning = (i) => set({ morningDone: { ...(m.morningDone || {}), [k]: done.map((d, j) => (j === i ? !d : d)) } })
  const setTask = (i, p) => set({ tasks: { ...(m.tasks || {}), [k]: tasks.map((t, j) => (j === i ? { ...t, ...p } : t)) } })
  const Row = ({ children }) => <div className="flex items-center gap-2 mb-2">{children}</div>
  const Box = ({ on, onClick }) => <button aria-label="Marcar" onClick={onClick} className={`size-12 shrink-0 rounded-xl border-2 flex items-center justify-center ${on ? 'bg-neon border-neon text-black' : 'border-muted'}`}>{on && <Check size={22} strokeWidth={4} />}</button>

  return (
    <Sheet open onClose={onClose} title="Mi Método 3-4-5">
      <h3 className="text-sm font-bold text-muted mb-2">3 · OBJETIVOS DEL AÑO</h3>
      <p className="text-xs text-muted mb-2">Claros y medibles. Léelos cada mañana.</p>
      {goals.map((g, i) => <input key={i} className={inputCls + ' mb-2'} placeholder={['Ej. Llegar a 76 kg limpios', 'Ej. 12 dominadas', 'Ej. Dormir 8 h siempre'][i]} value={g} onChange={(e) => setGoal(i, e.target.value)} />)}
      <h3 className="text-sm font-bold text-muted mt-5 mb-2">4 · PASOS DE MI RUTINA DE MAÑANA</h3>
      <p className="text-xs text-muted mb-2">Escríbelos una vez; cada día marca los que hiciste.</p>
      {morning.map((g, i) => <Row key={i}><Box on={done[i]} onClick={() => toggleMorning(i)} /><input className={inputCls} placeholder={['Ej. Lavarme los dientes', 'Ej. Ducha fría', 'Ej. Meditar 5 min', 'Ej. 3 agradecimientos'][i]} value={g} onChange={(e) => setMorning(i, e.target.value)} /></Row>)}
      <h3 className="text-sm font-bold text-muted mt-5 mb-2">5 · TAREAS DE HOY</h3>
      <p className="text-xs text-muted mb-2">Simples y cumplibles. Se reinician cada día.</p>
      {tasks.map((t, i) => <Row key={i}><Box on={t.done} onClick={() => setTask(i, { done: !t.done })} /><input className={inputCls} placeholder={`Tarea ${i + 1}`} value={t.t} onChange={(e) => setTask(i, { t: e.target.value })} /></Row>)}
      <p className="text-sm text-muted mt-4">Al completar los 4 pasos se marca “Rutina de mañana”; al llenar los 3 + 4 + 5 se marca “Método 3-4-5 escrito”.</p>
    </Sheet>
  )
}

export const InfoButton = ({ onClick }) => <button aria-label="Más información" onClick={onClick} className="size-14 shrink-0 rounded-2xl border border-line bg-surface flex items-center justify-center text-neon"><Info size={22} /></button>
export const GuideButton = ({ onClick }) => <button onClick={onClick} className="w-full min-h-14 rounded-2xl border border-neon/50 bg-neon/10 px-4 flex items-center gap-3 font-bold text-left"><BookOpen size={22} className="text-neon shrink-0" /><span>Guía rápida: ¿qué son estos estándares?</span></button>
