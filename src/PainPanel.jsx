import { useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { alternativesFor, replaceInPlan } from './pain'
import { dateKey } from './lib'
import { Button, Card, Empty, ExerciseImage, Sheet, cx, inputCls } from './ui'

export const PainBadge = ({ className }) => <span title="Marcaste molestia" className={cx('inline-flex items-center gap-1 rounded-full bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5', className)}>⚠ MOLESTIA</span>

const SAFETY = 'Si el dolor es agudo, punzante, se irradia, o dura más de unos días, descansa de ese movimiento y consulta con un profesional de la salud. Esto es una guía general, no un diagnóstico.'

// Marcar una molestia y ver alternativas. onSwap(alt) cambia el ejercicio en el entrenamiento actual.
export function PainSheet({ ex, state, update, onClose, onSwap }) {
  const flagged = !!state.pain?.[ex.id]; const note = state.pain?.[ex.id]?.note || ''
  const [done, setDone] = useState('')
  const alts = alternativesFor(ex, state.exercises, state.pain)
  const setPain = (v) => update((s) => { const p = { ...(s.pain || {}) }; if (v) p[ex.id] = { since: p[ex.id]?.since || dateKey(), note: v.note ?? p[ex.id]?.note ?? '' }; else delete p[ex.id]; return { ...s, pain: p } })
  return (
    <Sheet open onClose={onClose} title="Me molesta este ejercicio">
      <div className="flex items-center gap-3 mb-4"><ExerciseImage ex={ex} compact className="size-16 shrink-0" /><div className="min-w-0"><div className="font-black text-lg leading-tight">{ex.name}</div><div className="text-sm text-muted">{ex.zone}</div></div></div>
      <button onClick={() => setPain(flagged ? null : { note: '' })} className={cx('w-full min-h-14 rounded-2xl border px-4 mb-3 flex items-center justify-between font-bold', flagged ? 'border-amber-400 bg-amber-400/10' : 'border-line bg-surface')}>
        <span className="flex items-center gap-2"><AlertTriangle size={20} className="text-amber-300" /> {flagged ? 'Marcado con molestia' : 'Marcar molestia'}</span><span className={flagged ? 'text-amber-300' : 'text-muted'}>{flagged ? 'SÍ' : 'NO'}</span></button>
      {flagged && <input className={inputCls + ' mb-3'} placeholder="¿Dónde duele? (opcional): hombro, rodilla…" value={note} onChange={(e) => setPain({ note: e.target.value })} />}
      <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm mb-4 leading-snug">{SAFETY}</div>
      <div className="text-xs font-bold text-neon mb-2">ALTERNATIVAS PARECIDAS</div>
      {!alts.length && <Empty text="No encontré alternativas." />}
      <div className="space-y-2">
        {alts.map((a) => (
          <Card key={a.id} className="!p-2.5">
            <div className="flex items-center gap-3"><ExerciseImage ex={a} compact className="size-14 shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold leading-tight">{a.name}</div><div className="text-xs text-muted">{a.zone} · {a.level}</div></div></div>
            <div className={cx('grid gap-2 mt-2', onSwap ? 'grid-cols-2' : 'grid-cols-1')}>
              {onSwap && <Button className="!min-h-12 !text-sm" onClick={() => { onSwap(a); onClose() }}>Usar hoy</Button>}
              <Button variant="secondary" className="!min-h-12 !text-sm" onClick={() => { update((s) => replaceInPlan(s, ex.id, a.id)); if (onSwap) onSwap(a, true); setDone(`Cambié «${ex.name}» por «${a.name}» en tu plan ✔`) }}>Cambiar en mi plan</Button>
            </div>
          </Card>))}
      </div>
      {done && <p className="text-center font-semibold text-neon mt-3 flex items-center justify-center gap-2"><Check size={18} strokeWidth={4} />{done}</p>}
    </Sheet>
  )
}

// Lista de molestias marcadas (en Progreso)
export function PainList({ state, update }) {
  const [open, setOpen] = useState(null)
  const ids = Object.keys(state.pain || {}); const exs = ids.map((id) => state.exercises.find((e) => e.id === id)).filter(Boolean)
  if (!exs.length) return <p className="text-muted text-sm">No tienes molestias marcadas. Si un ejercicio te duele, marca “⚠ Me duele” durante el entrenamiento o en su ficha, y te propongo alternativas.</p>
  return (
    <>
      <div className="space-y-2">{exs.map((e) => (
        <Card key={e.id} className="!p-3">
          <div className="flex items-center gap-3"><ExerciseImage ex={e} compact className="size-14 shrink-0" /><div className="min-w-0 flex-1"><div className="font-bold leading-tight">{e.name}</div><div className="text-xs text-muted">{state.pain[e.id].note || 'Sin nota'} · desde {state.pain[e.id].since}</div></div></div>
          <div className="grid grid-cols-2 gap-2 mt-2"><Button variant="secondary" className="!min-h-12 !text-sm" onClick={() => setOpen(e)}>Ver alternativas</Button><Button className="!min-h-12 !text-sm" onClick={() => update((s) => { const p = { ...s.pain }; delete p[e.id]; return { ...s, pain: p } })}>Ya no me molesta</Button></div>
        </Card>))}</div>
      {open && <PainSheet ex={open} state={state} update={update} onClose={() => setOpen(null)} />}
    </>
  )
}
