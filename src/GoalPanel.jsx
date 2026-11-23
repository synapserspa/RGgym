import { useMemo, useState } from 'react'
import { Calculator, Check, RotateCcw, Sparkles, Target } from 'lucide-react'
import { GOALS, applyGoalToState, goalOf } from './goals'
import { Button, Card, Sheet, cx } from './ui'

// Botón pequeño que muestra la meta actual
export function GoalChip({ goal, onClick, className }) {
  const g = goalOf(goal)
  return <button onClick={onClick} className={cx('inline-flex items-center gap-2 min-h-11 px-4 rounded-full border border-neon/50 bg-neon/10 text-sm font-bold', className)}><Target size={16} className="text-neon" />Meta: {g.name}</button>
}

const List = ({ title, items }) => (
  <div className="mb-3"><div className="text-xs font-bold text-neon mb-1.5">{title}</div>
    <ul className="space-y-1.5">{items.map((t, i) => <li key={i} className="flex gap-2 leading-snug"><span className="text-neon">•</span><span>{t}</span></li>)}</ul></div>
)

export function GoalSheet({ state, update, onClose }) {
  const current = state.settings.goal
  const [sel, setSel] = useState(current)
  const [msg, setMsg] = useState('')
  const g = goalOf(sel)
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const choose = () => { update((s) => ({ ...s, settings: { ...s.settings, goal: sel } })); setMsg(`Meta elegida: ${g.name} ✔`) }
  const adapt = () => {
    if (!confirm(`Se ajustan las series, repeticiones y descansos de tu plan semanal a la meta “${g.name}”. Puedes volver a lo original cuando quieras. ¿Continuar?`)) return
    update((s) => ({ ...applyGoalToState(s, sel, exMap), settings: { ...s.settings, goal: sel } })); setMsg('Plan ajustado a tu meta ✔')
  }
  const restore = () => { update((s) => applyGoalToState(s, sel, exMap, true)); setMsg('Plan restaurado a lo original ✔') }
  const toMacros = () => {
    update((s) => ({ ...s, macrosCalc: { weight: '', kcal: '', ...(s.macrosCalc || {}), ...g.macros } })); setMsg('Calculadora de macros configurada ✔ (abre Progreso → Calculadora)')
  }
  return (
    <Sheet open onClose={onClose} title="Mi meta">
      <p className="text-muted mb-3">Elige tu objetivo. La app ajusta repeticiones, series y descansos de tus rutinas, y te da pautas de nutrición y actividad.</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {GOALS.map((x) => (
          <button key={x.id} onClick={() => { setSel(x.id); setMsg('') }} className={cx('rounded-2xl border p-3 text-left min-h-24', sel === x.id ? 'border-neon bg-neon/10' : 'border-line bg-surface')}>
            <div className="text-2xl">{x.emoji}</div><div className="font-black leading-tight">{x.name}</div>{current === x.id && <div className="text-xs text-neon font-bold mt-0.5">ACTUAL</div>}
          </button>))}
      </div>
      <Card className="mb-4">
        <h3 className="text-xl font-black mb-1">{g.emoji} {g.name}</h3>
        <p className="text-muted mb-3">{g.short}</p>
        <List title="ENTRENAMIENTO" items={g.train} />
        <List title="NUTRICIÓN" items={g.nutrition} />
        <List title="ACTIVIDAD Y RECUPERACIÓN" items={g.activity} />
      </Card>
      <div className="space-y-2.5 pb-2">
        <Button className="w-full" onClick={choose} disabled={sel === current}><Check size={20} strokeWidth={4} /> {sel === current ? 'Esta es tu meta' : 'Elegir esta meta'}</Button>
        <Button variant="secondary" className="w-full" onClick={adapt}><Sparkles size={20} /> Ajustar mi plan semanal a esta meta</Button>
        <Button variant="secondary" className="w-full" onClick={toMacros}><Calculator size={20} /> Usar en mi calculadora de macros</Button>
        <button onClick={restore} className="w-full min-h-12 text-muted font-bold flex items-center justify-center gap-2"><RotateCcw size={18} /> Volver a series y repeticiones originales</button>
        {msg && <p className="text-center font-semibold text-neon">{msg}</p>}
      </div>
    </Sheet>
  )
}
