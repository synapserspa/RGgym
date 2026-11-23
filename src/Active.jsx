import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, ChevronDown, ChevronUp, Flag, Minus, Pause, Play, Plus, SkipForward, Timer, Undo2, Vibrate, Volume2, VolumeX, X } from 'lucide-react'
import { dateKey, fmtDur, fmtNum, fmtTime, repsStart, sessionVolume, uid, useBackLayer, useNow, useWakeLock, vibrate } from './lib'
import { playDone, playEnd, playGo, playTick, speak, unlockAudio } from './audio'
import { Button, Card, Chip, ExerciseImage, Sheet, ZoneDot, cx, inputCls } from './ui'
import { findPRs, suggestNext } from './records'
import { ToolsSheet } from './Tools'
import { coach, coachAlert } from './coach'

// ---------- Secuencia de pasos ----------
export function buildSteps(items, mode) {
  const steps = []
  if (mode === 'circuit') {
    const rounds = Math.max(0, ...items.map((i) => i.sets))
    for (let r = 0; r < rounds; r++) items.forEach((it, i) => { if (it.sets > r) steps.push({ item: i, set: r, round: r }) })
  } else {
    items.forEach((it, i) => { for (let s = 0; s < it.sets; s++) steps.push({ item: i, set: s, round: s }) })
  }
  return steps
}

// Segundos que dura una serie en modo automático (null = no se puede medir, ej. "10.000 pasos")
export function workSeconds(it, ex, s) {
  const r = String(it.reps)
  let m = r.match(/(\d+)\s*min/i); if (m) return Number(m[1]) * 60
  m = r.match(/(\d+)\s*s(eg)?\b/i); if (m) return Number(m[1])
  if (ex.zone === 'Cardio') return null
  return Math.max(10, repsStart(r) * s.secPerRep + 4)
}

// Descanso tras una serie. Manual: como siempre. Automático: suma tiempo para cambiar de máquina/ejercicio
export function restFor(cur, next, items, exMap, mode, s, auto) {
  if (!next) return 0
  const base = s.rest || items[cur.item].rest || exMap[items[cur.item].exId]?.rest || 0
  const endOfRound = next.round !== cur.round
  if (mode === 'circuit') return endOfRound ? base : (auto ? s.extraChange : 0)
  return base + (auto && next.item !== cur.item ? s.extraChange : 0)
}

// Duración estimada de la rutina (segundos). Solo cuenta los ejercicios que se pueden medir.
export function estimateSec(items, mode, exMap, s, auto = true) {
  const timed = items.filter((it) => exMap[it.exId] && it.sets > 0 && workSeconds(it, exMap[it.exId], s) != null)
  const steps = buildSteps(timed, mode)
  let t = auto ? s.prepSec : 0
  steps.forEach((st, i) => { t += workSeconds(timed[st.item], exMap[timed[st.item].exId], s) + restFor(st, steps[i + 1], timed, exMap, mode, s, auto) })
  return t
}

// ---------- Contador +/- grande ----------
function Stepper({ label, value, step, onChange, unit, decimals = false, small = false }) {
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
        className={cx('w-full bg-transparent text-center font-black focus:outline-none', small ? 'text-4xl' : 'text-5xl')} />
      <div className="text-center text-xs text-muted -mt-1 mb-2">{unit}</div>
      <div className="grid grid-cols-2 gap-2">
        <button aria-label={`Menos ${label}`} onClick={() => bump(-step)} className={cx('rounded-2xl bg-surface2 flex items-center justify-center', small ? 'h-14' : 'h-16')}><Minus size={30} strokeWidth={3} /></button>
        <button aria-label={`Más ${label}`} onClick={() => bump(step)} className={cx('rounded-2xl bg-surface2 flex items-center justify-center', small ? 'h-14' : 'h-16')}><Plus size={30} strokeWidth={3} /></button>
      </div>
    </div>
  )
}

// ---------- Entrenamiento activo ----------
export function ActiveWorkout({ state, update, onExit }) {
  const a = state.active; const S = state.settings
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const steps = useMemo(() => buildSteps(a.items, a.mode), [a.items, a.mode])
  const total = steps.length
  const finished = a.pos >= total
  const step = steps[a.pos]
  const item = step ? a.items[step.item] : null
  const ex = item ? exMap[item.exId] : null
  const cardio = ex?.zone === 'Cardio'
  const now = useNow(true, 250)
  const paused = a.pausedAt != null
  const tnow = paused ? a.pausedAt : now          // el reloj se congela durante la pausa
  const clock = () => (a.pausedAt != null ? a.pausedAt : Date.now())
  useWakeLock(true)

  const [inp, setInp] = useState({ reps: 0, weight: 0 })
  const [guide, setGuide] = useState(false)
  const [summary, setSummary] = useState(false)
  const [notes, setNotes] = useState('')
  const [menu, setMenu] = useState(false)
  const [tools, setTools] = useState(false)
  useBackLayer(true, () => setMenu(true)) // "atrás" en pleno entrenamiento abre el menú en vez de salir

  // Sugerencia de progresión según tu última sesión de este ejercicio
  const sug = useMemo(() => (item && ex ? suggestNext(state.history, ex, item.reps) : null), [a.pos, state.history]) // eslint-disable-line

  // Valores iniciales de cada serie: la última serie del mismo ejercicio o los objetivos del plan
  useEffect(() => {
    if (!item) return
    const last = [...a.logs].reverse().find((l) => l.item === step.item)
    setInp({ reps: last ? last.reps : sug?.reps || repsStart(item.reps) || 10, weight: last ? last.weight : sug ? sug.weight : item.weight || 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.pos])

  const setActive = (p) => update((s) => (s.active ? { ...s, active: { ...s.active, ...(typeof p === 'function' ? p(s.active) : p) } } : s))

  // ----- Registrar una serie -----
  const doComplete = (isAuto) => {
    const log = { item: step.item, exId: item.exId, name: ex.name, setIdx: step.set, round: step.round, reps: cardio ? 0 : Number(inp.reps) || 0, weight: cardio ? 0 : Number(inp.weight) || 0, at: Date.now() }
    const next = steps[a.pos + 1]
    const restSec = restFor(step, next, a.items, exMap, a.mode, S, isAuto)
    const t0 = clock()
    setActive((cur) => ({ logs: [...cur.logs, log], pos: cur.pos + 1, restEnd: restSec ? t0 + restSec * 1000 : null, restTotal: restSec, ph: null }))
    return next
  }
  const complete = () => { unlockAudio(); vibrate(40); doComplete(false) }
  const undo = () => setActive((cur) => ({ logs: cur.logs.slice(0, -1), pos: Math.max(0, cur.pos - 1), restEnd: null, ph: null }))
  const skip = () => setActive((cur) => ({ pos: cur.pos + 1, restEnd: null, ph: null }))

  // ----- Pausa -----
  const pause = () => { unlockAudio(); setActive({ pausedAt: Date.now() }) }
  const resume = () => {
    unlockAudio()
    const d = Date.now() - a.pausedAt
    setActive((cur) => ({ pausedAt: null, pausedMs: (cur.pausedMs || 0) + d, restEnd: cur.restEnd ? cur.restEnd + d : null, ph: cur.ph ? { ...cur.ph, end: cur.ph.end + d } : null }))
  }

  // ----- Modo automático -----
  const announce = (nextStep) => {
    if (!nextStep) return speak('Rutina completa. Excelente trabajo.', S)
    const nit = a.items[nextStep.item]; const nex = exMap[nit.exId]
    speak(nit !== item ? `Descansa. Sigue ${nex.name}, serie ${nextStep.set + 1} de ${nit.sets}.` : `Descansa. Serie ${nextStep.set + 1} de ${nit.sets}.`, S)
  }
  const startWork = () => {
    const sec = cardio ? (workSeconds(item, ex, S) || 60) : Math.max(8, (Number(inp.reps) || 1) * S.secPerRep + 4)
    const t0 = clock()
    setActive({ ph: { kind: 'work', end: t0 + sec * 1000, total: sec }, restEnd: null })
    playGo(S); vibrate([200, 80, 200])
  }
  const finishWork = () => {
    playDone(S); vibrate(300)
    announce(doComplete(true))
  }
  const toggleAuto = () => {
    unlockAudio()
    if (a.auto) { setActive({ auto: false, ph: null, restEnd: null }); return }
    const t0 = clock()
    setActive({ auto: true, ph: { kind: 'prep', end: t0 + 5000, total: 5 }, restEnd: null })
    speak(`Modo automático. ${ex?.name || ''}. Serie ${(step?.set || 0) + 1}.`, S)
  }
  const skipPhase = () => {
    if (paused) return
    if (a.ph) setActive({ ph: { ...a.ph, end: Date.now() - 1 } })
    else if (a.restEnd) setActive({ restEnd: Date.now() - 1 })
  }

  const fired = useRef('')
  useEffect(() => {
    if (!a.auto || paused || finished) return
    if (a.ph && tnow >= a.ph.end) {
      const key = `${a.ph.kind}${a.ph.end}:${a.pos}`; if (fired.current === key) return; fired.current = key
      a.ph.kind === 'prep' ? startWork() : finishWork()
    } else if (!a.ph && a.restEnd && tnow >= a.restEnd) {
      const key = `r${a.restEnd}:${a.pos}`; if (fired.current === key) return; fired.current = key
      startWork()
    }
  })

  // ----- Cuenta regresiva: pitidos en los últimos 10 segundos -----
  let cd = null; let cdKey = ''
  if (a.restEnd && tnow < a.restEnd) { cd = Math.ceil((a.restEnd - tnow) / 1000); cdKey = 'r' + a.restEnd }
  else if (a.ph) { const l = Math.ceil((a.ph.end - tnow) / 1000); if (l > 0 && (a.ph.kind === 'prep' || l <= 3)) { cd = l; cdKey = 'p' + a.ph.end } }
  const tickRef = useRef('')
  useEffect(() => {
    if (paused || cd == null || cd < 1 || cd > 10 || !S.ticks) return
    const k = cdKey + ':' + cd; if (tickRef.current === k) return; tickRef.current = k
    playTick(cd, S); vibrate(cd <= 3 ? 150 : 50)
  }, [cd, cdKey, paused]) // eslint-disable-line

  // ----- Fin del descanso (manual) -----
  const restLeft = a.restEnd ? Math.ceil((a.restEnd - tnow) / 1000) : 0
  const resting = a.restEnd && (a.auto ? tnow < a.restEnd : tnow < a.restEnd + 4000)
  const alerted = useRef(null)
  useEffect(() => {
    if (!a.auto && a.restEnd && tnow >= a.restEnd && alerted.current !== a.restEnd) {
      alerted.current = a.restEnd
      if (S.sound) playEnd(S)
      if (S.vibrate) vibrate([300, 120, 300, 120, 500])
    }
  }, [tnow, a.restEnd]) // eslint-disable-line
  useEffect(() => { if (!a.auto && a.restEnd && tnow >= a.restEnd + 4000) setActive({ restEnd: null }) }, [tnow, a.restEnd]) // eslint-disable-line

  const elapsed = (tnow - a.startedAt - (a.pausedMs || 0)) / 1000
  const volume = sessionVolume(a.logs)
  const nextStep = steps[a.pos + 1]; const nextEx = nextStep && exMap[a.items[nextStep.item].exId]
  const restSetting = S.rest
  const setSet = (p) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }))

  const discard = async () => { if (await coach('¿Seguro que quieres descartar este entrenamiento? Se pierden las series que llevas.', { yes: 'Sí, descartar', no: 'Seguir entrenando' })) { update((s) => ({ ...s, active: null })); onExit() } }
  const save = () => {
    const sets = a.logs.map(({ exId, name, setIdx, reps, weight }) => ({ exId, name, setIdx, reps, weight }))
    const rec = { id: uid(), date: dateKey(new Date(a.startedAt)), startedAt: a.startedAt, durationSec: Math.round(elapsed), label: a.label, zones: a.zones, volume: sessionVolume(sets), notes: notes.trim(), sets }
    // Recordar el último peso usado de cada ejercicio en el plan (sobrecarga progresiva)
    const lastW = {}; a.logs.forEach((l) => { if (l.weight) lastW[l.exId] = l.weight })
    update((s) => {
      const plan = { ...s.plan }; const overrides = { ...(s.overrides || {}) }
      const upd = (p) => ({ ...p, items: p.items.map((it) => (lastW[it.exId] ? { ...it, weight: lastW[it.exId] } : it)) })
      if (a.key && overrides[a.key]) overrides[a.key] = upd(overrides[a.key])
      else if (plan[a.dow]) plan[a.dow] = upd(plan[a.dow])
      const day = rec.date
      const prs = findPRs(s.history, sets)
      const habits = { ...s.habits, [day]: [...new Set([...(s.habits[day] || []), 'entreno'])] }
      return { ...s, plan, overrides, habits, history: [{ ...rec, prs }, ...s.history], prFlash: prs.length ? prs : null, active: null }
    })
    onExit()
  }

  const doneInEx = item ? a.logs.filter((l) => l.item === step.item).length : 0
  const phLeft = a.ph ? Math.max(0, Math.ceil((a.ph.end - tnow) / 1000)) : 0

  return (
    <div className="fixed inset-0 z-30 bg-bg flex flex-col">
      {/* Cabecera */}
      <div className="safe-top px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <button aria-label="Menú" onClick={() => setMenu(true)} className="size-12 rounded-2xl bg-surface2 flex items-center justify-center shrink-0"><X size={24} /></button>
          <button onClick={paused ? resume : pause} aria-label={paused ? 'Reanudar tiempo' : 'Pausar tiempo'}
            className={cx('flex-1 min-h-12 rounded-2xl border flex items-center justify-center gap-2.5', paused ? 'bg-amber-400 text-black border-amber-400' : 'bg-surface border-line')}>
            {paused ? <Play size={22} fill="black" /> : <Pause size={22} />}
            <span className="text-left leading-none"><span className="block text-[10px] font-bold opacity-70">{paused ? 'EN PAUSA · TOCA PARA SEGUIR' : a.label}</span><span className="block text-2xl font-black tabular-nums">{fmtTime(elapsed)}</span></span>
          </button>
          <button onClick={() => setSummary(true)} disabled={!a.logs.length} className="min-h-12 px-4 rounded-2xl bg-surface2 font-bold flex items-center gap-1.5 disabled:opacity-30 shrink-0"><Flag size={18} />Fin</button>
        </div>
        <div className="h-2 rounded-full bg-surface2 mt-3 overflow-hidden"><div className="h-full bg-neon transition-all" style={{ width: `${(a.pos / Math.max(1, total)) * 100}%` }} /></div>
        <div className="text-xs text-muted mt-1 text-center">{Math.min(a.pos, total)} de {total} series · {fmtNum(volume)} kg de volumen{a.auto && ' · 🤖 automático'}</div>
        {paused && <div className="text-xs text-amber-300 text-center mt-1 font-semibold">El tiempo no cuenta mientras estás en pausa. Ajusta tu peso o tu máquina con calma.</div>}
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
            {a.auto && a.ph && (
              <div className={cx('rounded-3xl p-4 my-2 text-center', a.ph.kind === 'work' ? 'bg-neon text-black' : 'bg-surface2')}>
                <div className="text-sm font-black tracking-widest">{a.ph.kind === 'work' ? '¡HAZLO!' : 'PREPÁRATE'}</div>
                <div className="text-6xl font-black tabular-nums leading-none my-1">{fmtTime(phLeft)}</div>
                {a.ph.kind === 'work' && !cardio && <div className="font-bold">{inp.reps} repeticiones{inp.weight ? ` · ${inp.weight} kg` : ''}</div>}
                <div className={cx('h-1.5 rounded-full mt-2 overflow-hidden', a.ph.kind === 'work' ? 'bg-black/20' : 'bg-black/40')}><div className={cx('h-full', a.ph.kind === 'work' ? 'bg-black' : 'bg-neon')} style={{ width: `${(1 - phLeft / Math.max(1, a.ph.total)) * 100}%` }} /></div>
              </div>
            )}
            <div className="flex items-center justify-between my-2">
              <div className="flex items-center gap-2 font-bold"><ZoneDot zone={ex.zone} size={12} /><span className="text-muted">{ex.zone}</span></div>
              {a.mode === 'circuit' && <div className="text-sm font-bold bg-surface2 rounded-full px-3 py-1">Ronda {step.round + 1} de {Math.max(...a.items.map((i) => i.sets))}</div>}
            </div>
            <h2 className="text-2xl font-black leading-tight mb-2">{ex.name}</h2>

            <div className="flex items-center justify-between my-3">
              <div>
                <div className="text-4xl font-black">Serie {step.set + 1}<span className="text-muted"> de {item.sets}</span></div>
                <div className="text-muted font-semibold">Objetivo {item.reps}{item.rir && item.rir !== '-' ? ` · RIR ${item.rir}` : ''}</div>
                {sug && <div className="text-sm text-neon mt-1 leading-snug">💡 {sug.note}</div>}
              </div>
              <div className="flex gap-1.5">{Array.from({ length: item.sets }, (_, i) => <span key={i} className={cx('size-4 rounded-full', i < doneInEx ? 'bg-neon' : i === step.set ? 'bg-white' : 'bg-surface2')} />)}</div>
            </div>

            {!cardio && (
              <div className="flex gap-3 mb-3">
                <Stepper label="REPETICIONES" value={inp.reps} step={1} unit="reps" onChange={(v) => setInp((x) => ({ ...x, reps: v }))} />
                <Stepper label="PESO" value={inp.weight} step={2.5} unit="kg" decimals onChange={(v) => setInp((x) => ({ ...x, weight: v }))} />
              </div>
            )}

            {!cardio && <button onClick={() => setTools(true)} className="w-full min-h-12 mb-3 rounded-2xl border border-line bg-surface text-sm font-bold text-muted">🧮 Calculadora de discos y 1RM</button>}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              <Timer size={18} className="text-muted shrink-0" /><span className="text-sm text-muted shrink-0">Descanso:</span>
              {[[0, `Auto (${ex.rest}s)`], [60, '60s'], [90, '90s'], [120, '120s'], [180, '180s']].map(([v, l]) => (
                <Chip key={v} active={restSetting === v} onClick={() => setSet({ rest: v })}>{l}</Chip>))}
            </div>
            <div className="mt-4">
              <ExerciseImage ex={ex} className="w-full h-40 mb-3" />
              <button onClick={() => setGuide((g) => !g)} className="w-full flex items-center justify-between min-h-12 px-4 rounded-2xl bg-surface border border-line font-bold mb-2">
                <span>Guía rápida</span>{guide ? <ChevronUp /> : <ChevronDown />}
              </button>
              {guide && <ol className="bg-surface border border-line rounded-2xl p-4 mb-3 space-y-2">{ex.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="text-neon font-black">{i + 1}.</span><span className="leading-snug">{s}</span></li>)}</ol>}
            </div>
            {nextEx && <div className="text-sm text-muted mt-3">Siguiente: <span className="text-white font-semibold">{nextEx.name}</span></div>}
          </div>

          <div className="px-4 pt-2 pb-4 safe-bottom border-t border-line bg-bg">
            {a.auto ? (
              <div className="flex gap-3">
                <button onClick={paused ? resume : pause} className={cx('flex-1 min-h-20 rounded-3xl text-2xl font-black flex items-center justify-center gap-3', paused ? 'bg-amber-400 text-black' : 'bg-neon text-black')}>
                  {paused ? <><Play size={30} fill="black" /> REANUDAR</> : <><Pause size={30} /> PAUSAR</>}
                </button>
                <button aria-label="Saltar fase" onClick={skipPhase} className="size-20 shrink-0 rounded-3xl bg-surface2 flex items-center justify-center"><SkipForward size={28} /></button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button aria-label="Deshacer" disabled={!a.logs.length} onClick={undo} className="size-16 shrink-0 self-center rounded-3xl bg-surface2 flex items-center justify-center disabled:opacity-30"><Undo2 size={28} /></button>
                <button onClick={complete} className="flex-1 min-h-20 rounded-3xl bg-neon text-black text-2xl font-black whitespace-nowrap flex items-center justify-center gap-3 active:scale-[.98]"><Check size={34} strokeWidth={4} />{cardio ? 'COMPLETAR' : 'SERIE LISTA'}</button>
                <button aria-label="Saltar" onClick={skip} className="size-16 shrink-0 self-center rounded-3xl bg-surface2 flex items-center justify-center"><SkipForward size={28} /></button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Temporizador de descanso + vista previa del siguiente ejercicio */}
      {resting && !finished && (
        <div className={cx('absolute inset-0 z-40 flex flex-col overflow-y-auto px-5 pt-6 pb-8 transition-colors', restLeft > 0 ? 'bg-black/95' : 'bg-neon')}>
          <div className="text-center">
            <div className={cx('text-lg font-bold mb-2', restLeft > 0 ? 'text-muted' : 'text-black')}>{paused ? 'EN PAUSA' : restLeft > 0 ? (a.auto && a.restTotal <= S.extraChange + 1 && a.mode === 'circuit' ? 'CAMBIA DE EJERCICIO' : 'DESCANSO') : '¡PREPÁRATE PARA LA SIGUIENTE!'}</div>
            <div className="relative size-48 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke={restLeft > 0 ? '#2c2c2c' : '#00000033'} strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={restLeft > 0 ? (restLeft <= 10 && S.ticks ? '#fbbf24' : '#39ff14') : '#000'} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - Math.max(0, restLeft) / Math.max(1, a.restTotal))} />
              </svg>
              <div className={cx('absolute inset-0 flex items-center justify-center text-5xl font-black tabular-nums', restLeft <= 0 && 'text-black')}>{restLeft > 0 ? fmtTime(restLeft) : '00:00'}</div>
            </div>
            <div className="flex gap-3 w-full max-w-sm mx-auto">
              {restLeft > 0 && !paused && <>
                <Button variant="secondary" className="flex-1" onClick={() => setActive((c) => ({ restEnd: c.restEnd - 15000 }))}>−15s</Button>
                <Button variant="secondary" className="flex-1" onClick={() => setActive((c) => ({ restEnd: c.restEnd + 15000, restTotal: c.restTotal + 15 }))}>+15s</Button>
              </>}
              {paused
                ? <Button className="flex-1 !bg-amber-400" onClick={resume}><Play size={22} fill="black" /> Reanudar</Button>
                : <Button className={cx('flex-[1.4]', restLeft <= 0 && '!bg-black !text-neon')} onClick={() => (a.auto ? skipPhase() : setActive({ restEnd: null }))}>{restLeft > 0 ? 'Saltar' : 'Continuar'}</Button>}
            </div>
            {a.auto && !paused && <button onClick={pause} className={cx('mt-3 min-h-12 px-6 rounded-2xl font-bold inline-flex items-center gap-2', restLeft > 0 ? 'text-muted' : 'text-black')}><Pause size={18} /> Pausar rutina</button>}
          </div>

          <div className="mt-4 rounded-3xl bg-surface border border-line p-3 text-white">
            <div className="text-xs font-bold text-neon mb-2">A CONTINUACIÓN · SERIE {step.set + 1} DE {item.sets}{a.mode === 'circuit' ? ` · RONDA ${step.round + 1}` : ''}</div>
            <div className="flex gap-3 items-center mb-3">
              <ExerciseImage ex={ex} className="w-32 h-20 shrink-0" />
              <div className="min-w-0"><div className="font-black text-lg leading-tight">{ex.name}</div><div className="text-sm text-muted">Objetivo {item.reps}{item.rir && item.rir !== '-' ? ` · RIR ${item.rir}` : ''}</div>{sug && <div className="text-xs text-neon mt-1 leading-snug">💡 {sug.note}</div>}</div>
            </div>
            {!cardio && (
              <div className="flex gap-3 mb-3">
                <Stepper small label="REPETICIONES" value={inp.reps} step={1} unit="reps" onChange={(v) => setInp((x) => ({ ...x, reps: v }))} />
                <Stepper small label="PESO" value={inp.weight} step={2.5} unit="kg" decimals onChange={(v) => setInp((x) => ({ ...x, weight: v }))} />
              </div>
            )}
            <button onClick={() => setGuide((g) => !g)} className="w-full flex items-center justify-between min-h-12 px-4 rounded-2xl bg-surface2 font-bold">
              <span>Cómo se hace</span>{guide ? <ChevronUp /> : <ChevronDown />}
            </button>
            {guide && <ol className="mt-2 space-y-2 px-1">{ex.steps.map((t, i) => <li key={i} className="flex gap-3"><span className="text-neon font-black">{i + 1}.</span><span className="leading-snug">{t}</span></li>)}</ol>}
            <div className="flex gap-3 mt-3">
              <Button variant="secondary" className="flex-1 !text-base" disabled={paused} onClick={skip}><SkipForward size={20} /> Saltar esta serie</Button>
              {!a.auto && <Button variant="secondary" className="flex-1 !text-base" onClick={() => { unlockAudio(); toggleAuto() }}><Bot size={20} /> Modo automático</Button>}
            </div>
            {nextEx && <div className="text-xs text-muted mt-3">Después: <span className="text-white font-semibold">{nextEx.name}</span></div>}
          </div>
        </div>
      )}

      {tools && <ToolsSheet state={state} update={update} initialWeight={inp.weight || ''} onClose={() => setTools(false)} />}

      {/* Menú */}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Entrenamiento">
        <div className="space-y-3 pb-2">
          <button onClick={() => { toggleAuto(); setMenu(false) }} className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between font-bold">
            <span className="flex items-center gap-3"><Bot /> Modo automático</span><span className={a.auto ? 'text-neon' : 'text-muted'}>{a.auto ? 'ON · tocar para detener' : 'OFF · tocar para activar'}</span></button>
          <button onClick={() => setSet({ sound: !S.sound })} className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between font-bold">
            <span className="flex items-center gap-3">{S.sound ? <Volume2 /> : <VolumeX />} Sonido al terminar descanso</span><span className={S.sound ? 'text-neon' : 'text-muted'}>{S.sound ? 'ON' : 'OFF'}</span></button>
          <button onClick={() => setSet({ ticks: !S.ticks })} className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between font-bold">
            <span className="flex items-center gap-3"><Timer /> Pitidos últimos 10 s</span><span className={S.ticks ? 'text-neon' : 'text-muted'}>{S.ticks ? 'ON' : 'OFF'}</span></button>
          <button onClick={() => setSet({ vibrate: !S.vibrate })} className="w-full min-h-14 rounded-2xl bg-surface border border-line px-4 flex items-center justify-between font-bold">
            <span className="flex items-center gap-3"><Vibrate /> Vibración</span><span className={S.vibrate ? 'text-neon' : 'text-muted'}>{S.vibrate ? 'ON' : 'OFF'}</span></button>
          <p className="text-xs text-muted">Elige el sonido, el volumen y la voz en Progreso → Configuración.</p>
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
