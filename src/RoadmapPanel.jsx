import { useState } from 'react'
import { AlertTriangle, Check, ClipboardCheck, Flag } from 'lucide-react'
import { PHASES, SIGNALS, applyDeload, checkinDue, currentWeek, evaluate, phaseOf, taskDone, tasksFor, weekRange } from './roadmap'
import { dateKey, fmtDate } from './lib'
import { Button, Card, Sheet, cx, inputCls } from './ui'
import { coach, coachAlert } from './coach'

const num = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0 }

// Chequeo semanal: medidas, señales de fatiga y recomendaciones
export function CheckinSheet({ state, update, week, onClose }) {
  const rm = state.roadmap; const prev = rm.checkins?.[week]
  const last = [...state.measures].sort((a, b) => b.date.localeCompare(a.date))[0] || {}
  const [a, b] = weekRange(rm, week)
  const sessions = state.history.filter((h) => h.date >= a && h.date <= b).length
  const [f, setF] = useState({ weight: prev?.weight ?? last.weight ?? '', waist: prev?.waist ?? last.waist ?? '', steps: prev?.steps ?? '', sleep: prev?.sleep ?? '', fatigue: prev?.fatigue ?? [false, false, false, false], note: prev?.note ?? '' })
  const [result, setResult] = useState(null)
  const save = () => {
    const data = { date: dateKey(), weight: num(f.weight), waist: num(f.waist), steps: num(f.steps), sleep: num(f.sleep), workouts: sessions, fatigue: f.fatigue, note: f.note.trim() }
    const out = evaluate(state, week, data)
    update((s) => ({
      ...s,
      roadmap: { ...s.roadmap, checkins: { ...(s.roadmap.checkins || {}), [week]: data } },
      measures: data.weight || data.waist ? [{ id: `rm${week}`, date: data.date, weight: data.weight, waist: data.waist, bf: 0, steps: data.steps, sleep: data.sleep }, ...s.measures.filter((m) => m.id !== `rm${week}`)] : s.measures,
    }))
    setResult(out)
  }
  const F = ({ k, label, ph }) => <label className="block"><span className="text-xs font-bold text-muted">{label}</span><input inputMode="decimal" className={inputCls + ' mt-1'} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
  return (
    <Sheet open onClose={onClose} title={`Chequeo · semana ${week}`} footer={!result && <Button className="w-full" onClick={save}><Check size={22} strokeWidth={4} /> Guardar chequeo</Button>}>
      {result ? (
        <div className="space-y-3">
          <Card className="border-neon/40 text-center"><div className="text-3xl mb-1">✅</div><div className="font-black text-lg">Chequeo guardado</div><div className="text-sm text-muted">Entrenaste {sessions} día{sessions === 1 ? '' : 's'} esta semana.</div></Card>
          {result.map((r, i) => (
            <div key={i} className={cx('rounded-2xl border p-3 leading-snug', r.tone === 'warn' ? 'border-amber-400/50 bg-amber-400/10' : 'border-neon/40 bg-neon/10')}>
              {r.text}
              {r.deload && <Button className="w-full mt-3 !text-base" onClick={() => { update((s) => applyDeload(s)); onClose() }}>Aplicar descarga (−30 % de series) esta semana</Button>}
            </div>))}
          {!result.length && <p className="text-muted">Sin novedades: sigue con tu plan.</p>}
          <Button variant="secondary" className="w-full" onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <>
          <p className="text-muted mb-3">Mídete en las mismas condiciones cada semana (en ayunas, misma hora). Dura un minuto.</p>
          <div className="grid grid-cols-2 gap-3 mb-4">{F({ k: 'weight', label: 'Peso (kg)', ph: '0' })}{F({ k: 'waist', label: 'Cintura (cm)', ph: '0' })}{F({ k: 'steps', label: 'Pasos promedio/día', ph: '0' })}{F({ k: 'sleep', label: 'Sueño promedio (h)', ph: '0' })}</div>
          <div className="text-xs font-bold text-neon mb-2">¿TIENES SEÑALES DE FATIGA?</div>
          <div className="space-y-2 mb-4">{SIGNALS.map((s, i) => (
            <button key={s} onClick={() => setF((cur) => ({ ...cur, fatigue: cur.fatigue.map((x, j) => (j === i ? !x : x)) }))} className={cx('w-full text-left min-h-12 px-3 rounded-2xl border flex items-center gap-3', f.fatigue[i] ? 'border-amber-400 bg-amber-400/10' : 'border-line bg-surface')}>
              <span className={cx('size-6 rounded-md border-2 flex items-center justify-center shrink-0', f.fatigue[i] ? 'bg-amber-400 border-amber-400 text-black' : 'border-muted')}>{f.fatigue[i] && <Check size={16} strokeWidth={4} />}</span><span className="leading-tight">{s}</span></button>))}</div>
          <textarea className={inputCls + ' py-3 min-h-20'} placeholder="Notas de la semana (opcional)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </>)}
    </Sheet>
  )
}

export function RoadmapSection({ state, update }) {
  const rm = state.roadmap; const [check, setCheck] = useState(null)
  if (!rm) return (
    <Card>
      <p className="leading-snug mb-3">Un plan guiado de <b>12 semanas</b> en 4 fases: preparación, adaptación, progresión y consolidación. Cada semana tiene tareas (varias se marcan solas), un chequeo de peso y cintura, y te recomienda una <b>semana de descarga</b> si aparece fatiga.</p>
      <Button className="w-full" onClick={() => update((s) => ({ ...s, roadmap: { start: dateKey(), done: {}, checkins: {} } }))}><Flag size={20} /> Empezar hoy (semana 0)</Button>
    </Card>)
  const week = currentWeek(rm)
  if (week > 12) return <Card><div className="text-center"><div className="text-4xl mb-2">🏁</div><div className="text-xl font-black">¡Completaste las 12 semanas!</div><p className="text-muted mt-1">Compara tus fotos y medidas con la semana 0 y fija tu siguiente objetivo.</p><Button variant="secondary" className="w-full mt-3" onClick={async () => (await coach('¿Reiniciar la hoja de ruta?', { yes: 'Sí, reiniciar' })) && update((s) => ({ ...s, roadmap: null }))}>Reiniciar</Button></div></Card>
  const ph = phaseOf(week); const tasks = tasksFor(state, week); const done = tasks.filter((t) => taskDone(state, week, t)).length
  const due = checkinDue(state)
  const toggle = (t) => update((s) => { const k = `${week}:${t.id}`; return { ...s, roadmap: { ...s.roadmap, done: { ...(s.roadmap.done || {}), [k]: !s.roadmap.done?.[k] } } } })
  const cis = Object.entries(rm.checkins || {}).sort((a, b) => b[0] - a[0])
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-1"><div className="text-xs font-bold text-neon">{ph.weeks.toUpperCase()} · {ph.name.toUpperCase()}</div><div className="text-sm font-black">Semana {week}/12</div></div>
        <div className="h-2.5 rounded-full bg-surface2 overflow-hidden mb-2"><div className="h-full bg-neon rounded-full" style={{ width: `${(week / 12) * 100}%` }} /></div>
        <p className="text-sm text-muted">{ph.blurb}</p>
        <div className="grid grid-cols-4 gap-1.5 mt-3">{PHASES.map((p) => <div key={p.id} className={cx('rounded-xl py-1.5 text-center text-[10px] font-bold', p.id === ph.id ? 'bg-neon text-black' : 'bg-surface2 text-muted')}>{p.name}</div>)}</div>
      </Card>
      <Card>
        <div className="flex items-center justify-between mb-2"><div className="font-black">Tareas de esta semana</div><div className="text-sm text-muted">{done}/{tasks.length}</div></div>
        <div className="space-y-2">{tasks.map((t) => { const ok = taskDone(state, week, t)
          return <button key={t.id} disabled={!!t.auto} onClick={() => toggle(t)} className={cx('w-full text-left min-h-12 px-3 py-2 rounded-2xl border flex items-center gap-3', ok ? 'border-neon bg-neon/10' : 'border-line bg-surface2')}>
            <span className={cx('size-6 rounded-md border-2 flex items-center justify-center shrink-0', ok ? 'bg-neon border-neon text-black' : 'border-muted')}>{ok && <Check size={16} strokeWidth={4} />}</span>
            <span className="leading-tight flex-1">{t.label}</span>{t.auto !== undefined && <span className="text-[10px] font-bold text-muted shrink-0">AUTO</span>}</button> })}</div>
      </Card>
      <Button variant={due !== null ? 'primary' : 'secondary'} className="w-full" onClick={() => setCheck(week)}><ClipboardCheck size={22} /> {rm.checkins?.[week] ? 'Editar el chequeo de esta semana' : due !== null ? 'Hacer el chequeo semanal (pendiente)' : 'Hacer el chequeo semanal'}</Button>
      {cis.length > 0 && (
        <Card><div className="font-black mb-2">Chequeos anteriores</div>
          <div className="space-y-2">{cis.map(([w, c]) => (
            <div key={w} className="rounded-xl bg-surface2 p-2.5 text-sm"><div className="flex justify-between"><b>Semana {w}</b><span className="text-muted">{fmtDate(c.date)}</span></div>
              <div className="text-muted">{[c.weight && `${c.weight} kg`, c.waist && `${c.waist} cm`, `${c.workouts ?? 0} entrenos`, c.fatigue?.some(Boolean) && '⚠ fatiga'].filter(Boolean).join(' · ')}</div></div>))}</div></Card>)}
      <p className="text-[11px] text-muted flex gap-1.5"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> Es una guía general, no consejo médico. Si tienes dolor persistente o dudas de salud, consulta con un profesional.</p>
      <button className="text-sm text-muted font-semibold min-h-11" onClick={async () => (await coach('¿Reiniciar la hoja de ruta? Tus chequeos de esta hoja se borrarán.', { yes: 'Sí, reiniciar' })) && update((s) => ({ ...s, roadmap: null }))}>Reiniciar hoja de ruta</button>
      {check !== null && <CheckinSheet state={state} update={update} week={check} onClose={() => setCheck(null)} />}
    </div>
  )
}

// Aviso en "Entrenar hoy" cuando toca el chequeo
export function CheckinBanner({ state, update }) {
  const [open, setOpen] = useState(false)
  const w = checkinDue(state)
  if (w === null) return null
  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-left rounded-3xl border border-neon/50 bg-neon/10 p-4 mb-4 flex items-center gap-3">
        <ClipboardCheck size={26} className="text-neon shrink-0" /><span><span className="block font-black">Toca tu chequeo semanal</span><span className="block text-sm text-muted">Semana {w} de tu hoja de ruta · 1 minuto</span></span></button>
      {open && <CheckinSheet state={state} update={update} week={w} onClose={() => setOpen(false)} />}
    </>
  )
}
