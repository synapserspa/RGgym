import { useRef, useState } from 'react'
import { Camera, GitCompare, ImagePlus, Trash2 } from 'lucide-react'
import { LineChart } from './Charts'
import { compressImage, dateKey, fmtDate, parseKey, uid } from './lib'
import { Button, Card, Chip, Empty, Sheet, cx } from './ui'

const SERIES = [['weight', 'Peso', ' kg', '#39ff14'], ['waist', 'Cintura', ' cm', '#38bdf8'], ['bf', '% grasa', ' %', '#fbbf24']]

// Gráficos de peso, cintura y % de grasa
export function BodyCharts({ state }) {
  const [k, setK] = useState('weight')
  const [, label, unit, color] = SERIES.find((s) => s[0] === k)
  const data = [...state.measures].filter((m) => m[k] > 0).sort((a, b) => a.date.localeCompare(b.date))
  const pts = data.map((m) => ({ x: fmtDate(m.date), y: m[k] }))
  const diff = data.length > 1 ? data[data.length - 1][k] - data[0][k] : null
  return (
    <Card className="mb-3">
      <div className="flex gap-2 mb-2 overflow-x-auto no-scrollbar">{SERIES.map(([id, l]) => <Chip key={id} active={k === id} color={SERIES.find((s) => s[0] === id)[3]} onClick={() => setK(id)}>{l}</Chip>)}</div>
      <LineChart points={pts} unit={unit} color={color} />
      {diff != null && <p className="text-sm text-muted text-center">Desde tu primer registro: <b className="text-white">{diff > 0 ? '+' : ''}{diff.toLocaleString('es-ES', { maximumFractionDigits: 1 })}{unit}</b> en {label.toLowerCase()}.</p>}
    </Card>
  )
}

const KINDS = ['Frente', 'Perfil', 'Espalda']
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5)

// Fotos de progreso con comparación antes / después
export function PhotosSection({ state, update }) {
  const [kind, setKind] = useState('Frente'); const [busy, setBusy] = useState(false)
  const [view, setView] = useState(null); const [pick, setPick] = useState(false); const [sel, setSel] = useState([]); const [cmp, setCmp] = useState(null)
  const gal = useRef(); const cam = useRef()
  const photos = [...(state.photos || [])].sort((a, b) => b.date.localeCompare(a.date))
  const dates = [...new Set(photos.map((p) => p.date))]
  const mb = ((photos.reduce((a, p) => a + p.img.length, 0) * 0.75) / 1048576).toFixed(1)
  const add = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    setBusy(true)
    try { const img = await compressImage(f, 720, 0.6); update((s) => ({ ...s, photos: [{ id: uid(), date: dateKey(), kind, img }, ...(s.photos || [])] })) } catch { alert('No se pudo cargar la foto') }
    setBusy(false)
  }
  const tap = (p) => {
    if (!pick) return setView(p)
    const next = sel.includes(p.id) ? sel.filter((x) => x !== p.id) : [...sel, p.id].slice(-2)
    setSel(next)
    if (next.length === 2) { const [a, b] = next.map((id) => photos.find((x) => x.id === id)).sort((x, y) => x.date.localeCompare(y.date)); setCmp([a, b]); setPick(false); setSel([]) }
  }
  return (
    <>
      <Card className="mb-3">
        <div className="text-xs font-bold text-muted mb-2">NUEVA FOTO (HOY)</div>
        <div className="flex gap-2 mb-3">{KINDS.map((k) => <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k}</Chip>)}</div>
        <input ref={gal} type="file" accept="image/*" hidden onChange={add} /><input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={add} />
        <div className="grid grid-cols-2 gap-3"><Button variant="secondary" disabled={busy} onClick={() => gal.current.click()}><ImagePlus size={20} /> Galería</Button><Button variant="secondary" disabled={busy} onClick={() => cam.current.click()}><Camera size={20} /> Cámara</Button></div>
        <p className="text-[11px] text-muted mt-2">Misma luz, misma pose y misma hora del día para comparar mejor. Las fotos se quedan solo en tu celular ({photos.length} · ~{mb} MB).</p>
      </Card>
      {photos.length >= 2 && (
        <button onClick={() => { setPick(!pick); setSel([]) }} className={cx('w-full min-h-12 mb-3 rounded-2xl border font-bold flex items-center justify-center gap-2', pick ? 'border-neon bg-neon/10 text-neon' : 'border-line bg-surface')}>
          <GitCompare size={20} /> {pick ? `Toca 2 fotos para comparar (${sel.length}/2)` : 'Comparar dos fotos'}</button>)}
      {!photos.length && <Empty icon={Camera} text="Toma tu foto inicial: dentro de unas semanas la compararás." />}
      <div className="space-y-3">
        {dates.map((d) => (
          <div key={d}><div className="text-sm font-bold text-muted mb-1.5">{fmtDate(d)}</div>
            <div className="grid grid-cols-3 gap-2">{photos.filter((p) => p.date === d).map((p) => (
              <button key={p.id} onClick={() => tap(p)} className={cx('relative rounded-2xl overflow-hidden border-2 aspect-[3/4]', sel.includes(p.id) ? 'border-neon' : 'border-transparent')}>
                <img src={p.img} alt={p.kind} className="w-full h-full object-cover" /><span className="absolute bottom-1 left-1 text-[10px] font-black bg-black/70 rounded-full px-2 py-0.5">{p.kind}</span></button>))}</div></div>))}
      </div>
      {view && (
        <Sheet open onClose={() => setView(null)} title={`${view.kind} · ${fmtDate(view.date)}`}
          footer={<Button variant="danger" className="w-full" onClick={() => { if (confirm('¿Eliminar esta foto?')) { update((s) => ({ ...s, photos: s.photos.filter((p) => p.id !== view.id) })); setView(null) } }}><Trash2 size={20} /> Eliminar foto</Button>}>
          <img src={view.img} alt={view.kind} className="w-full rounded-2xl" />
        </Sheet>)}
      {cmp && (
        <Sheet open onClose={() => setCmp(null)} title="Antes y después">
          <div className="grid grid-cols-2 gap-2">{cmp.map((p, i) => <div key={p.id}><img src={p.img} alt={p.kind} className="w-full rounded-2xl" /><div className="text-center mt-1.5"><div className="text-xs font-black text-neon">{i === 0 ? 'ANTES' : 'DESPUÉS'}</div><div className="text-sm font-bold">{p.kind}</div><div className="text-xs text-muted">{fmtDate(p.date)}</div></div></div>)}</div>
          <p className="text-center text-muted mt-3">Pasaron <b className="text-white">{daysBetween(cmp[0].date, cmp[1].date)} días</b> entre las dos fotos.</p>
        </Sheet>)}
    </>
  )
}
