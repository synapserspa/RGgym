import { useMemo, useState } from 'react'
import { Play, Plus, Trash2 } from 'lucide-react'
import Runner from './Runner'
import { ExercisePicker } from './Library'
import { unlockAudio } from './audio'
import { Button, Card, Chip, cx, inputCls } from './ui'

const PREP = 10

function ExList({ ids, exMap, onAdd, onRemove }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-bold text-muted mb-1.5">EJERCICIOS (OPCIONAL · SE ALTERNAN)</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {ids.map((id) => <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-surface2 border border-line pl-3 pr-1 min-h-10 text-sm font-semibold">{exMap[id]?.name}<button aria-label="Quitar" onClick={() => onRemove(id)} className="size-8 rounded-full flex items-center justify-center text-muted"><Trash2 size={14} /></button></span>)}
      </div>
      <Button variant="secondary" className="min-h-12 !text-base" onClick={onAdd}><Plus size={18} /> Elegir ejercicios</Button>
    </div>
  )
}

const Opt = ({ label, value, opts, onChange, fmt = (v) => v }) => (
  <div className="mt-3"><div className="text-xs font-bold text-muted mb-1.5">{label}</div>
    <div className="flex flex-wrap gap-2">{opts.map((o) => <Chip key={o} active={value === o} onClick={() => onChange(o)}>{fmt(o)}</Chip>)}</div></div>
)

export default function TimersPanel({ state, update }) {
  const S = state.settings
  const exMap = useMemo(() => Object.fromEntries(state.exercises.map((e) => [e.id, e])), [state.exercises])
  const [mode, setMode] = useState('emom'); const [run, setRun] = useState(null); const [picker, setPicker] = useState(false)
  const [cfg, setCfg] = useState({
    emom: { minutes: 10, every: 60, reps: '', ex: [] },
    amrap: { minutes: 12, ex: [] },
    tabata: { rounds: 8, work: 20, rest: 10, ex: [] },
  })
  const c = cfg[mode]
  const set = (p) => setCfg((x) => ({ ...x, [mode]: { ...x[mode], ...p } }))
  const nm = (i) => (c.ex.length ? exMap[c.ex[i % c.ex.length]]?.name : null)

  const build = () => {
    const prep = { kind: 'prep', dur: PREP, label: 'Prepárate', sub: 'Ubícate y respira.', speak: 'Prepárate.' }
    if (mode === 'emom') {
      const n = Math.floor((c.minutes * 60) / c.every)
      const segs = Array.from({ length: n }, (_, i) => ({ kind: 'work', dur: c.every, label: nm(i) || `Intervalo ${i + 1}`, count: `${i + 1} de ${n}`, speak: `${i === 0 ? 'Empieza. ' : ''}${nm(i) || `Intervalo ${i + 1}`}`,
        sub: c.reps ? `Haz ${c.reps} repeticiones y descansa el resto del intervalo.` : 'Haz tus repeticiones y descansa lo que te sobre.' }))
      return { title: `EMOM ${c.minutes} min`, segments: [prep, ...segs] }
    }
    if (mode === 'amrap') {
      const names = c.ex.map((id) => exMap[id]?.name).filter(Boolean)
      const total = c.minutes * 60
      return { title: `AMRAP ${c.minutes} min`, amrap: true, segments: [prep, { kind: 'work', dur: total, label: 'Tantas rondas como puedas', sub: names.length ? names.join(' · ') : 'Completa la ronda y súmala con el botón +.', speak: 'Ya. Tantas rondas como puedas.', marks: [total / 2 >= 120 ? total / 2 : null, 60, 30].filter(Boolean) }] }
    }
    const segs = []
    for (let r = 0; r < c.rounds; r++) {
      segs.push({ kind: 'work', dur: c.work, label: nm(r) || 'A todo lo que das', count: `${r + 1} de ${c.rounds}`, speak: nm(r) || 'Ya', sub: `${c.work} segundos a máxima intensidad.` })
      if (r < c.rounds - 1) segs.push({ kind: 'rest', dur: c.rest, label: 'Descanso', sub: nm(r + 1) ? `Sigue: ${nm(r + 1)}` : `Ronda ${r + 2} de ${c.rounds}`, speak: 'Descanso' })
    }
    return { title: `Tabata ${c.rounds} rondas`, segments: [prep, ...segs] }
  }
  const dur = (() => { const p = build(); const t = p.segments.reduce((a, x) => a + x.dur, 0); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}` })()

  return (
    <div>
      <p className="text-muted leading-snug mb-3">Intervalos manos libres con pitidos y voz. Pon el celular apoyado y entrena.</p>
      <div className="flex bg-surface rounded-2xl p-1 border border-line mb-3">
        {[['emom', 'EMOM'], ['amrap', 'AMRAP'], ['tabata', 'Tabata']].map(([v, l]) => <button key={v} onClick={() => setMode(v)} className={cx('flex-1 min-h-12 rounded-xl font-bold', mode === v ? 'bg-neon text-black' : 'text-muted')}>{l}</button>)}
      </div>
      <Card>
        {mode === 'emom' && <>
          <p className="text-sm text-muted">Cada intervalo empiezas una tarea; lo que te sobre del tiempo es tu descanso. (Every Minute On the Minute)</p>
          <Opt label="DURACIÓN TOTAL (min)" value={c.minutes} opts={[5, 8, 10, 12, 15, 20]} onChange={(v) => set({ minutes: v })} />
          <Opt label="CADA" value={c.every} opts={[30, 45, 60, 90]} fmt={(v) => `${v} s`} onChange={(v) => set({ every: v })} />
          <label className="block mt-3"><span className="text-xs font-bold text-muted">REPETICIONES POR INTERVALO (OPCIONAL)</span><input inputMode="numeric" className={inputCls + ' mt-1'} placeholder="Ej. 8" value={c.reps} onChange={(e) => set({ reps: e.target.value.replace(/\D/g, '') })} /></label>
        </>}
        {mode === 'amrap' && <>
          <p className="text-sm text-muted">Haz tantas rondas como puedas dentro del tiempo. Anótalas con el botón +. (As Many Rounds As Possible)</p>
          <Opt label="DURACIÓN (min)" value={c.minutes} opts={[5, 8, 10, 12, 15, 20, 25]} onChange={(v) => set({ minutes: v })} />
        </>}
        {mode === 'tabata' && <>
          <p className="text-sm text-muted">Intervalos de máxima intensidad con descanso corto. El clásico es 8 rondas de 20 s de trabajo y 10 s de descanso.</p>
          <Opt label="RONDAS" value={c.rounds} opts={[4, 6, 8, 10, 12]} onChange={(v) => set({ rounds: v })} />
          <Opt label="TRABAJO (s)" value={c.work} opts={[20, 30, 40, 45]} onChange={(v) => set({ work: v })} />
          <Opt label="DESCANSO (s)" value={c.rest} opts={[10, 15, 20, 30]} onChange={(v) => set({ rest: v })} />
        </>}
        <ExList ids={c.ex} exMap={exMap} onAdd={() => setPicker(true)} onRemove={(id) => set({ ex: c.ex.filter((x) => x !== id) })} />
        <Button className="w-full mt-5 min-h-16 text-xl" onClick={() => { unlockAudio(); setRun(build()) }}><Play size={24} fill="black" /> Empezar · {dur}</Button>
      </Card>
      {picker && <ExercisePicker multi exercises={state.exercises} title="Ejercicios del intervalo" onClose={() => setPicker(false)} onDone={(ids) => { set({ ex: [...new Set([...c.ex, ...ids])] }); setPicker(false) }} />}
      {run && <Runner title={run.title} segments={run.segments} amrap={run.amrap} settings={S} saveAs={run.title} update={update} onClose={() => setRun(null)} />}
    </div>
  )
}
