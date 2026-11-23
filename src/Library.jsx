import { useRef, useState } from 'react'
import { Plus, Search, Camera, ImagePlus, Trash2, Pencil, Timer } from 'lucide-react'
import { LEVELS, ZONES, ZONE_COLOR } from './data'
import { compressImage, uid } from './lib'
import { PainBadge, PainSheet } from './PainPanel'
import { Button, Card, Chip, Empty, ExerciseImage, Field, Header, Sheet, ZoneDot, inputCls } from './ui'
import { coach, coachAlert } from './coach'

export function ExerciseDetail({ ex, onClose, onEdit, footer, state, update }) {
  const [pain, setPain] = useState(false)
  if (!ex) return null
  return (
    <Sheet open onClose={onClose} title={ex.name} footer={footer}>
      <ExerciseImage ex={ex} className="w-full h-52 mb-4" />
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1.5 rounded-full text-sm font-bold text-black" style={{ background: ZONE_COLOR[ex.zone] }}>{ex.zone}</span>
        <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-surface2">{ex.level}</span>
        {state?.pain?.[ex.id] && <PainBadge className="!text-xs !px-3 !py-1.5" />}
        {ex.rest > 0 && <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-surface2 flex items-center gap-1"><Timer size={14} />{ex.rest}s descanso</span>}
      </div>
      <h3 className="font-bold text-muted text-sm mb-2">EJECUCIÓN PASO A PASO</h3>
      <ol className="space-y-3 mb-4">
        {ex.steps.map((s, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="size-8 rounded-full bg-neon text-black font-black flex items-center justify-center shrink-0">{i + 1}</span>
            <span className="text-lg leading-snug pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
      {state && update && <Button variant="secondary" className="w-full mb-3" onClick={() => setPain(true)}>⚠ Me molesta · ver alternativas</Button>}
      {pain && <PainSheet ex={ex} state={state} update={update} onClose={() => setPain(false)} />}
      {onEdit && <Button variant="secondary" className="w-full" onClick={onEdit}><Pencil size={20} /> Editar / cambiar foto</Button>}
    </Sheet>
  )
}

function ExerciseForm({ initial, onSave, onDelete, onClose }) {
  const [f, setF] = useState(initial || { name: '', zone: 'Pecho', level: 'Principiante', rest: 90, sets: 3, reps: '8-12', rir: '1-2', steps: [''], img: null })
  const [busy, setBusy] = useState(false)
  const gal = useRef(); const cam = useRef()
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }))

  const pick = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setBusy(true)
    try { set('img', await compressImage(file)) } catch { coachAlert('No pude cargar esa imagen. Prueba con otra.') }
    setBusy(false)
  }
  const valid = f.name.trim().length > 0
  const save = () => onSave({ ...f, name: f.name.trim(), steps: f.steps.map((s) => s.trim()).filter(Boolean), rest: Number(f.rest) || 0, sets: Number(f.sets) || 3, id: f.id || uid(), custom: f.custom ?? true })

  return (
    <Sheet open onClose={onClose} title={initial ? 'Editar ejercicio' : 'Nuevo ejercicio'}
      footer={<div className="flex gap-3">
        {initial?.custom && <Button variant="danger" onClick={async () => (await coach('¿Eliminar este ejercicio? No se puede recuperar.', { yes: 'Sí, eliminar' })) && onDelete(f.id)} aria-label="Eliminar"><Trash2 size={22} /></Button>}
        <Button className="flex-1" disabled={!valid} onClick={save}>Guardar</Button>
      </div>}>
      <div className="mb-4">
        <ExerciseImage ex={f} className="w-full h-48" />
        <input ref={gal} type="file" accept="image/*" hidden onChange={pick} />
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button variant="secondary" disabled={busy} onClick={() => gal.current.click()}><ImagePlus size={22} /> Galería</Button>
          <Button variant="secondary" disabled={busy} onClick={() => cam.current.click()}><Camera size={22} /> Cámara</Button>
        </div>
        {f.img && <button className="text-red-400 font-semibold mt-2 min-h-11" onClick={() => set('img', null)}>Quitar foto</button>}
      </div>
      <Field label="Nombre"><input className={inputCls} value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Press con mancuernas" /></Field>
      <Field label="Zona muscular">
        <div className="flex flex-wrap gap-2">{ZONES.map((z) => <Chip key={z} active={f.zone === z} color={ZONE_COLOR[z]} onClick={() => set('zone', z)}>{z}</Chip>)}</div>
      </Field>
      <Field label="Dificultad">
        <div className="flex flex-wrap gap-2">{LEVELS.map((l) => <Chip key={l} active={f.level === l} onClick={() => set('level', l)}>{l}</Chip>)}</div>
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Series"><input className={inputCls} inputMode="numeric" value={f.sets} onChange={(e) => set('sets', e.target.value)} /></Field>
        <Field label="Reps"><input className={inputCls} value={f.reps} onChange={(e) => set('reps', e.target.value)} /></Field>
        <Field label="Descanso s"><input className={inputCls} inputMode="numeric" value={f.rest} onChange={(e) => set('rest', e.target.value)} /></Field>
      </div>
      <Field label="Instrucciones (un paso por casilla)">
        <div className="space-y-2">
          {f.steps.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} value={s} placeholder={`Paso ${i + 1}`} onChange={(e) => set('steps', f.steps.map((x, j) => (j === i ? e.target.value : x)))} />
              {f.steps.length > 1 && <button aria-label="Quitar paso" className="size-14 rounded-2xl bg-surface2 shrink-0 text-xl" onClick={() => set('steps', f.steps.filter((_, j) => j !== i))}>×</button>}
            </div>
          ))}
          <Button variant="ghost" className="min-h-11 px-0" onClick={() => set('steps', [...f.steps, ''])}><Plus size={20} /> Agregar paso</Button>
        </div>
      </Field>
    </Sheet>
  )
}

// Selector reutilizable de ejercicios (usado también por el planificador)
export function ExercisePicker({ exercises, onPick, onClose, title = 'Elegir ejercicio', multi = false, onDone }) {
  const [zone, setZone] = useState('Todos'); const [q, setQ] = useState(''); const [sel, setSel] = useState([])
  const list = exercises.filter((e) => (zone === 'Todos' || e.zone === zone) && e.name.toLowerCase().includes(q.toLowerCase()))
  const toggle = (e) => (multi ? setSel((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id])) : onPick(e))
  return (
    <Sheet open onClose={onClose} title={title}
      footer={multi && <Button className="w-full" disabled={!sel.length} onClick={() => onDone(sel)}>Agregar {sel.length || ''} ejercicio{sel.length === 1 ? '' : 's'}</Button>}>
      <input className={inputCls + ' mb-3'} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-5 px-5">
        {['Todos', ...ZONES].map((z) => <Chip key={z} active={zone === z} color={ZONE_COLOR[z]} onClick={() => setZone(z)}>{z}</Chip>)}
      </div>
      <div className="space-y-2">
        {list.map((e) => (
          <button key={e.id} onClick={() => toggle(e)} className={'w-full flex items-center gap-3 p-2 rounded-2xl border text-left ' + (sel.includes(e.id) ? 'border-neon bg-neon/10' : 'border-line bg-surface')}>
            <ExerciseImage ex={e} compact className="size-16 shrink-0" />
            <div className="min-w-0"><div className="font-bold text-lg leading-tight">{e.name}</div><div className="text-muted text-sm flex items-center gap-1.5"><ZoneDot zone={e.zone} />{e.zone} · {e.level}</div></div>
          </button>
        ))}
        {!list.length && <Empty text="Sin resultados" />}
      </div>
    </Sheet>
  )
}

export default function Library({ state, update }) {
  const [zone, setZone] = useState('Todos'); const [q, setQ] = useState('')
  const [detail, setDetail] = useState(null); const [form, setForm] = useState(null)
  const { exercises } = state
  const list = exercises.filter((e) => (zone === 'Todos' || (zone === 'Calistenia' ? e.cali : e.zone === zone)) && e.name.toLowerCase().includes(q.toLowerCase()))

  const save = (ex) => {
    update((s) => ({ ...s, exercises: s.exercises.some((e) => e.id === ex.id) ? s.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...s.exercises, ex] }))
    setForm(null); setDetail(null)
  }
  const remove = (id) => { update((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) })); setForm(null); setDetail(null) }

  return (
    <div>
      <Header title="Ejercicios" subtitle={`${exercises.length} ejercicios`}
        right={<button aria-label="Nuevo ejercicio" onClick={() => setForm('new')} className="size-14 rounded-2xl bg-neon text-black flex items-center justify-center"><Plus size={30} strokeWidth={3} /></button>} />
      <div className="px-4">
        <div className="relative mb-3">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input className={inputCls + ' pl-12'} placeholder="Buscar ejercicio…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
          {['Todos', 'Calistenia', ...ZONES].map((z) => <Chip key={z} active={zone === z} color={ZONE_COLOR[z]} onClick={() => setZone(z)}>{z}</Chip>)}
        </div>
        <div className="grid grid-cols-2 gap-3 pb-4">
          {list.map((e) => (
            <button key={e.id} onClick={() => setDetail(e)} className="text-left bg-surface border border-line rounded-3xl p-2.5">
              <ExerciseImage ex={e} className="w-full h-28" />
              <div className="px-1 pt-2">
                <div className="font-bold leading-tight min-h-10 line-clamp-2">{e.name}</div>{state.pain?.[e.id] && <PainBadge />}
                <div className="text-sm text-muted mt-1 flex items-center gap-1.5"><ZoneDot zone={e.zone} />{e.zone}{e.custom && <span className="ml-auto text-neon text-xs font-bold">MÍO</span>}</div>
              </div>
            </button>
          ))}
        </div>
        {!list.length && <Empty text="No hay ejercicios con ese filtro" />}
      </div>
      <ExerciseDetail ex={detail} state={state} update={update} onClose={() => setDetail(null)} onEdit={() => { setForm(detail) }} />
      {form && <ExerciseForm initial={form === 'new' ? null : form} onSave={save} onDelete={remove} onClose={() => setForm(null)} />}
    </div>
  )
}
