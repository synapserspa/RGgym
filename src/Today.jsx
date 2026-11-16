import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp, Flag, Minus, Moon, Pencil, Play, Plus, Repeat, SkipForward, Timer, Undo2, X, Dumbbell, Volume2, VolumeX, Vibrate } from 'lucide-react'
import { DAY_NAMES, MONTHS, beep, dateKey, fmtDur, fmtNum, fmtTime, mondayOf, repsStart, sessionVolume, uid, unlockAudio, useNow, useWakeLock, vibrate } from './lib'
import { Button, Card, Chip, Empty, ExerciseImage, Header, Sheet, ZoneDot, cx, inputCls } from './ui'
import { ExerciseDetail } from './Library'
import { PlanEditor, isRest } from './Calendar'

const saludo = (d) => (d.getHours() < 12 ? 'Buenos días' : d.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches')
const FRASES = ['Primero el trabajo, después el resultado.', 'No necesitas motivación: necesitas un sistema.', 'Los días sin ganas son los que más importan.', 'Cada hábito es un voto a favor de tu nueva identidad.', 'Sobrecarga progresiva: mejora algo en cada sesión.', 'Consistencia, no perfección.', 'Recuperas = progresas.']

// ---------- Secuencia de pasos ----------
function buildSteps(items, mode) {
  const steps = []
  if (mode === 'circuit') {
    const rounds = Math.max(0, ...items.map((i) => i.sets))
    for (let r = 0; r < rounds; r++) items.forEach((it, i) => { if (it.sets > r) steps.push({ item: i, set: r, round: r }) })
  } else {
    items.forEach((it, i) => { for (let s = 0; s < it.sets; s++) steps.push({ item: i, set: s, round: s }) })
  }
  return steps
}

// ---------- Pantalla "Entrenar hoy" ----------
export default function Today({ state, update, onStartTraining }) {
  const now = new Date(); const dow = now.getDay(); const k = dateKey(now)
  const plan = state.plan[dow]; const rest = isRest(plan)
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const doneToday = state.history.filter((h) => h.date === k)
  const [detail, setDetail] = useState(null); const [edit, setEdit] = useState(false)
  const [mode, setMode] = useState(state.settings.circuit ? 'circuit' : 'serial')
  const weekStart = mondayOf(now); const weekCount = new Set(state.history.filter((h) => h.date >= dateKey(weekStart)).map((h) => h.date)).size

  const start = () => {
    unlockAudio()
    const items = plan.items.filter((i) => exMap[i.exId] && i.sets > 0).map((i) => ({ ...i }))
    update((s) => ({ ...s, settings: { ...s.settings, circuit: mode === 'circuit' }, active: { dow, label: plan.label || 'Entrenamiento', zones: plan.zones, mode, items, startedAt: Date.now(), logs: [], pos: 0, restEnd: null, restTotal: 0 } }))
    onStartTraining()
  }

  return (
    <div>
      <Header title={`${saludo(now)}${state.settings.name ? ', ' + state.settings.name : ''} 👋`} subtitle={`${DAY_NAMES[dow]}, ${now.getDate()} de ${MONTHS[now.getMonth()].toLowerCase()}`}
        right={<div className="text-right"><div className="text-3xl font-black text-neon leading-none">{weekCount}<span className="text-muted text-lg">/4</span></div><div className="text-xs text-muted">esta semana</div></div>} />
      <div className="px-4 pb-4">
        <div className="mb-4">
          <div className="text-2xl font-black">¿Qué haremos hoy?</div>
          <div className="text-muted mt-1">
            {!plan || (!plan.items.length && !plan.zones.length) ? 'Aún no hay plan para hoy: crea uno.'
              : rest ? 'Hoy toca recuperar: pasos, buen sueño y buena comida.'
              : `${plan.items.length} ejercicios · ${plan.items.reduce((a, i) => a + i.sets, 0)} series · ~60 min`}
            {doneToday.length > 0 && ' · ¡Ya entrenaste hoy!'}
          </div>
          <div className="text-sm text-neon/80 italic mt-2">“{FRASES[Math.floor(now / 864e5) % FRASES.length]}”</div>
        </div>
        {!plan || (!plan.items.length && !plan.zones.length) ? (
          <Card><Empty icon={Dumbbell} text="No tienes plan para hoy." /><Button className="w-full" onClick={() => setEdit(true)}><Pencil size={20} /> Crear plan de hoy</Button></Card>
        ) : (
          <>
            <Card className={cx('mb-4', rest && 'opacity-90')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted font-semibold">{rest ? <><Moon size={16} /> DÍA DE DESCANSO</> : 'HOY TOCA'}</div>
                  <div className="text-3xl font-black leading-tight mt-1">{plan.label || 'Entrenamiento'}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-muted">{plan.zones.map((z) => <span key={z} className="flex items-center gap-1.5"><ZoneDot zone={z} />{z}</span>)}</div>
                </div>
                <button aria-label="Editar plan de hoy" onClick={() => setEdit(true)} className="size-12 rounded-2xl bg-surface2 flex items-center justify-center shrink-0"><Pencil size={20} /></button>
              </div>
              {doneToday.length > 0 && <div className="mt-3 flex items-center gap-2 text-neon font-bold"><Check size={20} strokeWidth={4} /> ¡Completado hoy! ({fmtDur(doneToday[0].durationSec)})</div>}
              {rest && <p className="mt-3 text-muted leading-snug">Recuperas = progresas. Cumple los 10.000+ pasos, duerme 8 h y mantén tu nutrición.</p>}
            </Card>

            {plan.items.length > 0 && (
              <>
                <div className="flex gap-2 mb-4">
                  <Chip active={mode === 'serial'} onClick={() => setMode('serial')}>Series seguidas</Chip>
                  <Chip active={mode === 'circuit'} onClick={() => setMode('circuit')}><Repeat size={16} className="inline mr-1.5 -mt-0.5" />Circuito / rondas</Chip>
                </div>
                <Button className={cx('w-full min-h-20 text-2xl rounded-3xl mb-5', !rest && 'pulse')} variant={rest ? 'secondary' : 'primary'} onClick={start}>
                  <Play size={28} fill={rest ? 'white' : 'black'} /> {doneToday.length ? 'Entrenar otra vez' : rest ? 'Entrenar de todas formas' : 'Empezar entrenamiento'}
                </Button>
                <h3 className="text-sm font-bold text-muted mb-2">RUTINA · {plan.items.length} EJERCICIOS</h3>
                <div className="space-y-2.5">
                  {plan.items.map((it, i) => { const e = exMap[it.exId]; if (!e) return null
                    return (
                      <button key={i} onClick={() => setDetail(e)} className="w-full text-left flex items-center gap-3 bg-surface border border-line rounded-3xl p-2.5">
                        <ExerciseImage ex={e} className="size-16 shrink-0" />
                        <div className="flex-1 min-w-0"><div className="font-bold text-lg leading-tight">{e.name}</div><div className="text-muted text-sm">{it.sets} × {it.reps}{it.weight ? ` · ${it.weight} kg` : ''}</div></div>
                        <ZoneDot zone={e.zone} size={12} />
                      </button>) })}
                </div>
              </>
            )}
          </>
        )}
      </div>
      <ExerciseDetail ex={detail} onClose={() => setDetail(null)} />
      {edit && <PlanEditor dow={dow} state={state} update={update} onClose={() => setEdit(false)} />}
    </div>
  )
}

// ---------- Contador +/- grande ----------
function Stepper({ label, value, step, onChange, unit, decimals = false }) {
  const [txt, setTxt] = useState(null)
  const show = txt ?? String(value)
  const bump = (d) => onChange(Math.max(0, Math.round((Number(value) + d) * 100) / 100))
  return (
    <div className="bg-surface border border-line rounded-3xl p-3 flex-1 min-w-0">
      <div className="text-center text-xs font-bold text-muted">{label}</div>
      <input value={show} inputMode={decimals ? 'decimal' : 'numeric'} aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => { setTxt(e.target.value); const n = Number(e.target.value.replace(',', '.')); if (!Number.isNaN(n)) onChange(n) }}
        onBlur={() => setTxt(null)}
        className="w-full bg-transparent text-center text-5xl font-black focus:outline-none" />
      <div className="text-center text-xs text-muted -mt-1 mb-2">{unit}</div>
      <div className="grid grid-cols-2 gap-2">
        <button aria-label={`Menos ${label}`} onClick={() => bump(-step)} className="h-16 rounded-2xl bg-surface2 flex items-center justify-center"><Minus size={30} strokeWidth={3} /></button>
        <button aria-label={`Más ${label}`} onClick={() => bump(step)} className="h-16 rounded-2xl bg-surface2 flex items-center justify-center"><Plus size={30} strokeWidth={3} /></button>
      </div>
    </div>
  )
}

// ---------- Entrenamiento activo ----------
export function ActiveWorkout({ state, update, onExit }) {
  const a = state.active
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const steps = useMemo(() => buildSteps(a.items, a.mode), [a.items, a.mode])
  const total = steps.length
  const finished = a.pos >= total
  const step = steps[a.pos]
  const item = step ? a.items[step.item] : null
  const ex = item ? exMap[item.exId] : null
  const cardio = ex?.zone === 'Cardio'
  const now = useNow(true, 250)
  useWakeLock(true)

  const [inp, setInp] = useState({ reps: 0, weight: 0 })
  const [guide, setGuide] = useState(true)
  const [summary, setSummary] = useState(false)
  const [notes, setNotes] = useState('')
  const [menu, setMenu] = useState(false)

  // Valores iniciales de cada serie: la última serie del mismo ejercicio o los objetivos del plan
  useEffect(() => {
    if (!item) return
    const last = [...a.logs].reverse().find((l) => l.item === step.item)
    setInp({ reps: last ? last.reps : repsStart(item.reps) || 10, weight: last ? last.weight : item.weight || 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.pos])

  const setActive = (p) => update((s) => ({ ...s, active: { ...s.active, ...(typeof p === 'function' ? p(s.active) : p) } }))
  const restSetting = state.settings.rest

  const complete = () => {
    unlockAudio()
    const log = { item: step.item, exId: item.exId, name: ex.name, setIdx: step.set, round: step.round, reps: cardio ? 0 : Number(inp.reps) || 0, weight: cardio ? 0 : Number(inp.weight) || 0, at: Date.now() }
    const next = steps[a.pos + 1]
    // En circuito el descanso va al terminar cada ronda; en series seguidas, tras cada serie
    const endOfRound = !next || next.round !== step.round
    const needsRest = next && (a.mode === 'circuit' ? endOfRound : true)
    const restSec = needsRest ? (restSetting || ex.rest || 0) : 0
    vibrate(40)
    setActive((cur) => ({ logs: [...cur.logs, log], pos: cur.pos + 1, restEnd: restSec ? Date.now() + restSec * 1000 : null, restTotal: restSec }))
  }
  const undo = () => setActive((cur) => ({ logs: cur.logs.slice(0, -1), pos: Math.max(0, cur.pos - 1), restEnd: null }))
  const skip = () => setActive((cur) => ({ pos: cur.pos + 1, restEnd: null }))

  // Temporizador de descanso
  const restLeft = a.restEnd ? Math.ceil((a.restEnd - now) / 1000) : 0
  const resting = a.restEnd && now < a.restEnd + 4000
  const alerted = useRef(null)
  useEffect(() => {
    if (a.restEnd && now >= a.restEnd && alerted.current !== a.restEnd) {
      alerted.current = a.restEnd
      if (state.settings.sound) beep(3)
      if (state.settings.vibrate) vibrate([300, 120, 300, 120, 500])
    }
  }, [now, a.restEnd, state.settings.sound, state.settings.vibrate])
  useEffect(() => { if (a.restEnd && now >= a.restEnd + 4000) setActive({ restEnd: null }) }, [now, a.restEnd]) // eslint-disable-line

  const elapsed = (now - a.startedAt) / 1000
  const volume = sessionVolume(a.logs)
  const nextStep = steps[a.pos + 1]; const nextEx = nextStep && exMap[a.items[nextStep.item].exId]

  const discard = () => { if (confirm('¿Descartar este entrenamiento sin guardar?')) { update((s) => ({ ...s, active: null })); onExit() } }
  const save = () => {
    const sets = a.logs.map(({ exId, name, setIdx, reps, weight }) => ({ exId, name, setIdx, reps, weight }))
    const rec = { id: uid(), date: dateKey(new Date(a.startedAt)), startedAt: a.startedAt, durationSec: Math.round((Date.now() - a.startedAt) / 1000), label: a.label, zones: a.zones, volume: sessionVolume(sets), notes: notes.trim(), sets }
    // Recordar el último peso usado de cada ejercicio en el plan (sobrecarga progresiva)
    const lastW = {}; a.logs.forEach((l) => { if (l.weight) lastW[l.exId] = l.weight })
    update((s) => {
      const plan = { ...s.plan }
      if (plan[a.dow]) plan[a.dow] = { ...plan[a.dow], items: plan[a.dow].items.map((it) => (lastW[it.exId] ? { ...it, weight: lastW[it.exId] } : it)) }
      const day = rec.date
      const habits = { ...s.habits, [day]: [...new Set([...(s.habits[day] || []), 'entreno'])] }
      return { ...s, plan, habits, history: [rec, ...s.history], active: null }
    })
    onExit()
  }

  // Series completadas del ejercicio actual (puntos de progreso)
  const doneInEx = item ? a.logs.filter((l) => l.item === step.item).length : 0

  return (
    <div className="fixed inset-0 z-30 bg-bg flex flex-col">
      {/* Cabecera */}
      <div className="safe-top px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button aria-label="Menú" onClick={() => setMenu(true)} className="size-12 rounded-2xl bg-surface2 flex items-center justify-center"><X size={24} /></button>
          <div className="text-center"><div className="text-sm text-muted font-semibold">{a.label}</div><div className="text-2xl font-black tabular-nums">{fmtTime(elapsed)}</div></div>
          <button onClick={() => setSummary(true)} disabled={!a.logs.length} className="min-h-12 px-4 rounded-2xl bg-surface2 font-bold flex items-center gap-1.5 disabled:opacity-30"><Flag size={18} />Fin</button>
        </div>
        <div className="h-2 rounded-full bg-surface2 mt-3 overflow-hidden"><div className="h-full bg-neon transition-all" style={{ width: `${(a.pos / Math.max(1, total)) * 100}%` }} /></div>
        <div className="text-xs text-muted mt-1 text-center">{Math.min(a.pos, total)} de {total} series · {fmtNum(volume)} kg de volumen</div>
      </div>

      {finished ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="size-28 rounded-full bg-neon flex items-center justify-center mb-5"><Check size={64} className="text-black" strokeWidth={4} /></div>
          <h2 className="text-4xl font-black mb-2">¡Rutina completa!</h2>
          <p className="text-muted text-lg mb-8">{a.logs.length} series · {fmtDur(elapsed)} · {fmtNum(volume)} kg</p>
          <Button className="w-full min-h-20 text-2xl rounded-3xl" onClick={() => setSummary(true)}>Terminar y guardar</Button>
          <button onClick={undo} className="mt-4 min-h-12 text-muted font-semibold flex items-center gap-2"><Undo2 size={18} /> Deshacer última serie</button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex items-center justify-between my-2">
              <div className="flex items-center gap-2 font-bold" style={{ color: undefined }}><ZoneDot zone={ex.zone} size={12} /><span className="text-muted">{ex.zone}</span></div>
              {a.mode === 'circuit' && <div className="text-sm font-bold bg-surface2 rounded-full px-3 py-1">Ronda {step.round + 1} de {Math.max(...a.items.map((i) => i.sets))}</div>}
            </div>
            <h2 className="text-2xl font-black leading-tight mb-2">{ex.name}</h2>

            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-4xl font-black">Serie {step.set + 1}<span className="text-muted"> de {item.sets}</span></div>
                <div className="text-muted font-semibold">Objetivo {item.reps}{item.rir && item.rir !== '-' ? ` · RIR ${item.rir}` : ''}</div>
              </div>
              <div className="flex gap-1.5">{Array.from({ length: item.sets }, (_, i) => <span key={i} className={cx('size-4 rounded-full', i < doneInEx ? 'bg-neon' : i === step.set ? 'bg-white' : 'bg-surface2')} />)}</div>
            </div>

            {!cardio && (
              <div className="flex gap-3 mb-3">
                <Stepper label="REPETICIONES" value={inp.reps} step={1} unit="reps" onChange={(v) => setInp((x) => ({ ...x, reps: v }))} />
                <Stepper label="PESO" value={inp.weight} step={2.5} unit="kg" decimals onChange={(v) => setInp((x) => ({ ...x, weight: v }))} />
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              <Timer size={18} className="text-muted shrink-0" /><span className="text-sm text-muted shrink-0">Descanso:</span>
              {[[0, `Auto (${ex.rest}s)`], [60, '60s'], [90, '90s'], [120, '120s'], [180, '180s']].map(([v, l]) => (
                <Chip key={v} active={restSetting === v} onClick={() => update((s) => ({ ...s, settings: { ...s.settings, rest: v } }))}>{l}</Chip>))}
            </div>
            <div className="mt-4">
            <ExerciseImage ex={ex} className="w-full h-36 mb-3" />
            <button onClick={() => setGuide((g) => !g)} className="w-full flex items-center justify-between min-h-12 px-4 rounded-2xl bg-surface border border-line font-bold mb-2">
              <span>Guía rápida</span>{guide ? <ChevronUp /> : <ChevronDown />}
            </button>
            {guide && <ol className="bg-surface border border-line rounded-2xl p-4 mb-3 space-y-2">{ex.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="text-neon font-black">{i + 1}.</span><span className="leading-snug">{s}</span></li>)}</ol>}

            </div>
            {nextEx && <div className="text-sm text-muted mt-3">Siguiente: <span className="text-white font-semibold">{nextEx.name}</span></div>}
          </div>

          <div className="px-4 pt-2 pb-4 safe-bottom border-t border-line bg-bg">
            <div className="flex gap-3">
              <button aria-label="Deshacer" disabled={!a.logs.length} onClick={undo} className="size-16 shrink-0 self-center rounded-3xl bg-surface2 flex items-center justify-center disabled:opacity-30"><Undo2 size={28} /></button>
              <button onClick={complete} className="flex-1 min-h-20 rounded-3xl bg-neon text-black text-2xl font-black whitespace-nowrap flex items-center justify-center gap-3 active:scale-[.98]"><Check size={34} strokeWidth={4} />{cardio ? 'COMPLETAR' : 'SERIE LISTA'}</button>
              <button aria-label="Saltar" onClick={skip} className="size-16 shrink-0 self-center rounded-3xl bg-surface2 flex items-center justify-center"><SkipForward size={28} /></button>
            </div>
          </div>
        </>
      )}

      {/* Temporizador de descanso */}
      {resting && !finished && (
        <div className={cx('absolute inset-0 z-40 flex flex-col items-center justify-center px-6 text-center transition-colors', restLeft > 0 ? 'bg-black/95' : 'bg-neon')}>
          <div className={cx('text-lg font-bold mb-2', restLeft > 0 ? 'text-muted' : 'text-black')}>{restLeft > 0 ? 'DESCANSO' : '¡A POR LA SIGUIENTE!'}</div>
          <div className="relative size-72 mb-6">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke={restLeft > 0 ? '#2c2c2c' : '#00000033'} strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={restLeft > 0 ? '#39ff14' : '#000'} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - Math.max(0, restLeft) / Math.max(1, a.restTotal))} />
            </svg>
            <div className={cx('absolute inset-0 flex items-center justify-center text-7xl font-black tabular-nums', restLeft <= 0 && 'text-black')}>{restLeft > 0 ? fmtTime(restLeft) : '00:00'}</div>
          </div>
          {restLeft > 0 && nextEx && <div className="text-muted mb-6">Siguiente: <span className="text-white font-bold">{nextEx.name}</span> · serie {steps[a.pos].set + 1}</div>}
          <div className="flex gap-3 w-full max-w-sm">
            {restLeft > 0 && <>
              <Button variant="secondary" className="flex-1" onClick={() => setActive((c) => ({ restEnd: c.restEnd - 15000, restTotal: c.restTotal }))}>−15s</Button>
              <Button variant="secondary" className="flex-1" onClick={() => setActive((c) => ({ restEnd: c.restEnd + 15000, restTotal: c.restTotal + 15 }))}>+15s</Button>
            </>}
            <Button className={cx('flex-[1.4]', restLeft <= 0 && '!bg-black !text-neon')} onClick={() => setActive({ restEnd: null })}>{restLeft > 0 ? 'Saltar' : 'Continuar'}</Button>
          </div>
        </div>
      )}

      {/* Menú */}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Entrenamiento">
        <div className="space-y-3 pb-2">
          <button onClick={() => update((s) => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }))} className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between font-bold">
            <span className="flex items-center gap-3">{state.settings.sound ? <Volume2 /> : <VolumeX />} Sonido al terminar descanso</span><span className={state.settings.sound ? 'text-neon' : 'text-muted'}>{state.settings.sound ? 'ON' : 'OFF'}</span></button>
          <button onClick={() => update((s) => ({ ...s, settings: { ...s.settings, vibrate: !s.settings.vibrate } }))} className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between font-bold">
            <span className="flex items-center gap-3"><Vibrate /> Vibración</span><span className={state.settings.vibrate ? 'text-neon' : 'text-muted'}>{state.settings.vibrate ? 'ON' : 'OFF'}</span></button>
          <Button variant="secondary" className="w-full" onClick={() => setMenu(false)}>Seguir entrenando</Button>
          <Button variant="danger" className="w-full" onClick={discard}>Descartar entrenamiento</Button>
        </div>
      </Sheet>

      {/* Resumen final */}
      <Sheet open={summary} onClose={() => setSummary(false)} title="Resumen de sesión"
        footer={<Button className="w-full min-h-16" onClick={save}><Check size={24} strokeWidth={4} /> Guardar entrenamiento</Button>}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[[fmtDur(elapsed), 'Duración'], [a.logs.length, 'Series'], [fmtNum(volume), 'Volumen kg']].map(([v, l]) => (
            <Card key={l} className="text-center !p-3"><div className="text-2xl font-black text-neon">{v}</div><div className="text-xs text-muted">{l}</div></Card>))}
        </div>
        <label className="block text-sm font-bold text-muted mb-2">NOTAS RÁPIDAS</label>
        <textarea className={inputCls + ' py-3 min-h-28'} placeholder='Ej. "Subir peso la próxima semana"' value={notes} onChange={(e) => setNotes(e.target.value)} />
        {a.pos < total && <p className="text-sm text-muted mt-3">Quedan {total - a.pos} series sin hacer; se guardarán solo las completadas.</p>}
      </Sheet>
    </div>
  )
}
