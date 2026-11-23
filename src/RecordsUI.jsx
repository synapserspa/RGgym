import { useMemo, useState } from 'react'
import { AlertTriangle, Trophy, X } from 'lucide-react'
import { LineChart } from './Charts'
import { exerciseSessions, isStalled, kg, prText, suggestNext } from './records'
import { fmtDate } from './lib'
import { Card, Empty, ExerciseImage, Sheet } from './ui'

// Aviso de récords recién logrados (se muestra arriba en Progreso)
export function PRFlash({ state, update }) {
  const prs = state.prFlash
  if (!prs?.length) return null
  return (
    <Card className="mb-4 border-amber-400/60 bg-amber-400/10">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300 font-black text-lg"><Trophy size={22} /> ¡Nuevo{prs.length > 1 ? 's' : ''} récord{prs.length > 1 ? 's' : ''}!</div>
        <button aria-label="Cerrar aviso" onClick={() => update((s) => ({ ...s, prFlash: null }))} className="size-10 rounded-full bg-surface2 flex items-center justify-center"><X size={18} /></button>
      </div>
      <ul className="mt-2 space-y-1.5">{prs.map((p, i) => <li key={i} className="leading-snug"><b>{p.name}</b><span className="block text-sm text-white/80">{prText(p)}</span></li>)}</ul>
    </Card>
  )
}

export function ExerciseProgressSheet({ ex, state, onClose }) {
  const ses = useMemo(() => exerciseSessions(state.history, ex.id), [state.history, ex.id])
  const weighted = ses.some((s) => s.weighted)
  const stalled = isStalled(state.history, ex.id)
  const sug = suggestNext(state.history, ex, ex.reps)
  const bestTop = Math.max(...ses.map((s) => s.top)); const bestE1 = Math.max(...ses.map((s) => s.e1)); const bestReps = Math.max(...ses.map((s) => s.maxReps))
  const pts = ses.map((s) => ({ x: fmtDate(s.date), y: weighted ? s.e1 : s.maxReps }))
  return (
    <Sheet open onClose={onClose} title={ex.name}>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(weighted
          ? [[`${kg(bestTop)} kg`, 'Mejor peso'], [`${kg(bestE1)} kg`, '1RM estimado'], [ses.length, 'Sesiones']]
          : [[bestReps, 'Mejor serie'], [ses.length, 'Sesiones'], [ses.reduce((a, s) => a + s.sets.length, 0), 'Series']]
        ).map(([v, l]) => <Card key={l} className="text-center !p-3"><div className="text-xl font-black text-neon">{v}</div><div className="text-[11px] text-muted">{l}</div></Card>)}
      </div>
      {stalled && <div className="flex gap-2 rounded-2xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm mb-3"><AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" /><span><b>Estancado:</b> no mejoras hace 3 sesiones. Prueba cambiar la variante, bajar un poco el peso y subirlo de a poco, o revisar sueño y calorías.</span></div>}
      {sug && <div className="rounded-2xl border border-neon/40 bg-neon/10 p-3 text-sm mb-3">💡 {sug.note}</div>}
      <div className="text-xs font-bold text-muted mb-1">{weighted ? '1RM ESTIMADO POR SESIÓN (kg)' : 'MEJOR SERIE POR SESIÓN (reps)'}</div>
      <Card className="mb-4 !p-2"><LineChart points={pts} unit={weighted ? ' kg' : ''} /></Card>
      <div className="text-xs font-bold text-muted mb-2">ÚLTIMAS SESIONES</div>
      <div className="space-y-2">
        {[...ses].reverse().slice(0, 8).map((s) => (
          <Card key={s.id} className="!p-3"><div className="font-bold">{fmtDate(s.date)}</div>
            <div className="text-sm text-muted">{s.sets.map((x) => (x.weight ? `${kg(x.weight)}×${x.reps}` : `${x.reps} reps`)).join('  ·  ')}</div></Card>))}
      </div>
    </Sheet>
  )
}

// Lista de ejercicios con historial
export function RecordsSection({ state }) {
  const [open, setOpen] = useState(null)
  const list = useMemo(() => {
    const ids = [...new Set(state.history.flatMap((h) => h.sets.map((s) => s.exId)))]
    return ids.map((id) => ({ ex: state.exercises.find((e) => e.id === id), ses: exerciseSessions(state.history, id) }))
      .filter((x) => x.ex && x.ses.length).sort((a, b) => b.ses[b.ses.length - 1].date.localeCompare(a.ses[a.ses.length - 1].date))
  }, [state.history, state.exercises])
  if (!list.length) return <Empty icon={Trophy} text="Guarda entrenamientos para ver tus récords y tu progreso por ejercicio." />
  return (
    <>
      <div className="space-y-2">
        {list.map(({ ex, ses }) => { const last = ses[ses.length - 1]; const stalled = isStalled(state.history, ex.id)
          return (
            <button key={ex.id} onClick={() => setOpen(ex)} className="w-full text-left flex items-center gap-3 bg-surface border border-line rounded-2xl p-2">
              <ExerciseImage ex={ex} compact className="size-14 shrink-0" />
              <div className="min-w-0 flex-1"><div className="font-bold leading-tight">{ex.name}</div>
                <div className="text-sm text-muted">{last.weighted ? `Mejor: ${kg(Math.max(...ses.map((s) => s.top)))} kg` : `Mejor serie: ${Math.max(...ses.map((s) => s.maxReps))} reps`} · {ses.length} ses.</div></div>
              {stalled && <span className="text-[10px] font-black px-2 py-1 rounded-full bg-amber-400 text-black shrink-0">ESTANCADO</span>}
            </button>) })}
      </div>
      {open && <ExerciseProgressSheet ex={open} state={state} onClose={() => setOpen(null)} />}
    </>
  )
}
