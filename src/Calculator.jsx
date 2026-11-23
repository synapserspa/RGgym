import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { goalOf } from './goals'
import { Card, Chip, cx, inputCls } from './ui'

const ACTIVITY = [
  [1.2, 'Sedentario', 'Poco o nada de ejercicio'],
  [1.375, 'Ligera', 'Ejercicio 1-3 días/semana'],
  [1.55, 'Moderada', 'Ejercicio 3-5 días/semana'],
  [1.725, 'Intensa', 'Ejercicio 6-7 días/semana'],
  [1.9, 'Muy intensa', 'Trabajo físico y ejercicio diario'],
]
// Ajuste sobre el gasto diario (negativo = déficit)
const ADJUST = [[-25, '−25 %'], [-20, '−20 %'], [-15, '−15 %'], [-10, '−10 %'], [0, 'Mantener'], [10, '+10 %']]
const num = (v) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0 }
const round = (n, d = 0) => { const k = 10 ** d; return Math.round(n * k) / k }
const fmt = (n) => Math.round(n).toLocaleString('es-ES')

// Categorías de % de grasa (referencia ACE)
const CATS = {
  h: [[6, 'Esencial'], [14, 'Atlético'], [18, 'Fitness'], [25, 'Promedio'], [100, 'Alto']],
  m: [[14, 'Esencial'], [21, 'Atlético'], [25, 'Fitness'], [32, 'Promedio'], [100, 'Alto']],
}

// Cálculo completo (puro): composición corporal + calorías + macros
export function calculate(c, goalId) {
  const male = c.sex !== 'm'; const age = num(c.age); const h = num(c.height); const w = num(c.weight)
  if (!(age > 0 && h > 0 && w > 0)) return null
  const bmi = w / (h / 100) ** 2
  // % de grasa: manual > perímetros (US Navy) > estimación por IMC (Deurenberg)
  let bf = null; let method = ''
  const neck = num(c.neck); const waist = num(c.waist); const hip = num(c.hip)
  if (num(c.bf) > 0) { bf = num(c.bf); method = 'dato que ingresaste' }
  else if (neck > 0 && waist > 0 && (male || hip > 0)) {
    const v = male ? waist - neck : waist + hip - neck
    if (v > 0) { bf = male ? 495 / (1.0324 - 0.19077 * Math.log10(v) + 0.15456 * Math.log10(h)) - 450 : 495 / (1.29579 - 0.35004 * Math.log10(v) + 0.221 * Math.log10(h)) - 450; method = 'perímetros (método US Navy)' }
  }
  if (bf == null) { bf = 1.2 * bmi + 0.23 * age - 10.8 * (male ? 1 : 0) - 5.4; method = 'estimación por IMC (Deurenberg)' }
  bf = Math.min(60, Math.max(3, bf))
  const known = !method.startsWith('estimación')
  const fat = (w * bf) / 100; const lean = w - fat
  const cat = (CATS[male ? 'h' : 'm'].find(([max]) => bf < max) || [0, '—'])[1]
  // Metabolismo basal: Katch-McArdle si el % de grasa es medido; si no, Mifflin-St Jeor
  const mifflin = 10 * w + 6.25 * h - 5 * age + (male ? 5 : -161)
  const rmb = known ? 370 + 21.6 * lean : mifflin
  const factor = ACTIVITY[c.act ?? 2][0]
  const ged = rmb * factor
  const g = goalOf(goalId).macros
  const pct = c.pct ?? g.pct
  const target = ged * (1 + pct / 100)
  const diff = ged - target // kcal de déficit por día (negativo = superávit)
  const weekly = (diff * 7) / 7700 // kg por semana
  const prot = c.prot ?? g.prot; const fatG = c.fat ?? g.fat
  const protG = w * prot; const fatGr = w * fatG
  const carbG = Math.max(0, (target - protG * 4 - fatGr * 9) / 4)
  const warnings = []
  if (pct <= -25) warnings.push('Un déficit de 25 % o más no es sostenible a medio plazo: úsalo solo en períodos cortos y, de preferencia, con un profesional.')
  if (diff > 0 && weekly / w > 0.01) warnings.push('Perderías más del 1 % de tu peso por semana: es demasiado rápido y puede costarte músculo y energía.')
  if (target < rmb) warnings.push('Tus calorías objetivo quedan por debajo de tu metabolismo basal. Sube un poco el objetivo.')
  // Tiempo estimado hasta un % de grasa objetivo
  let eta = null
  const t = num(c.target)
  if (t > 0 && t < bf && diff > 0) {
    const targetW = lean / (1 - t / 100); const kg = w - targetW
    eta = { kg: round(kg, 1), weeks: Math.ceil((kg * 7700) / (diff * 7)) }
  }
  return { bmi, bf, method, known, fat, lean, cat, rmb, mifflin, ged, target, pct, diff, weekly, protG, fatGr, carbG, prot, fatG, warnings, eta }
}

const Field = ({ label, children, hint }) => (
  <label className="block"><span className="block text-xs font-semibold text-muted mb-1">{label}</span>{children}{hint && <span className="block text-[11px] text-muted mt-1">{hint}</span>}</label>
)

export default function BodyCalculator({ state, update }) {
  const c = state.calc || {}
  const set = (p) => update((s) => ({ ...s, calc: { ...(s.calc || {}), ...p } }))
  const goal = goalOf(state.settings.goal)
  const r = useMemo(() => calculate(c, state.settings.goal), [c, state.settings.goal])
  const male = c.sex !== 'm'
  const inp = (k, ph, mode = 'decimal') => <input inputMode={mode} className={inputCls} placeholder={ph} value={c[k] ?? ''} onChange={(e) => set({ [k]: e.target.value })} />
  const pctSel = c.pct ?? goal.macros.pct
  return (
    <div className="space-y-3">
      <Card>
        <div className="flex gap-2 mb-3">
          <Chip active={male} onClick={() => set({ sex: 'h' })}>Hombre</Chip><Chip active={!male} onClick={() => set({ sex: 'm' })}>Mujer</Chip>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="Edad (años)">{inp('age', '30', 'numeric')}</Field>
          <Field label="Altura (cm)">{inp('height', '170', 'numeric')}</Field>
          <Field label="Peso (kg)">{inp('weight', '70')}</Field>
        </div>
        <div className="text-xs font-bold text-neon mt-4 mb-1">PERÍMETROS (OPCIONALES, PARA CALCULAR TU % DE GRASA)</div>
        <p className="text-[11px] text-muted mb-2">Cuello: justo sobre la nuez. Cintura: bajo la última costilla{!male ? '. Cadera: donde es más ancha' : ''}. Sin ellos se estima por tu IMC (menos preciso).</p>
        <div className={cx('grid gap-3 mb-3', male ? 'grid-cols-2' : 'grid-cols-3')}>
          <Field label="Cuello (cm)">{inp('neck', '38')}</Field>
          <Field label="Cintura (cm)">{inp('waist', '85')}</Field>
          {!male && <Field label="Cadera (cm)">{inp('hip', '100')}</Field>}
        </div>
        <Field label="¿Ya conoces tu % de grasa? (opcional)" hint="Si lo escribes, se usa en lugar de calcularlo.">{inp('bf', 'Ej. 18')}</Field>
      </Card>

      <Card>
        <div className="text-xs font-bold text-neon mb-2">NIVEL DE ACTIVIDAD</div>
        <div className="space-y-2">
          {ACTIVITY.map(([, name, desc], i) => (
            <button key={name} onClick={() => set({ act: i })} className={cx('w-full text-left rounded-2xl border px-3 py-2.5 flex items-center justify-between', (c.act ?? 2) === i ? 'border-neon bg-neon/10' : 'border-line bg-surface2')}>
              <span><span className="font-bold">{name}</span><span className="block text-xs text-muted">{desc}</span></span>{(c.act ?? 2) === i && <span className="text-neon font-black">✓</span>}
            </button>))}
        </div>
      </Card>

      <Card>
        <div className="text-xs font-bold text-neon mb-1">OBJETIVO CALÓRICO</div>
        <p className="text-xs text-muted mb-2">Ajuste sobre tu gasto diario. Para tu meta ({goal.name}) se sugiere {goal.macros.pct === 0 ? 'mantener' : `${goal.macros.pct > 0 ? '+' : '−'}${Math.abs(goal.macros.pct)} %`}. Lo habitual es un déficit de 10-25 %.</p>
        <div className="flex flex-wrap gap-2">{ADJUST.map(([v, l]) => <Chip key={v} active={pctSel === v} onClick={() => set({ pct: v })}>{l}</Chip>)}</div>
      </Card>

      {!r ? <Card><p className="text-muted">Escribe tu edad, altura y peso para ver tus resultados.</p></Card> : (
        <>
          <Card className="border-neon/40">
            <div className="text-xs font-bold text-neon mb-2">COMPOSICIÓN CORPORAL</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface2 rounded-2xl p-3 text-center col-span-2"><div className="text-4xl font-black text-neon">{round(r.bf, 1).toLocaleString('es-ES')} %</div><div className="text-sm font-bold">grasa corporal · {r.cat}</div><div className="text-[11px] text-muted mt-1">Método: {r.method}</div></div>
              <div className="bg-surface2 rounded-2xl p-3 text-center"><div className="text-2xl font-black">{round(r.fat, 1).toLocaleString('es-ES')} kg</div><div className="text-xs text-muted">masa grasa</div></div>
              <div className="bg-surface2 rounded-2xl p-3 text-center"><div className="text-2xl font-black">{round(r.lean, 1).toLocaleString('es-ES')} kg</div><div className="text-xs text-muted">masa magra</div></div>
              <div className="bg-surface2 rounded-2xl p-3 text-center col-span-2"><div className="text-xl font-black">IMC {round(r.bmi, 1).toLocaleString('es-ES')}</div><div className="text-[11px] text-muted">El IMC no distingue músculo de grasa: con buena masa muscular puede salir alto.</div></div>
            </div>
          </Card>

          <Card className="border-neon/40">
            <div className="text-xs font-bold text-neon mb-2">TUS CALORÍAS</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-surface2 rounded-2xl p-3 text-center"><div className="text-xl font-black">{fmt(r.rmb)}</div><div className="text-xs text-muted">metabolismo basal (kcal)</div></div>
              <div className="bg-surface2 rounded-2xl p-3 text-center"><div className="text-xl font-black">{fmt(r.ged)}</div><div className="text-xs text-muted">mantenimiento (kcal)</div></div>
              <div className="bg-neon text-black rounded-2xl p-3 text-center col-span-2"><div className="text-4xl font-black">{fmt(r.target)} kcal</div><div className="text-sm font-bold">objetivo diario {r.pct === 0 ? '(mantener)' : r.pct < 0 ? `(déficit de ${fmt(r.diff)} kcal)` : `(superávit de ${fmt(-r.diff)} kcal)`}</div></div>
            </div>
            {r.pct !== 0 && <p className="text-sm text-muted mb-2">Ritmo estimado: <b className="text-white">{r.weekly > 0 ? 'bajas' : 'subes'} ~{Math.abs(round(r.weekly, 2)).toLocaleString('es-ES')} kg por semana</b> ({Math.abs(round((r.weekly / num(c.weight)) * 100, 2)).toLocaleString('es-ES')} % de tu peso). Lo sano es 0,5-1 % por semana.</p>}
            {r.warnings.map((w, i) => <div key={i} className="flex gap-2 rounded-2xl border border-amber-400/50 bg-amber-400/10 p-3 text-sm mb-2"><AlertTriangle size={18} className="text-amber-300 shrink-0 mt-0.5" /><span>{w}</span></div>)}
            <div className="text-xs font-bold text-neon mt-3 mb-2">REPARTO SUGERIDO PARA TU META</div>
            <div className="grid grid-cols-3 gap-2">
              {[['Proteína', r.protG, '#38bdf8', `${r.prot} g/kg`], ['Grasa', r.fatGr, '#fbbf24', `${r.fatG} g/kg`], ['Carbohidratos', r.carbG, '#a3e635', 'el resto']].map(([l, v, col, sub]) => (
                <div key={l} className="bg-surface2 rounded-2xl p-2.5 text-center"><div className="text-xl font-black" style={{ color: col }}>{Math.round(v)} g</div><div className="text-[11px] font-bold">{l}</div><div className="text-[10px] text-muted">{sub}</div></div>))}
            </div>
            <div className="text-xs font-semibold text-muted mt-3 mb-1.5">Proteína (g/kg)</div>
            <div className="flex flex-wrap gap-2">{[1.2, 1.6, 1.8, 2.0, 2.2].map((d) => <Chip key={d} active={r.prot === d} onClick={() => set({ prot: d })}>{String(d).replace('.', ',')}</Chip>)}</div>
            <div className="text-xs font-semibold text-muted mt-3 mb-1.5">Grasa (g/kg)</div>
            <div className="flex flex-wrap gap-2">{[0.5, 0.8, 1.0].map((d) => <Chip key={d} active={r.fatG === d} onClick={() => set({ fat: d })}>{String(d).replace('.', ',')}</Chip>)}</div>
          </Card>

          <Card>
            <div className="text-xs font-bold text-neon mb-1">¿CUÁNTO TARDO EN LLEGAR A MI % DE GRASA?</div>
            <Field label="% de grasa objetivo (opcional)">{inp('target', `Menor a ${Math.floor(r.bf)}`)}</Field>
            {r.eta && <p className="mt-3">Perderías ~<b className="text-neon">{r.eta.kg.toLocaleString('es-ES')} kg</b> de grasa conservando tu masa magra: unas <b className="text-neon">{r.eta.weeks} semanas</b> con este déficit.</p>}
            {num(c.target) > 0 && !r.eta && <p className="mt-3 text-sm text-muted">Para estimarlo, tu objetivo debe ser menor que tu % actual y debes elegir un déficit.</p>}
          </Card>
          <p className="text-[11px] text-muted leading-snug px-1">Los resultados son estimaciones. Dependen de la exactitud de tus medidas. Si tienes una condición de salud o dudas, consulta con un profesional sanitario.</p>
        </>
      )}
    </div>
  )
}
