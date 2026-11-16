import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Moon, Plus, Trash2, Play, Pencil } from 'lucide-react'
import { ZONES, ZONE_COLOR } from './data'
import { DAY_NAMES, DAY_SHORT, MONTHS, addDays, dateKey, fmtDur, fmtNum, mondayOf, parseKey } from './lib'
import { Button, Card, Chip, Header, Sheet, ZoneDot, cx, inputCls } from './ui'
import { ExercisePicker } from './Library'

export const isRest = (day) => !day || day.rest || !day.items?.length

// ---------- Editor del plan de un día de la semana ----------
export function PlanEditor({ dow, state, update, onClose }) {
  const plan = state.plan[dow] || { label: '', zones: [], items: [] }
  const [picker, setPicker] = useState(false)
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const patch = (p) => update((s) => ({ ...s, plan: { ...s.plan, [dow]: { ...(s.plan[dow] || { label: '', zones: [], items: [] }), ...p } } }))
  const setItem = (i, p) => patch({ items: plan.items.map((it, j) => (j === i ? { ...it, ...p } : it)) })
  const move = (i, d) => { const a = [...plan.items]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; patch({ items: a }) }
  const toggleZone = (z) => patch({ zones: plan.zones.includes(z) ? plan.zones.filter((x) => x !== z) : [...plan.zones, z] })
  const addExercises = (ids) => {
    const items = [...plan.items, ...ids.map((id) => { const e = exMap[id]; return { exId: id, sets: e.sets, reps: e.reps, rir: e.rir, weight: 0 } })]
    const zones = [...new Set([...plan.zones, ...ids.map((id) => exMap[id].zone)])]
    patch({ items, zones, rest: false }); setPicker(false)
  }

  return (
    <Sheet open onClose={onClose} title={`Plan del ${DAY_NAMES[dow].toLowerCase()}`}>
      <p className="text-muted text-sm mb-4">Este plan se repite todas las semanas en este día.</p>
      <input className={inputCls + ' mb-4'} placeholder="Nombre (ej. Pecho y tríceps)" value={plan.label} onChange={(e) => patch({ label: e.target.value })} />
      <button onClick={() => patch({ rest: !plan.rest })} className={cx('w-full min-h-14 rounded-2xl border flex items-center justify-center gap-2 font-bold mb-4', plan.rest ? 'bg-surface2 border-neon text-neon' : 'bg-surface border-line text-white')}>
        <Moon size={20} /> {plan.rest ? 'Día de descanso (activo)' : 'Marcar como día de descanso'}
      </button>
      <h3 className="text-sm font-bold text-muted mb-2">ZONAS DEL CUERPO</h3>
      <div className="flex flex-wrap gap-2 mb-5">{ZONES.map((z) => <Chip key={z} active={plan.zones.includes(z)} color={ZONE_COLOR[z]} onClick={() => toggleZone(z)}>{z}</Chip>)}</div>
      <h3 className="text-sm font-bold text-muted mb-2">EJERCICIOS ({plan.items.length})</h3>
      <div className="space-y-3 mb-4">
        {plan.items.map((it, i) => {
          const e = exMap[it.exId]; if (!e) return null
          return (
            <Card key={i} className="!p-3">
              <div className="flex items-center gap-2 mb-2">
                <ZoneDot zone={e.zone} /><div className="font-bold flex-1 leading-tight">{e.name}</div>
                <button aria-label="Subir" className="size-11 rounded-xl bg-surface2 flex items-center justify-center" onClick={() => move(i, -1)}><ArrowUp size={18} /></button>
                <button aria-label="Bajar" className="size-11 rounded-xl bg-surface2 flex items-center justify-center" onClick={() => move(i, 1)}><ArrowDown size={18} /></button>
                <button aria-label="Quitar" className="size-11 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center" onClick={() => patch({ items: plan.items.filter((_, j) => j !== i) })}><Trash2 size={18} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs text-muted">Series<input className={inputCls + ' !min-h-12 mt-1'} inputMode="numeric" value={it.sets} onChange={(ev) => setItem(i, { sets: Number(ev.target.value.replace(/\D/g, '')) || 0 })} /></label>
                <label className="text-xs text-muted">Reps<input className={inputCls + ' !min-h-12 mt-1'} value={it.reps} onChange={(ev) => setItem(i, { reps: ev.target.value })} /></label>
                <label className="text-xs text-muted">Peso kg<input className={inputCls + ' !min-h-12 mt-1'} inputMode="decimal" value={it.weight || ''} placeholder="0" onChange={(ev) => setItem(i, { weight: Number(ev.target.value.replace(',', '.')) || 0 })} /></label>
              </div>
            </Card>
          )
        })}
      </div>
      <Button className="w-full" onClick={() => setPicker(true)}><Plus size={22} /> Añadir ejercicios</Button>
      {picker && <ExercisePicker multi exercises={state.exercises} onClose={() => setPicker(false)} onDone={addExercises} title="Añadir a la rutina" />}
    </Sheet>
  )
}

// Estado de un día: 'done' | 'planned' | 'rest'
function dayInfo(date, state) {
  const k = dateKey(date); const dow = date.getDay(); const plan = state.plan[dow]
  const sessions = state.history.filter((h) => h.date === k)
  const rest = isRest(plan)
  return { k, dow, plan, sessions, status: sessions.length ? 'done' : rest ? 'rest' : 'planned', rest }
}

function DayMarks({ info }) {
  if (info.status === 'done') return <Check size={16} className="text-neon" strokeWidth={4} />
  if (info.status === 'rest') return <Moon size={12} className="text-muted" />
  return <div className="flex gap-0.5 flex-wrap justify-center">{info.plan.zones.slice(0, 4).map((z) => <ZoneDot key={z} zone={z} size={7} />)}</div>
}

export default function Calendar({ state, update, onStart }) {
  const [view, setView] = useState('mes')
  const [cursor, setCursor] = useState(() => new Date())
  const [sel, setSel] = useState(null) // Date seleccionada
  const [editDow, setEditDow] = useState(null)
  const todayK = dateKey()
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])

  const monthCells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = mondayOf(first)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor])
  const weekStart = mondayOf(cursor)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const shift = (n) => setCursor((c) => (view === 'mes' ? new Date(c.getFullYear(), c.getMonth() + n, 1) : addDays(c, n * 7)))
  const title = view === 'mes' ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}` : `${weekDays[0].getDate()} ${MONTHS[weekDays[0].getMonth()].slice(0, 3)} – ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()].slice(0, 3)}`

  const selInfo = sel && dayInfo(sel, state)

  return (
    <div>
      <Header title="Calendario" subtitle="Planifica tu semana"
        right={<div className="flex bg-surface rounded-2xl p-1 border border-line">{['mes', 'semana'].map((v) => (
          <button key={v} onClick={() => setView(v)} className={cx('min-h-11 px-4 rounded-xl font-bold capitalize', view === v ? 'bg-neon text-black' : 'text-muted')}>{v}</button>))}</div>} />
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <button aria-label="Anterior" onClick={() => shift(-1)} className="size-14 rounded-2xl bg-surface border border-line flex items-center justify-center"><ChevronLeft size={26} /></button>
          <button onClick={() => setCursor(new Date())} className="text-xl font-black">{title}</button>
          <button aria-label="Siguiente" onClick={() => shift(1)} className="size-14 rounded-2xl bg-surface border border-line flex items-center justify-center"><ChevronRight size={26} /></button>
        </div>

        {view === 'mes' ? (
          <>
            <div className="grid grid-cols-7 mb-1">{DAY_SHORT.map((d) => <div key={d} className="text-center text-xs font-bold text-muted py-1">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-1.5">
              {monthCells.map((d) => {
                const info = dayInfo(d, state); const inMonth = d.getMonth() === cursor.getMonth()
                return (
                  <button key={info.k} onClick={() => setSel(d)} className={cx('aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border',
                    info.k === todayK ? 'border-neon' : 'border-line', info.status === 'done' ? 'bg-neon/15' : 'bg-surface', !inMonth && 'opacity-35')}>
                    <span className={cx('text-base font-bold leading-none', info.k === todayK && 'text-neon')}>{d.getDate()}</span>
                    <div className="h-4 flex items-center"><DayMarks info={info} /></div>
                  </button>
                )
              })}
            </div>
          </>
        ) : (
          <div className="space-y-2.5">
            {weekDays.map((d) => {
              const info = dayInfo(d, state)
              return (
                <button key={info.k} onClick={() => setSel(d)} className={cx('w-full text-left rounded-3xl border p-4 flex items-center gap-4', info.k === todayK ? 'border-neon' : 'border-line', info.status === 'done' ? 'bg-neon/10' : 'bg-surface')}>
                  <div className="text-center w-12 shrink-0"><div className="text-xs font-bold text-muted uppercase">{DAY_NAMES[d.getDay()].slice(0, 3)}</div><div className="text-3xl font-black leading-none">{d.getDate()}</div></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg truncate">{info.plan?.label || 'Sin plan'}</div>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1 text-sm text-muted">
                      {info.status === 'rest' ? <><Moon size={14} /> Descanso</> : info.plan.zones.map((z) => <span key={z} className="flex items-center gap-1"><ZoneDot zone={z} size={8} />{z}</span>)}
                    </div>
                  </div>
                  {info.status === 'done' ? <div className="size-10 rounded-full bg-neon flex items-center justify-center"><Check size={22} className="text-black" strokeWidth={4} /></div> : <ChevronRight className="text-muted" />}
                </button>
              )
            })}
          </div>
        )}

        <div className="flex gap-4 justify-center text-xs text-muted mt-4 pb-4 flex-wrap">
          <span className="flex items-center gap-1"><Check size={14} className="text-neon" strokeWidth={4} /> Completado</span>
          <span className="flex items-center gap-1"><ZoneDot zone="Pecho" size={8} /><ZoneDot zone="Espalda" size={8} /> Planificado</span>
          <span className="flex items-center gap-1"><Moon size={12} /> Descanso</span>
        </div>
      </div>

      {sel && (
        <Sheet open onClose={() => setSel(null)} title={`${DAY_NAMES[sel.getDay()]} ${sel.getDate()}`}
          footer={<div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setEditDow(sel.getDay()); setSel(null) }}><Pencil size={20} /> Editar plan</Button>
            {selInfo.k === todayK && selInfo.status !== 'rest' && <Button className="flex-1" onClick={() => { setSel(null); onStart() }}><Play size={20} fill="black" /> Entrenar</Button>}
          </div>}>
          <div className="text-muted mb-3">{MONTHS[sel.getMonth()]} {sel.getFullYear()}</div>
          <Card className="mb-4">
            <div className="text-xl font-black mb-1">{selInfo.plan?.label || 'Sin plan'}</div>
            <div className="flex flex-wrap gap-3 text-sm text-muted mb-3">{selInfo.plan?.zones.map((z) => <span key={z} className="flex items-center gap-1.5"><ZoneDot zone={z} />{z}</span>)}</div>
            {selInfo.plan?.items.length ? (
              <ul className="space-y-1.5">{selInfo.plan.items.map((it, i) => <li key={i} className="flex justify-between gap-3 text-base"><span>{exMap[it.exId]?.name}</span><span className="text-muted shrink-0">{it.sets}×{it.reps}</span></li>)}</ul>
            ) : <p className="text-muted">Día libre.</p>}
          </Card>
          {selInfo.sessions.map((h) => (
            <Card key={h.id} className="mb-3 border-neon/40">
              <div className="flex items-center gap-2 font-black text-neon mb-1"><Check size={20} strokeWidth={4} /> Completado</div>
              <div className="text-muted">{h.label} · {fmtDur(h.durationSec)} · {fmtNum(h.volume)} kg de volumen</div>
              {h.notes && <div className="mt-2 italic">“{h.notes}”</div>}
            </Card>
          ))}
        </Sheet>
      )}
      {editDow !== null && <PlanEditor dow={editDow} state={state} update={update} onClose={() => setEditDow(null)} />}
    </div>
  )
}
