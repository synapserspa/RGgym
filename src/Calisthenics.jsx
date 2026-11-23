import { useMemo, useState } from 'react'
import { ArrowRight, CalendarCheck, ChevronRight, Dumbbell, Home, Play, Target, Timer } from 'lucide-react'
import { CALI_PROGRESSIONS, CALI_ROUTINES, EQUIP_LABEL } from './cali'
import { DAY_NAMES, DAY_SHORT, dateKey } from './lib'
import { REST_DAY } from './moves'
import { Button, Card, Chip, ExerciseImage, Header, Sheet, ZoneDot, cx, inputCls } from './ui'
import { ExerciseDetail } from './Library'
import { adaptItems, goalOf } from './goals'
import { GoalChip, GoalSheet } from './GoalPanel'
import TimersPanel from './Timers'
import { coach, coachAlert } from './coach'

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // lunes ... domingo

// Convierte un día de una rutina en un plan del calendario
const planFromDay = (routine, day, exMap, goal = null) => {
  const zones = [...new Set(day.items.map((i) => exMap[i.exId]?.zone).filter((z) => z && z !== 'Cardio'))]
  const items = goal ? adaptItems(day.items, goal, exMap) : day.items.map((i) => ({ ...i }))
  return { label: routine.days.length > 1 ? `${day.label}` : routine.name, zones, items, rest: false, ...(day.circuit ? { circuit: true } : {}) }
}

// Nivel y punto de partida según el test
function evaluate(t) {
  const push = Number(t.push) || 0; const pull = Number(t.pull) || 0; const squat = Number(t.squat) || 0; const plank = Number(t.plank) || 0
  const level = pull >= 10 || push >= 35 ? 'Avanzado' : pull >= 5 || push >= 15 ? 'Intermedio' : 'Principiante'
  const start = {
    Empuje: push < 5 ? 'cal-flexion-inclinada' : push < 15 ? 'cal-flexion' : push < 25 ? 'cal-flexion-pies-elevados' : push < 35 ? 'cal-flexion-diamante' : 'cal-flexion-arquera',
    Tirón: pull < 5 ? 'cal-dominada-negativa' : pull < 10 ? 'cal-dominada' : pull < 15 ? 'cal-dominada-lastre' : 'cal-dominada-explosiva',
    Piernas: squat < 15 ? 'cal-sentadilla' : squat < 30 ? 'cal-zancada' : squat < 50 ? 'cal-bulgara' : 'cal-pistol-asistida',
    Core: plank < 30 ? 'cal-plancha' : plank < 60 ? 'cal-hollow' : 'cal-lsit',
  }
  const routines = level === 'Avanzado' ? ['r-fuerza-ppl', 'r-dominadas'] : level === 'Intermedio' ? ['r-hibrido', 'r-upperlower-casa'] : ['r-cuerpo-3', 'r-express']
  return { level, start, routines }
}

function AssignSheet({ routine, state, update, onClose, onDone, goal }) {
  const n = routine.days.length
  const [sel, setSel] = useState(() => (n === 4 ? [1, 2, 4, 5] : n === 3 ? [1, 3, 5] : n === 1 ? [1, 3, 5] : [1, 3, 5].slice(0, n)))
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const toggle = (d) => setSel((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]))
  const ok = n === 1 ? sel.length >= 1 : sel.length === n
  const apply = async () => {
    if (!(await coach('Esto reemplaza tu plan semanal actual (los demás días quedan como descanso) y quita los cambios por fecha de hoy en adelante. ¿Seguimos?', { yes: 'Sí, usar esta rutina' }))) return
    const ordered = WEEK_ORDER.filter((d) => sel.includes(d))
    update((s) => {
      const plan = {}
      for (let d = 0; d < 7; d++) plan[d] = { ...REST_DAY }
      ordered.forEach((d, i) => { plan[d] = planFromDay(routine, routine.days[n === 1 ? 0 : i], exMap, goal) })
      const today = dateKey(); const ov = Object.fromEntries(Object.entries(s.overrides || {}).filter(([k]) => k < today))
      return { ...s, plan, overrides: ov }
    })
    onDone()
  }
  return (
    <Sheet open onClose={onClose} title="Asignar a mi semana" footer={<Button className="w-full" disabled={!ok} onClick={apply}><CalendarCheck size={22} /> Usar esta rutina</Button>}>
      <p className="text-muted mb-4">{n === 1 ? 'Elige los días en que quieres hacer este circuito.' : `Elige exactamente ${n} días. Se asignan en orden: ${routine.days.map((d) => d.label).join(' → ')}.`}</p>
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {WEEK_ORDER.map((d, i) => <button key={d} onClick={() => toggle(d)} aria-label={DAY_NAMES[d]} className={cx('h-14 rounded-xl border font-black', sel.includes(d) ? 'bg-neon text-black border-neon' : 'bg-surface border-line text-muted')}>{DAY_SHORT[i]}</button>)}
      </div>
      <p className="text-sm text-muted">{ok ? `${sel.length} día${sel.length === 1 ? '' : 's'} elegido${sel.length === 1 ? '' : 's'}. El resto de la semana queda como descanso.` : `Te faltan o sobran días: elegiste ${sel.length}.`}</p>
    </Sheet>
  )
}

function RoutineSheet({ routine, state, update, onClose, onToday, setDetail }) {
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const [assign, setAssign] = useState(false)
  const [openDay, setOpenDay] = useState(0)
  const [adapt, setAdapt] = useState(true)
  const goal = adapt ? state.settings.goal : null
  const doToday = (day) => {
    update((s) => ({ ...s, overrides: { ...(s.overrides || {}), [dateKey()]: planFromDay(routine, day, exMap, goal) } }))
    onToday()
  }
  const equipAll = [...new Set(routine.days.flatMap((d) => d.items.flatMap((i) => exMap[i.exId]?.equip || [])))]
  return (
    <Sheet open onClose={onClose} title={routine.name} footer={<Button className="w-full" onClick={() => setAssign(true)}><CalendarCheck size={22} /> Asignar a mi semana</Button>}>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-neon text-black">{routine.level}</span>
        <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-surface2 flex items-center gap-1"><Timer size={14} />~{routine.minutes} min</span>
        <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-surface2">{routine.days.length === 1 ? '1 sesión' : `${routine.days.length} días/semana`}</span>
      </div>
      <p className="mb-3 leading-snug">{routine.desc}</p>
      <button onClick={() => setAdapt((a) => !a)} className={cx('w-full min-h-14 rounded-2xl border px-4 mb-4 flex items-center justify-between font-bold text-left', adapt ? 'border-neon bg-neon/10' : 'border-line bg-surface')}>
        <span>Ajustar a mi meta<span className="block text-xs font-medium text-muted">{goalOf(state.settings.goal).emoji} {goalOf(state.settings.goal).name}: series, repeticiones y descansos</span></span>
        <span className={adapt ? 'text-neon' : 'text-muted'}>{adapt ? 'SÍ' : 'NO'}</span>
      </button>
      <div className="text-xs font-bold text-muted mb-1">IMPLEMENTOS</div>
      <p className="text-sm mb-4">{equipAll.length ? equipAll.map((e) => EQUIP_LABEL[e] || e).join(' · ') : 'Ninguno: solo tu cuerpo 💪'}</p>
      <div className="space-y-3">
        {routine.days.map((day, di) => (
          <Card key={di} className="!p-0 overflow-hidden">
            <button className="w-full text-left p-4 flex items-center justify-between" onClick={() => setOpenDay(openDay === di ? -1 : di)}>
              <div><div className="text-xs font-bold text-neon">{routine.days.length > 1 ? `DÍA ${di + 1}` : 'SESIÓN'}</div><div className="text-lg font-black">{day.label}</div><div className="text-sm text-muted">{day.items.length} ejercicios{day.circuit ? ' · circuito' : ''}</div></div>
              <ChevronRight className={cx('text-muted transition-transform', openDay === di && 'rotate-90')} />
            </button>
            {openDay === di && (
              <div className="border-t border-line p-3 space-y-2 bg-black/20">
                {(adapt ? adaptItems(day.items, state.settings.goal, exMap) : day.items).map((it, i) => { const e = exMap[it.exId]; if (!e) return null
                  return <button key={i} onClick={() => setDetail(e)} className="w-full flex items-center gap-3 text-left bg-surface rounded-2xl p-2">
                    <ExerciseImage ex={e} compact className="size-14 shrink-0" />
                    <div className="min-w-0 flex-1"><div className="font-bold leading-tight">{e.name}</div><div className="text-sm text-muted">{it.sets} × {it.reps}{it.rest ? ` · descanso ${it.rest}s` : ''}</div></div>
                  </button> })}
                <Button className="w-full !text-base mt-1" onClick={() => doToday(day)}><Play size={20} fill="black" /> Hacer hoy</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
      {assign && <AssignSheet goal={goal} routine={routine} state={state} update={update} onClose={() => setAssign(false)} onDone={() => { setAssign(false); onClose(); onToday() }} />}
    </Sheet>
  )
}

function Routines({ state, update, onToday, setDetail }) {
  const [filter, setFilter] = useState('todas'); const [open, setOpen] = useState(null)
  const goal = state.settings.goal
  const list = CALI_ROUTINES.filter((r) => filter === 'todas' || r.mode === filter).sort((a, b) => (b.goals?.includes(goal) ? 1 : 0) - (a.goals?.includes(goal) ? 1 : 0))
  const r = open && CALI_ROUTINES.find((x) => x.id === open)
  return (
    <>
      <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        <Chip active={filter === 'todas'} onClick={() => setFilter('todas')}>Todas</Chip>
        <Chip active={filter === 'casa'} onClick={() => setFilter('casa')}><Home size={16} className="inline mr-1.5 -mt-0.5" />Sin implementos</Chip>
        <Chip active={filter === 'equipo'} onClick={() => setFilter('equipo')}><Dumbbell size={16} className="inline mr-1.5 -mt-0.5" />Con mis implementos</Chip>
      </div>
      <div className="space-y-3">
        {list.map((x) => (
          <button key={x.id} onClick={() => setOpen(x.id)} className="w-full text-left bg-surface border border-line rounded-3xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-neon mb-1">{x.mode === 'casa' ? <><Home size={14} />SIN IMPLEMENTOS</> : <><Dumbbell size={14} />CON IMPLEMENTOS</>}<span className="text-muted">· {x.level}</span>{x.goals?.includes(goal) && <span className="ml-auto px-2 py-0.5 rounded-full bg-neon text-black">IDEAL PARA TU META</span>}</div>
            <div className="text-xl font-black leading-tight">{x.name}</div>
            <p className="text-sm text-muted mt-1 leading-snug">{x.desc}</p>
            <div className="flex gap-3 mt-3 text-sm font-semibold"><span>⏱ ~{x.minutes} min</span><span>📅 {x.days.length === 1 ? '1 sesión' : `${x.days.length} días`}</span></div>
          </button>))}
      </div>
      {r && <RoutineSheet routine={r} state={state} update={update} onClose={() => setOpen(null)} onToday={onToday} setDetail={setDetail} />}
    </>
  )
}

function Progressions({ state, setDetail }) {
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  return (
    <div className="space-y-4">
      <p className="text-muted leading-snug">En calistenia no subes de peso: <b className="text-white">subes de variante</b>. Cuando logres la meta de un paso con técnica limpia, pasa al siguiente.</p>
      {CALI_PROGRESSIONS.map((p) => (
        <Card key={p.id}>
          <h3 className="text-lg font-black mb-3">{p.name}</h3>
          <ol className="space-y-2">
            {p.steps.map(([id, goal], i) => { const e = exMap[id]; if (!e) return null
              return <li key={id}><button onClick={() => setDetail(e)} className="w-full flex items-center gap-3 text-left bg-surface2 rounded-2xl p-2">
                <span className="size-8 rounded-full bg-neon text-black font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <ExerciseImage ex={e} compact className="size-12 shrink-0" />
                <span className="min-w-0 flex-1"><span className="block font-bold leading-tight">{e.name}</span><span className="block text-xs text-muted">{goal}</span></span>
              </button></li> })}
          </ol>
        </Card>))}
    </div>
  )
}

function LevelTest({ state, update, setDetail, openRoutine }) {
  const saved = state.settings.caliTest || {}
  const [t, setT] = useState({ push: saved.push ?? '', pull: saved.pull ?? '', squat: saved.squat ?? '', plank: saved.plank ?? '' })
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const filled = t.push !== '' && t.pull !== '' && t.squat !== '' && t.plank !== ''
  const res = filled ? evaluate(t) : null
  const save = () => update((s) => ({ ...s, settings: { ...s.settings, caliTest: { ...t, at: dateKey() } } }))
  const F = ({ k, label, hint }) => <label className="block"><span className="text-sm font-bold text-white">{label}</span><span className="block text-xs text-muted mb-1">{hint}</span><input inputMode="numeric" className={inputCls} value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value.replace(/\D/g, '') })} placeholder="0" /></label>
  return (
    <div className="space-y-4">
      <p className="text-muted leading-snug">Hazlo descansado y con buena técnica (sin balanceo ni medias repeticiones). Te digo en qué nivel estás y por dónde empezar.</p>
      <Card className="space-y-4">
        {F({ k: 'push', label: 'Flexiones seguidas', hint: 'Pecho casi al piso, cuerpo recto' })}
        {F({ k: 'pull', label: 'Dominadas máximas', hint: 'Barbilla sobre la barra, brazos estirados abajo' })}
        {F({ k: 'squat', label: 'Sentadillas seguidas', hint: 'Con peso corporal, bajando bien' })}
        {F({ k: 'plank', label: 'Plancha (segundos)', hint: 'Cuerpo recto, sin hundir la cadera' })}
        <Button className="w-full" disabled={!filled} onClick={save}><Target size={20} /> Guardar mi test</Button>
      </Card>
      {res && (
        <Card className="border-neon/40">
          <div className="text-xs font-bold text-neon">TU NIVEL</div>
          <div className="text-3xl font-black mb-3">{res.level}</div>
          <div className="text-xs font-bold text-muted mb-2">POR DÓNDE EMPEZAR EN CADA PATRÓN</div>
          <div className="space-y-2 mb-4">{Object.entries(res.start).map(([pat, id]) => { const e = exMap[id]; if (!e) return null
            return <button key={pat} onClick={() => setDetail(e)} className="w-full flex items-center gap-3 text-left bg-surface2 rounded-2xl p-2">
              <ExerciseImage ex={e} compact className="size-12 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-xs text-muted">{pat}</span><span className="block font-bold leading-tight">{e.name}</span></span><ArrowRight size={18} className="text-muted" /></button> })}</div>
          <div className="text-xs font-bold text-muted mb-2">RUTINAS RECOMENDADAS</div>
          <div className="space-y-2">{res.routines.map((id) => { const r = CALI_ROUTINES.find((x) => x.id === id)
            return <button key={id} onClick={() => openRoutine(id)} className="w-full text-left rounded-2xl bg-surface2 p-3 flex items-center gap-3"><span className="min-w-0 flex-1"><span className="block font-bold leading-tight">{r.name}</span><span className="block text-xs text-muted">{r.level} · ~{r.minutes} min</span></span><ChevronRight className="text-muted" /></button> })}</div>
        </Card>)}
    </div>
  )
}

export default function Calisthenics({ state, update, onToday }) {
  const [view, setView] = useState('rutinas'); const [detail, setDetail] = useState(null); const [openId, setOpenId] = useState(null); const [goalOpen, setGoalOpen] = useState(false)
  const r = openId && CALI_ROUTINES.find((x) => x.id === openId)
  return (
    <div>
      <Header title="Calistenia" subtitle="Fuerza con tu propio cuerpo" />
      <div className="px-4 pb-4">
        <GoalChip goal={state.settings.goal} onClick={() => setGoalOpen(true)} className="mb-3" />
        <div className="flex bg-surface rounded-2xl p-1 border border-line mb-4">
          {[['rutinas', 'Rutinas'], ['progresiones', 'Progresión'], ['test', 'Mi nivel'], ['tiempos', 'Intervalos']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)} className={cx('flex-1 min-h-12 rounded-xl font-bold text-sm', view === v ? 'bg-neon text-black' : 'text-muted')}>{l}</button>))}
        </div>
        {view === 'rutinas' && <Routines state={state} update={update} onToday={onToday} setDetail={setDetail} />}
        {view === 'progresiones' && <Progressions state={state} setDetail={setDetail} />}
        {view === 'tiempos' && <TimersPanel state={state} update={update} />}
        {view === 'test' && <LevelTest state={state} update={update} setDetail={setDetail} openRoutine={setOpenId} />}
      </div>
      {r && <RoutineSheet routine={r} state={state} update={update} onClose={() => setOpenId(null)} onToday={() => { setOpenId(null); onToday() }} setDetail={setDetail} />}
      <ExerciseDetail ex={detail} state={state} update={update} onClose={() => setDetail(null)} />
      {goalOpen && <GoalSheet state={state} update={update} onClose={() => setGoalOpen(false)} />}
    </div>
  )
}
