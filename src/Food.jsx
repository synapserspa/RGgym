import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Utensils } from 'lucide-react'
import { calculate } from './Calculator'
import { addDays, dateKey, fmtDate, parseKey, uid } from './lib'
import { Button, Card, Sheet, cx, inputCls } from './ui'

const num = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0 }
const r0 = (n) => Math.round(n)
export const totalsOf = (list = []) => list.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, c: a.c + m.c, f: a.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 })

// Objetivos del día: salen de la calculadora; si no hay datos, quedan sin definir
export function foodTargets(state) {
  const r = calculate(state.calc || {}, state.settings.goal)
  return r ? { kcal: r.target, p: r.protG, c: r.carbG, f: r.fatGr } : null
}

const Bar = ({ label, value, target, color, unit = '' }) => {
  const pct = target ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-sm"><span className="font-bold" style={{ color }}>{label}</span><span className="text-muted"><b className="text-white">{r0(value)}</b>{target ? ` / ${r0(target)}` : ''}{unit}</span></div>
      <div className="h-2.5 rounded-full bg-surface2 overflow-hidden mt-1"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: value > target * 1.05 && target ? '#f87171' : color }} /></div>
    </div>
  )
}

// Tarjeta compacta (en Entrenar hoy)
export function FoodCard({ state, onOpen }) {
  const k = dateKey(); const t = totalsOf(state.food?.[k]); const tg = foodTargets(state)
  return (
    <button onClick={onOpen} className="w-full text-left rounded-3xl border border-line bg-surface p-4 mb-4">
      <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2 font-black"><Utensils size={18} className="text-neon" /> Nutrición de hoy</div><span className="text-neon text-sm font-bold">Registrar</span></div>
      {tg ? <><Bar label="Calorías" value={t.kcal} target={tg.kcal} color="#39ff14" /><Bar label="Proteína" value={t.p} target={tg.p} color="#38bdf8" unit=" g" /></>
        : <p className="text-sm text-muted">{t.kcal ? `${r0(t.kcal)} kcal · ${r0(t.p)} g de proteína registrados.` : 'Toca para registrar lo que comes. Completa la calculadora para ver tus objetivos.'}</p>}
    </button>
  )
}

export function FoodSheet({ state, update, onClose }) {
  const [day, setDay] = useState(dateKey())
  const [f, setF] = useState({ name: '', kcal: '', p: '', c: '', f: '', save: false })
  const list = state.food?.[day] || []; const t = totalsOf(list); const tg = foodTargets(state)
  const isToday = day === dateKey()
  const shift = (n) => setDay(dateKey(addDays(parseKey(day), n)))
  const add = (m) => update((s) => ({ ...s, food: { ...(s.food || {}), [day]: [...(s.food?.[day] || []), { id: uid(), name: m.name, kcal: m.kcal, p: m.p, c: m.c, f: m.f }] } }))
  const del = (id) => update((s) => ({ ...s, food: { ...s.food, [day]: (s.food?.[day] || []).filter((m) => m.id !== id) } }))
  const submit = () => {
    const m = { name: f.name.trim() || 'Comida', kcal: num(f.kcal), p: num(f.p), c: num(f.c), f: num(f.f) }
    if (!m.kcal && !m.p && !m.c && !m.f) return
    if (!m.kcal) m.kcal = r0(m.p * 4 + m.c * 4 + m.f * 9) // si solo pones macros, calcula las calorías
    add(m)
    if (f.save) update((s) => ({ ...s, meals: [{ id: uid(), ...m }, ...(s.meals || [])] }))
    setF({ name: '', kcal: '', p: '', c: '', f: '', save: false })
  }
  // Marca "Proteína objetivo alcanzada" cuando llegas al 95 % del objetivo de hoy
  useEffect(() => {
    if (!tg || !isToday || t.p < tg.p * 0.95) return
    update((s) => { const cur = s.habits[day] || []; return cur.includes('proteina') ? s : { ...s, habits: { ...s.habits, [day]: [...cur, 'proteina'] } } })
  }, [t.p]) // eslint-disable-line
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => { const k = dateKey(addDays(new Date(), i - 6)); return { k, kcal: totalsOf(state.food?.[k]).kcal } }), [state.food])
  const wmax = Math.max(1, tg?.kcal || 0, ...week.map((w) => w.kcal))
  const F = ({ k, label, ph }) => <label className="block"><span className="text-[11px] font-bold text-muted">{label}</span><input inputMode="decimal" className={inputCls + ' !min-h-12 mt-0.5'} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
  return (
    <Sheet open onClose={onClose} title="Mis comidas">
      <div className="flex items-center justify-between mb-3">
        <button aria-label="Día anterior" onClick={() => shift(-1)} className="size-12 rounded-2xl bg-surface border border-line flex items-center justify-center"><ChevronLeft /></button>
        <div className="text-center"><div className="font-black text-lg">{isToday ? 'Hoy' : fmtDate(day)}</div></div>
        <button aria-label="Día siguiente" disabled={isToday} onClick={() => shift(1)} className="size-12 rounded-2xl bg-surface border border-line flex items-center justify-center disabled:opacity-30"><ChevronRight /></button>
      </div>
      <Card className="mb-3">
        <Bar label="Calorías" value={t.kcal} target={tg?.kcal} color="#39ff14" unit=" kcal" />
        <Bar label="Proteína" value={t.p} target={tg?.p} color="#38bdf8" unit=" g" />
        <Bar label="Carbohidratos" value={t.c} target={tg?.c} color="#a3e635" unit=" g" />
        <Bar label="Grasa" value={t.f} target={tg?.f} color="#fbbf24" unit=" g" />
        {!tg && <p className="text-xs text-muted">Para ver tus objetivos, completa tus datos en Progreso → Calculadora de déficit calórico.</p>}
      </Card>

      {list.length > 0 && <div className="space-y-2 mb-4">{list.map((m) => (
        <div key={m.id} className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-3">
          <div className="min-w-0 flex-1"><div className="font-bold leading-tight">{m.name}</div><div className="text-xs text-muted">{r0(m.kcal)} kcal · P {r0(m.p)} · C {r0(m.c)} · G {r0(m.f)}</div></div>
          <button aria-label="Quitar" onClick={() => del(m.id)} className="size-11 rounded-xl bg-surface2 flex items-center justify-center text-muted"><Trash2 size={18} /></button></div>))}</div>}

      <div className="text-xs font-bold text-neon mb-2">COMIDAS FRECUENTES (TOCA PARA AGREGAR)</div>
      <div className="space-y-2 mb-4">
        {(state.meals || []).map((m) => (
          <div key={m.id} className="flex gap-2">
            <button onClick={() => add(m)} className="flex-1 min-w-0 text-left bg-surface2 rounded-2xl p-3 flex items-center gap-3">
              <Plus size={18} className="text-neon shrink-0" /><span className="min-w-0"><span className="block font-bold leading-tight">{m.name}</span><span className="block text-xs text-muted">≈ {r0(m.kcal)} kcal · P {r0(m.p)} · C {r0(m.c)} · G {r0(m.f)}</span></span></button>
            <button aria-label="Borrar comida frecuente" onClick={() => update((s) => ({ ...s, meals: s.meals.filter((x) => x.id !== m.id) }))} className="size-12 rounded-2xl bg-surface2 text-muted flex items-center justify-center shrink-0 self-center"><Trash2 size={16} /></button></div>))}
      </div>

      <div className="text-xs font-bold text-neon mb-2">AGREGAR OTRA COMIDA</div>
      <Card className="mb-4">
        <input className={inputCls + ' mb-3'} placeholder="¿Qué comiste? (opcional)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid grid-cols-4 gap-2 mb-3">{F({ k: 'kcal', label: 'Calorías', ph: '0' })}{F({ k: 'p', label: 'Prot. g', ph: '0' })}{F({ k: 'c', label: 'Carb. g', ph: '0' })}{F({ k: 'f', label: 'Grasa g', ph: '0' })}</div>
        <label className="flex items-center gap-2 text-sm mb-3"><input type="checkbox" className="size-5" checked={f.save} onChange={(e) => setF({ ...f, save: e.target.checked })} /> Guardar como comida frecuente</label>
        <Button className="w-full" onClick={submit}><Plus size={20} /> Agregar</Button>
      </Card>

      <div className="text-xs font-bold text-muted mb-2">ÚLTIMOS 7 DÍAS (kcal)</div>
      <div className="flex items-end gap-1.5 h-24">{week.map((w) => (
        <div key={w.k} className="flex-1 flex flex-col items-center justify-end h-full"><div className={cx('w-full rounded-t-lg', w.kcal ? 'bg-neon/80' : 'bg-surface2')} style={{ height: `${Math.max(4, (w.kcal / wmax) * 100)}%` }} /><div className="text-[10px] text-muted mt-1">{parseKey(w.k).getDate()}</div></div>))}</div>
      <p className="text-[11px] text-muted mt-3">Los valores de las comidas frecuentes son aproximados: ajusta las porciones a lo que realmente comes.</p>
    </Sheet>
  )
}
