import { useMemo, useRef, useState } from 'react'
import { Calculator, Volume2, Camera, ImagePlus, ChevronDown, ChevronUp, Download, Flame, Scale, Settings, Trash2, Upload, Trophy, ListChecks, Clock, Weight } from 'lucide-react'
import { HABITS, ZONE_COLOR } from './data'
import { SOUNDS, VOLUMES, playEnd, speak, unlockAudio } from './audio'
import { DAY_SHORT, addDays, compressImage, dateKey, fmtDate, fmtDur, fmtNum, mondayOf, uid } from './lib'
import { Button, Card, Chip, Empty, Header, Sheet, ZoneDot, cx, inputCls } from './ui'
import { GoalChip, GoalSheet } from './GoalPanel'
import { GuideButton, HabitInfoSheet, InfoButton, Method345, StandardsGuide, fmtSteps } from './Method'
import BodyCalculator from './Calculator'

const num = (v) => Number(String(v).replace(',', '.')) || 0

function VolumeChart({ data }) {
  if (!data.length) return null
  const max = Math.max(...data.map((d) => d.volume), 1)
  const W = 320, H = 110, bw = Math.min(28, (W - 10) / data.length - 6)
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="Volumen por sesión">
      {data.map((d, i) => {
        const h = Math.max(3, (d.volume / max) * H); const x = 5 + i * ((W - 10) / data.length) + 3
        return (
          <g key={d.id}>
            <rect x={x} y={H - h} width={bw} height={h} rx="5" fill={ZONE_COLOR[d.zones?.[0]] || '#39ff14'} />
            <text x={x + bw / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="#9a9a9a">{d.date.slice(8)}/{d.date.slice(5, 7)}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Section({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mb-3">
      <button onClick={() => setOpen(!open)} className="w-full min-h-16 px-4 rounded-3xl bg-surface border border-line flex items-center gap-3 font-black text-lg">
        <Icon size={22} className="text-neon" /><span className="flex-1 text-left">{title}</span>{open ? <ChevronUp /> : <ChevronDown />}
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  )
}

function Habits({ state, update }) {
  const k = dateKey(); const today = state.habits[k] || []
  const [info, setInfo] = useState(null); const [guide, setGuide] = useState(false); const [m345, setM345] = useState(false)
  const toggle = (id) => update((s) => { const cur = s.habits[k] || []; return { ...s, habits: { ...s.habits, [k]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] } } })
  const days = Array.from({ length: 7 }, (_, i) => addDays(mondayOf(new Date()), i))
  const weekDone = days.reduce((a, d) => a + (state.habits[dateKey(d)] || []).length, 0)
  const pct = Math.round((weekDone / (HABITS.length * 7)) * 100)
  return (
    <>
      <div className="space-y-2 mb-3">
        <GuideButton onClick={() => setGuide(true)} />
        <button onClick={() => setM345(true)} className="w-full min-h-14 rounded-2xl border border-line bg-surface px-4 flex items-center justify-between font-bold"><span>Mi Método 3-4-5</span><span className="text-neon text-sm">Abrir</span></button>
      </div>
      <div className="space-y-2 mb-3">
        {HABITS.map((h) => { const on = today.includes(h.id)
          return <div key={h.id} className="flex gap-2">
            <button onClick={() => toggle(h.id)} className={cx('flex-1 min-w-0 min-h-14 px-4 rounded-2xl border flex items-center gap-3 text-left font-semibold', on ? 'bg-neon/15 border-neon' : 'bg-surface border-line')}>
              <span className={cx('size-7 rounded-lg border-2 flex items-center justify-center shrink-0', on ? 'bg-neon border-neon text-black' : 'border-muted')}>{on && '✓'}</span><span className="leading-tight">{h.id === 'pasos' ? `${fmtSteps(state.settings.steps || 10000)} pasos` : h.label}</span></button>
            <InfoButton onClick={() => setInfo(h.id)} />
          </div> })}
      </div>
      <Card>
        <div className="flex justify-between text-sm text-muted mb-2"><span>Semana · {pct}% de casillas (80% = gran semana)</span></div>
        <div className="grid grid-cols-7 gap-1.5">{days.map((d, i) => { const n = (state.habits[dateKey(d)] || []).length
          return <div key={i} className="text-center"><div className="text-xs text-muted mb-1">{DAY_SHORT[i]}</div><div className="h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: `rgba(57,255,20,${n / HABITS.length * 0.8 + 0.05})`, color: n > HABITS.length / 2 ? '#000' : '#fff' }}>{n}</div></div> })}</div>
      </Card>
      {info && <HabitInfoSheet id={info} state={state} update={update} onClose={() => setInfo(null)} />}
      {guide && <StandardsGuide onClose={() => setGuide(false)} onOpen345={() => { setGuide(false); setM345(true) }} />}
      {m345 && <Method345 state={state} update={update} onClose={() => setM345(false)} />}
    </>
  )
}

function Measures({ state, update }) {
  const [f, setF] = useState({ weight: '', waist: '', steps: '', sleep: '' })
  const last = state.measures[0]
  const add = () => {
    if (!f.weight && !f.waist && !f.steps && !f.sleep) return
    update((s) => ({ ...s, measures: [{ id: uid(), date: dateKey(), weight: num(f.weight), waist: num(f.waist), steps: num(f.steps), sleep: num(f.sleep) }, ...s.measures] }))
    setF({ weight: '', waist: '', steps: '', sleep: '' })
  }
  const fields = [['weight', 'Peso (kg)'], ['waist', 'Cintura (cm)'], ['steps', 'Pasos/día'], ['sleep', 'Sueño medio (h)']]
  return (
    <>
      <Card className="mb-3">
        <div className="grid grid-cols-2 gap-3 mb-3">{fields.map(([k, l]) => (
          <label key={k} className="text-xs text-muted font-semibold">{l}<input inputMode="decimal" className={inputCls + ' mt-1'} placeholder={last?.[k] || '0'} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>))}</div>
        <Button className="w-full" onClick={add}>Guardar registro semanal</Button>
      </Card>
      <div className="space-y-2">{state.measures.slice(0, 12).map((m) => (
        <Card key={m.id} className="!p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0"><div className="font-bold">{fmtDate(m.date)}</div>
            <div className="text-sm text-muted">{[m.weight && `${m.weight} kg`, m.waist && `${m.waist} cm`, m.steps && `${fmtNum(m.steps)} pasos`, m.sleep && `${m.sleep} h`].filter(Boolean).join(' · ')}</div></div>
          <button aria-label="Borrar registro" onClick={() => update((s) => ({ ...s, measures: s.measures.filter((x) => x.id !== m.id) }))} className="size-11 rounded-xl bg-surface2 flex items-center justify-center text-muted"><Trash2 size={18} /></button>
        </Card>))}</div>
    </>
  )
}

function SettingsSheet({ state, update, replaceAll, onClose }) {
  const fileRef = useRef(); const [msg, setMsg] = useState(''); const [goalSheet, setGoalSheet] = useState(false)
  const bgGal = useRef(); const bgCam = useRef(); const sndRef = useRef()
  const pickSound = (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    if (f.size > 1.5 * 1024 * 1024) { setMsg('El audio pesa más de 1,5 MB: elige uno más corto ✖'); return }
    const r = new FileReader()
    r.onload = () => { setSet({ customSound: r.result, customSoundName: f.name, soundEnd: 'custom' }); setMsg('Sonido cargado ✔') }
    r.onerror = () => setMsg('No se pudo leer el audio ✖')
    r.readAsDataURL(f)
  }
  const setSet = (p) => update((s) => ({ ...s, settings: { ...s.settings, ...p } }))
  const pickBg = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    try { setSet({ bg: await compressImage(f, 1080, 0.6) }) } catch { setMsg('No se pudo cargar la imagen ✖') }
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'metodo-rod', version: 1, exportedAt: new Date().toISOString(), data: { ...state, active: null } })], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `metodo-rod-backup-${dateKey()}.json`; document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); setMsg('Copia de seguridad descargada ✔')
  }
  const importData = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
    try {
      const j = JSON.parse(await file.text()); const d = j.data || j
      if (!Array.isArray(d.exercises) || !Array.isArray(d.history) || !d.plan) throw new Error('formato')
      if (!confirm(`Se reemplazarán TODOS tus datos actuales por la copia (${d.history.length} entrenamientos, ${d.exercises.length} ejercicios). ¿Continuar?`)) return
      replaceAll({ ...d, active: null }); setMsg('Datos importados ✔')
    } catch { setMsg('Archivo no válido ✖') }
  }
  const reset = () => { if (confirm('¿Borrar TODOS los datos y volver a la configuración inicial? Esta acción no se puede deshacer.')) { replaceAll({}); setMsg('Datos restablecidos') } }
  const Toggle = ({ k, label }) => (
    <button onClick={() => update((s) => ({ ...s, settings: { ...s.settings, [k]: !s.settings[k] } }))} className="w-full min-h-14 px-4 rounded-2xl bg-surface border border-line flex items-center justify-between font-bold">
      {label}<span className={state.settings[k] ? 'text-neon' : 'text-muted'}>{state.settings[k] ? 'ON' : 'OFF'}</span></button>)
  const photos = state.exercises.filter((e) => e.img).length
  return (
    <Sheet open onClose={onClose} title="Configuración">
      <h3 className="text-sm font-bold text-muted mb-2">MI META</h3>
      <GoalChip goal={state.settings.goal} onClick={() => setGoalSheet(true)} className="mb-5" />
      {goalSheet && <GoalSheet state={state} update={update} onClose={() => setGoalSheet(false)} />}
      <h3 className="text-sm font-bold text-muted mb-2">TU NOMBRE</h3>
      <input className={inputCls + ' mb-5'} value={state.settings.name || ''} onChange={(e) => update((s) => ({ ...s, settings: { ...s.settings, name: e.target.value } }))} />
      <h3 className="text-sm font-bold text-muted mb-2">SONIDO DE AVISO</h3>
      <div className="text-xs text-muted font-semibold mb-1.5">Volumen</div>
      <div className="flex gap-2 flex-wrap mb-3">{VOLUMES.map(([v, l]) => <Chip key={v} active={state.settings.volume === v} onClick={() => setSet({ volume: v })}>{l}</Chip>)}</div>
      <div className="text-xs text-muted font-semibold mb-1.5">Sonido al terminar el descanso</div>
      <div className="flex gap-2 flex-wrap mb-3">
        {SOUNDS.map(([v, l]) => <Chip key={v} active={state.settings.soundEnd === v} onClick={() => setSet({ soundEnd: v })}>{l}</Chip>)}
        {state.settings.customSound && <Chip active={state.settings.soundEnd === 'custom'} onClick={() => setSet({ soundEnd: 'custom' })}>Mío</Chip>}
      </div>
      <input ref={sndRef} type="file" accept="audio/*" hidden onChange={pickSound} />
      <div className="grid grid-cols-2 gap-3 mb-2">
        <Button onClick={() => { unlockAudio(); playEnd(state.settings) }}><Volume2 size={20} /> Probar</Button>
        <Button variant="secondary" onClick={() => sndRef.current.click()}><Upload size={20} /> Cargar mío</Button>
      </div>
      {state.settings.customSound && <p className="text-sm text-muted mb-2">Sonido propio: <b className="text-white">{state.settings.customSoundName}</b> · <button className="text-red-400 font-semibold min-h-11" onClick={() => setSet({ customSound: null, customSoundName: '', soundEnd: state.settings.soundEnd === 'custom' ? 'alarma' : state.settings.soundEnd })}>quitar</button></p>}
      <div className="space-y-2 my-3">
        <Toggle k="sound" label="Sonido al terminar el descanso" />
        <Toggle k="ticks" label="Pitidos en los últimos 10 segundos" />
        <Toggle k="voice" label="Voz en la rutina automática" />
        <Toggle k="vibrate" label="Vibración" />
      </div>
      <Button variant="secondary" className="w-full mb-6" onClick={() => { unlockAudio(); speak('Prepárate para la siguiente serie.', { ...state.settings, voice: true }) }}>Probar voz</Button>

      <h3 className="text-sm font-bold text-muted mb-2">RUTINA AUTOMÁTICA</h3>
      {[['secPerRep', 'Segundos por repetición', [2, 3, 4, 5]], ['prepSec', 'Cuenta inicial (seg)', [5, 10, 15, 20]], ['extraChange', 'Tiempo extra al cambiar de ejercicio (seg)', [5, 10, 20, 30]]].map(([k, l, opts]) => (
        <div key={k} className="mb-3"><div className="text-xs text-muted font-semibold mb-1.5">{l}</div>
          <div className="flex gap-2 flex-wrap">{opts.map((v) => <Chip key={v} active={state.settings[k] === v} onClick={() => setSet({ [k]: v })}>{v}</Chip>)}</div></div>))}
      <div className="mb-6" />

      <h3 className="text-sm font-bold text-muted mb-2">FOTO DE FONDO</h3>
      {state.settings.bg && <div className="relative h-32 rounded-2xl overflow-hidden mb-3"><img src={state.settings.bg} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0" style={{ background: `rgba(10,10,10,${state.settings.bgDim})` }} /></div>}
      <input ref={bgGal} type="file" accept="image/*" hidden onChange={pickBg} />
      <input ref={bgCam} type="file" accept="image/*" capture="environment" hidden onChange={pickBg} />
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Button variant="secondary" onClick={() => bgGal.current.click()}><ImagePlus size={20} /> Galería</Button>
        <Button variant="secondary" onClick={() => bgCam.current.click()}><Camera size={20} /> Cámara</Button>
      </div>
      {state.settings.bg && <>
        <div className="text-xs text-muted font-semibold mb-1.5">Oscurecer fondo (para leer mejor)</div>
        <div className="flex gap-2 flex-wrap mb-2">{[[0.5, 'Poco'], [0.65, 'Medio'], [0.75, 'Más'], [0.88, 'Mucho']].map(([v, l]) => <Chip key={v} active={state.settings.bgDim === v} onClick={() => setSet({ bgDim: v })}>{l}</Chip>)}</div>
        <button className="text-red-400 font-semibold min-h-11" onClick={() => setSet({ bg: null })}>Quitar foto de fondo</button>
      </>}
      <div className="mb-5" />
      <h3 className="text-sm font-bold text-muted mb-2">DESCANSO PREDETERMINADO</h3>
      <div className="flex gap-2 flex-wrap mb-5">{[[0, 'Auto'], [60, '60s'], [90, '90s'], [120, '2 min'], [180, '3 min']].map(([v, l]) => (
        <Chip key={v} active={state.settings.rest === v} onClick={() => update((s) => ({ ...s, settings: { ...s.settings, rest: v } }))}>{l}</Chip>))}</div>
      <h3 className="text-sm font-bold text-muted mb-2">COPIA DE SEGURIDAD</h3>
      <p className="text-sm text-muted mb-3">Exporta todo (historial, rutinas, ejercicios y {photos} foto{photos === 1 ? '' : 's'}) a un archivo JSON. Guárdalo en tu nube o envíatelo.</p>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <Button variant="secondary" onClick={exportData}><Download size={20} /> Exportar</Button>
        <Button variant="secondary" onClick={() => fileRef.current.click()}><Upload size={20} /> Importar</Button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={importData} />
      {msg && <p className="text-center font-semibold text-neon my-2">{msg}</p>}
      <a href="./manual-usuario.pdf" download="Manual-Metodo-Rod.pdf" className="mt-6 min-h-14 px-5 rounded-2xl text-lg flex items-center justify-center gap-2 bg-surface2 text-white font-bold border border-line"><Download size={20} /> Descargar manual de usuario (PDF)</a>
      <Button variant="danger" className="w-full mt-3" onClick={reset}><Trash2 size={20} /> Borrar todos los datos</Button>
      <p className="text-xs text-muted mt-4 leading-snug">Metodo Rod. Información general, no consejo médico: consulta a un profesional si tienes lesiones o dudas de salud.</p>
    </Sheet>
  )
}

export default function Progress({ state, update, replaceAll, saveError }) {
  const [settings, setSettings] = useState(false); const [openId, setOpenId] = useState(null)
  const h = state.history
  const wk = dateKey(mondayOf(new Date()))
  const stats = useMemo(() => {
    const dates = new Set(h.map((x) => x.date)); let streak = 0
    for (let d = new Date(); ; d = addDays(d, -1)) { if (dates.has(dateKey(d))) streak++; else if (dateKey(d) !== dateKey()) break }
    return { total: h.length, week: h.filter((x) => x.date >= wk).length, volume: h.reduce((a, x) => a + x.volume, 0), streak }
  }, [h, wk])
  const chart = [...h].slice(0, 10).reverse()

  return (
    <div>
      <Header title="Progreso" subtitle="Lo que se mide, mejora"
        right={<button aria-label="Configuración" onClick={() => setSettings(true)} className="size-14 rounded-2xl bg-surface border border-line flex items-center justify-center"><Settings size={26} /></button>} />
      <div className="px-4 pb-4">
        {saveError && <div className="bg-red-600/20 border border-red-500 rounded-2xl p-3 mb-3 text-sm">⚠ No se pudo guardar (almacenamiento lleno). Exporta una copia y libera espacio quitando fotos.</div>}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[[Trophy, stats.total, 'Entrenamientos'], [Flame, stats.streak, 'Días seguidos'], [Clock, stats.week, 'Esta semana'], [Weight, fmtNum(stats.volume), 'Volumen total kg']].map(([Icon, v, l]) => (
            <Card key={l} className="!p-3.5"><Icon size={20} className="text-neon mb-1" /><div className="text-3xl font-black leading-none">{v}</div><div className="text-xs text-muted mt-1">{l}</div></Card>))}
        </div>
        {chart.length > 1 && <Card className="mb-4"><div className="text-sm font-bold text-muted mb-2">VOLUMEN POR SESIÓN (kg)</div><VolumeChart data={chart} /></Card>}

        <Section icon={ListChecks} title="Estándares de hoy"><Habits state={state} update={update} /></Section>
        <Section icon={Scale} title="Peso, cintura, pasos y sueño"><Measures state={state} update={update} /></Section>
        <Section icon={Calculator} title="Calculadora de déficit calórico y grasa corporal"><BodyCalculator state={state} update={update} /></Section>

        <h2 className="text-xl font-black mt-5 mb-3">Historial</h2>
        {!h.length && <Empty icon={Trophy} text="Aún no hay entrenamientos. ¡Completa el primero!" />}
        <div className="space-y-3">
          {h.map((s) => {
            const open = openId === s.id
            const byEx = s.sets.reduce((m, x) => { (m[x.name] = m[x.name] || []).push(x); return m }, {})
            return (
              <Card key={s.id} className="!p-0 overflow-hidden">
                <button className="w-full text-left p-4" onClick={() => setOpenId(open ? null : s.id)}>
                  <div className="flex justify-between items-start gap-2">
                    <div><div className="text-sm text-muted font-semibold">{fmtDate(s.date)}</div><div className="text-xl font-black">{s.label}</div></div>
                    {open ? <ChevronUp className="text-muted" /> : <ChevronDown className="text-muted" />}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted mt-1">{s.zones?.map((z) => <span key={z} className="flex items-center gap-1"><ZoneDot zone={z} size={8} />{z}</span>)}</div>
                  <div className="flex gap-4 mt-2 text-sm font-semibold"><span>⏱ {fmtDur(s.durationSec)}</span><span>🏋 {fmtNum(s.volume)} kg</span><span>{s.sets.length} series</span></div>
                  {s.notes && <div className="mt-2 text-sm italic text-neon/90">“{s.notes}”</div>}
                </button>
                {open && (
                  <div className="border-t border-line p-4 bg-black/30">
                    {Object.entries(byEx).map(([name, sets]) => (
                      <div key={name} className="mb-3"><div className="font-bold">{name}</div>
                        <div className="text-sm text-muted">{sets.map((x) => (x.reps ? `${x.reps}×${x.weight || 'pc'}` : '✓')).join('  ·  ')}</div></div>))}
                    <Button variant="danger" className="w-full min-h-12 mt-1 text-base" onClick={() => confirm('¿Eliminar esta sesión del historial?') && update((st) => ({ ...st, history: st.history.filter((x) => x.id !== s.id) }))}><Trash2 size={18} /> Eliminar sesión</Button>
                  </div>)}
              </Card>)
          })}
        </div>
      </div>
      {settings && <SettingsSheet state={state} update={update} replaceAll={replaceAll} onClose={() => setSettings(false)} />}
    </div>
  )
}
