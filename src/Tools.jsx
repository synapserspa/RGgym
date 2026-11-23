import { useMemo, useState } from 'react'
import { Chip, Card, Sheet, cx, inputCls } from './ui'

const num = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0 }
const r2 = (n) => Math.round(n * 100) / 100
const f = (n) => String(r2(n)).replace('.', ',')
export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]
const COLOR = { 25: '#ef4444', 20: '#3b82f6', 15: '#eab308', 10: '#22c55e', 5: '#e5e7eb', 2.5: '#6b7280', 1.25: '#a1a1aa' }

// Discos por lado para un peso objetivo
export function platesFor(target, bar, plates) {
  const per = (target - bar) / 2
  if (per < 0) return { error: `El peso objetivo es menor que la barra (${f(bar)} kg).` }
  const avail = [...plates].sort((a, b) => b - a)
  let rem = r2(per); const used = []
  for (const p of avail) while (rem + 1e-9 >= p) { used.push(p); rem = r2(rem - p) }
  const counts = avail.map((p) => ({ p, n: used.filter((x) => x === p).length })).filter((x) => x.n)
  return { per, used, counts, rem, exact: rem < 0.01, total: r2(bar + 2 * used.reduce((a, b) => a + b, 0)) }
}

function Plates({ state, update, initial }) {
  const S = state.settings; const bar = S.bar ?? 20; const plates = S.plates ?? ALL_PLATES
  const [target, setTarget] = useState(initial ? String(initial) : '')
  const t = num(target); const res = t > 0 ? platesFor(t, bar, plates) : null
  const set = (p) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }))
  return (
    <div className="space-y-3">
      <label className="block"><span className="text-xs font-bold text-muted">PESO TOTAL EN LA BARRA (kg)</span>
        <span className="block text-xs text-muted mt-0.5">Cuenta la barra más todos los discos. Si quieres levantar 85 kg en total, escribe 85 y te digo qué discos poner a cada lado.</span>
        <input inputMode="decimal" className={inputCls + ' mt-1 text-2xl font-black'} placeholder="Ej. 85" value={target} onChange={(e) => setTarget(e.target.value)} /></label>
      <div><div className="text-xs font-bold text-muted mb-1.5">BARRA</div>
        <div className="flex gap-2">{[10, 15, 20].map((b) => <Chip key={b} active={bar === b} onClick={() => set({ bar: b })}>{b} kg</Chip>)}</div></div>
      <div><div className="text-xs font-bold text-muted mb-1.5">DISCOS QUE TIENES</div>
        <div className="flex flex-wrap gap-2">{ALL_PLATES.map((p) => <Chip key={p} active={plates.includes(p)} onClick={() => set({ plates: plates.includes(p) ? plates.filter((x) => x !== p) : [...plates, p] })}>{f(p)}</Chip>)}</div></div>
      {res?.error && <Card className="border-amber-400/50 text-amber-200">{res.error}</Card>}
      {res && !res.error && (
        <Card className="border-neon/40">
          <div className="text-xs font-bold text-neon mb-2">POR CADA LADO</div>
          {res.counts.length ? (
            <>
              <div className="flex items-center justify-center gap-1 my-3 h-24">
                <div className="h-3 w-10 rounded bg-zinc-500" />
                {res.used.map((p, i) => <div key={i} className="rounded-sm border border-black/40" style={{ background: COLOR[p], width: p >= 10 ? 14 : 9, height: 30 + p * 2.6 }} title={`${f(p)} kg`} />)}
                <div className="h-3 w-6 rounded bg-zinc-400" />
              </div>
              <ul className="space-y-1">{res.counts.map(({ p, n }) => <li key={p} className="flex justify-between text-lg"><span className="font-black">{n} × {f(p)} kg</span><span className="text-muted">{f(p * n)} kg</span></li>)}</ul>
            </>
          ) : <p className="font-bold">Solo la barra.</p>}
          <div className="mt-3 pt-3 border-t border-line text-sm">Total real: <b className="text-neon">{f(res.total)} kg</b>{!res.exact && <span className="text-amber-300"> · faltan {f(res.rem * 2)} kg con tus discos (el más cercano posible)</span>}</div>
        </Card>)}
    </div>
  )
}

function OneRM() {
  const [w, setW] = useState(''); const [r, setR] = useState('')
  const W = num(w); const R = num(r)
  const ok = W > 0 && R >= 1 && R <= 12
  const epley = ok ? W * (1 + R / 30) : 0; const brz = ok && R < 37 ? (W * 36) / (37 - R) : 0
  const rm = ok ? (R === 1 ? W : (epley + brz) / 2) : 0
  const rows = useMemo(() => [[95, 2], [90, 4], [85, 6], [80, 8], [75, 10], [70, 12], [60, 15]].map(([p, reps]) => [p, reps, Math.round((rm * p) / 100 / 2.5) * 2.5]), [rm])
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Estima el máximo que levantarías en 1 repetición a partir de una serie dura (mejor entre 2 y 10 repeticiones).</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="text-xs font-bold text-muted">PESO (kg)</span><input inputMode="decimal" className={inputCls + ' mt-1'} value={w} onChange={(e) => setW(e.target.value)} placeholder="80" /></label>
        <label className="block"><span className="text-xs font-bold text-muted">REPETICIONES</span><input inputMode="numeric" className={inputCls + ' mt-1'} value={r} onChange={(e) => setR(e.target.value)} placeholder="6" /></label>
      </div>
      {R > 12 && <p className="text-sm text-amber-300">Con más de 12 repeticiones la estimación pierde precisión.</p>}
      {ok && (
        <Card className="border-neon/40">
          <div className="text-center"><div className="text-xs font-bold text-neon">TU 1RM ESTIMADO</div><div className="text-5xl font-black">{f(rm)} <span className="text-lg text-muted">kg</span></div></div>
          <div className="text-xs font-bold text-muted mt-4 mb-2">CARGAS DE TRABAJO</div>
          <div className="space-y-1.5">{rows.map(([p, reps, kgv]) => <div key={p} className={cx('flex justify-between rounded-xl bg-surface2 px-3 py-2', p >= 85 && 'border border-neon/40')}><span className="font-bold">{p} %</span><span>≈ {reps} reps</span><span className="font-black">{f(kgv)} kg</span></div>)}</div>
          <p className="text-xs text-muted mt-3">Para fuerza: 80-90 % en series de 3-6 repeticiones. Para volumen: 65-75 %.</p>
        </Card>)}
    </div>
  )
}

export function ToolsSheet({ state, update, onClose, initialWeight, initialTab = 'discos' }) {
  const [tab, setTab] = useState(initialTab)
  return (
    <Sheet open onClose={onClose} title="Herramientas">
      <div className="flex bg-surface rounded-2xl p-1 border border-line mb-4">
        {[['discos', 'Calculadora de discos'], ['1rm', 'Calculadora de 1RM']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={cx('flex-1 min-h-12 rounded-xl font-bold text-sm', tab === v ? 'bg-neon text-black' : 'text-muted')}>{l}</button>))}
      </div>
      {tab === 'discos' ? <Plates state={state} update={update} initial={initialWeight} /> : <OneRM />}
    </Sheet>
  )
}
