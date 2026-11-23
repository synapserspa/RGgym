import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Check, Moon, Pencil, Play, Repeat, Dumbbell } from 'lucide-react'
import { DAY_NAMES, MONTHS, dateKey, fmtDur, mondayOf, parseKey } from './lib'
import { speak, unlockAudio } from './audio'
import { estimateSec, workSeconds } from './Active'
import { Button, Card, Chip, Empty, ExerciseImage, Header, ZoneDot, cx } from './ui'
import { ExerciseDetail } from './Library'
import { PlanEditor, isRest } from './Calendar'
import { REST_DAY, missedDay, moveMissedToToday } from './moves'

const saludo = (d) => (d.getHours() < 12 ? 'Buenos días' : d.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches')
const FRASES = ['Primero el trabajo, después el resultado.', 'No necesitas motivación: necesitas un sistema.', 'Los días sin ganas son los que más importan.', 'Cada hábito es un voto a favor de tu nueva identidad.', 'Sobrecarga progresiva: mejora algo en cada sesión.', 'Consistencia, no perfección.', 'Recuperas = progresas.']

// ---------- Pantalla "Entrenar hoy" ----------
export default function Today({ state, update, onStartTraining }) {
  const now = new Date(); const dow = now.getDay(); const k = dateKey(now)
  const hasOverride = !!state.overrides?.[k]; const plan = state.overrides?.[k] || state.plan[dow]; const rest = isRest(plan)
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const doneToday = state.history.filter((h) => h.date === k)
  const [detail, setDetail] = useState(null); const [edit, setEdit] = useState(false)
  const [mode, setMode] = useState(plan?.circuit || state.settings.circuit ? 'circuit' : 'serial')
  const weekStart = mondayOf(now); const weekCount = new Set(state.history.filter((h) => h.date >= dateKey(weekStart)).map((h) => h.date)).size

  const missed = missedDay(state, now)
  const [movedMsg, setMovedMsg] = useState('')
  const missedHere = () => {
    const r = moveMissedToToday(state, missed.key, k)
    if (r.needsConfirm) {
      if (!confirm('No hay un día de descanso libre en los próximos 4 días para correr la rutina de hoy. Se reemplazará la de hoy. ¿Continuar?')) return
      const f = moveMissedToToday(state, missed.key, k, true); update(() => f.state); return
    }
    update(() => r.state)
    setMovedMsg(r.pushedTo ? `Listo. La rutina que tenías hoy pasó al ${DAY_NAMES[parseKey(r.pushedTo).getDay()].toLowerCase()} ${parseKey(r.pushedTo).getDate()}.` : 'Listo: hoy toca la rutina que te faltó.')
  }
  const missedSkip = () => update((s) => ({ ...s, overrides: { ...(s.overrides || {}), [missed.key]: { ...REST_DAY } } }))

  const start = (auto = false) => {
    unlockAudio()
    const S = state.settings
    let items = plan.items.filter((i) => exMap[i.exId] && i.sets > 0).map((i) => ({ ...i }))
    if (auto) items = items.filter((i) => workSeconds(i, exMap[i.exId], S) != null) // lo que no se puede medir (ej. "10.000 pasos") queda fuera
    if (!items.length) return
    const t0 = Date.now()
    update((s) => ({ ...s, settings: { ...s.settings, circuit: mode === 'circuit' }, active: { dow, key: hasOverride ? k : null, label: plan.label || 'Entrenamiento', zones: plan.zones, mode, items, startedAt: t0, pausedAt: null, pausedMs: 0, auto, ph: auto ? { kind: 'prep', end: t0 + S.prepSec * 1000, total: S.prepSec } : null, logs: [], pos: 0, restEnd: null, restTotal: 0 } }))
    if (auto) speak(`Empezamos. ${exMap[items[0].exId].name}. Serie 1 de ${items[0].sets}.`, S)
    onStartTraining()
  }
  const S = state.settings
  const estAuto = plan ? estimateSec(plan.items, mode, exMap, S, true) : 0
  const canAuto = plan?.items.some((i) => exMap[i.exId] && workSeconds(i, exMap[i.exId], S) != null)

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
              : `$${plan.items.length} ejercicios · ${plan.items.reduce((a, i) => a + i.sets, 0)} series · ~${Math.round(estAuto / 60)} min`}
            {doneToday.length > 0 && ' · ¡Ya entrenaste hoy!'}
          </div>
          <div className="text-sm text-neon/80 italic mt-2">“{FRASES[Math.floor(now / 864e5) % FRASES.length]}”</div>
        </div>
        {movedMsg && <div className="rounded-2xl border border-neon/50 bg-neon/10 p-3 mb-3 font-semibold">{movedMsg}</div>}
        {missed && (
          <Card className="mb-4 border-amber-400/50">
            <div className="text-xs font-bold text-amber-300 mb-1">DÍA PERDIDO</div>
            <div className="font-black text-lg leading-tight">El {DAY_NAMES[parseKey(missed.key).getDay()].toLowerCase()} no hiciste «{missed.plan.label}»</div>
            <p className="text-sm text-muted mt-1">En vez de saltarla, pásala a hoy. Si hoy ya tenías rutina, la corro al siguiente día de descanso.</p>
            <div className="flex gap-2.5 mt-3"><Button className="flex-1 !text-base" onClick={missedHere}>Hacerla hoy</Button><Button variant="secondary" className="flex-1 !text-base" onClick={missedSkip}>Omitir</Button></div>
          </Card>
        )}
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
                <Button className={cx('w-full min-h-20 text-2xl rounded-3xl mb-3', !rest && 'pulse')} variant={rest ? 'secondary' : 'primary'} onClick={() => start(false)}>
                  <Play size={28} fill={rest ? 'white' : 'black'} /> {doneToday.length ? 'Entrenar otra vez' : rest ? 'Entrenar de todas formas' : 'Empezar entrenamiento'}
                </Button>
                {canAuto && (
                  <button onClick={() => start(true)} className="w-full mb-5 rounded-3xl border-2 border-neon/60 bg-neon/10 p-4 flex items-center gap-4 text-left">
                    <span className="size-14 rounded-2xl bg-neon text-black flex items-center justify-center shrink-0"><Bot size={30} /></span>
                    <span><span className="block text-xl font-black">Rutina automática</span><span className="block text-sm text-muted leading-snug">Tiempo aprox. {Math.round(estAuto / 60)} min. Deja el celular: solo escucha los pitidos y la voz.</span></span>
                  </button>
                )}
                <h3 className="text-sm font-bold text-muted mb-2">RUTINA · {plan.items.length} EJERCICIOS</h3>
                <div className="space-y-2.5">
                  {plan.items.map((it, i) => { const e = exMap[it.exId]; if (!e) return null
                    return (
                      <button key={i} onClick={() => setDetail(e)} className="w-full text-left flex items-center gap-3 bg-surface border border-line rounded-3xl p-2.5">
                        <ExerciseImage ex={e} compact className="size-16 shrink-0" />
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
      {edit && <PlanEditor dow={dow} date={k} state={state} update={update} onClose={() => setEdit(false)} />}
    </div>
  )
}

