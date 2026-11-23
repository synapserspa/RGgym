import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Pause, Play, SkipForward, X } from 'lucide-react'
import { playDone, playEnd, playGo, playTick, speak, unlockAudio } from './audio'
import { dateKey, fmtTime, uid, useBackLayer, useNow, useWakeLock, vibrate } from './lib'
import { coach } from './coach'
import { Button, cx } from './ui'

// Temporizador a pantalla completa: recorre una lista de segmentos { kind: 'prep'|'work'|'rest', dur, label, sub, speak, marks }
// Sirve para EMOM, AMRAP, Tabata, calentamiento y estiramientos. Usa los pitidos y la voz de la configuración.
export default function Runner({ title, segments, settings: S, amrap = false, saveAs, update, onClose }) {
  const total = useMemo(() => segments.reduce((a, x) => a + x.dur, 0), [segments])
  const starts = useMemo(() => { let c = 0; return segments.map((x) => { const s = c; c += x.dur; return s }) }, [segments])
  const [t0] = useState(() => Date.now())
  const [pausedAt, setPausedAt] = useState(null); const [pausedMs, setPausedMs] = useState(0); const [skipped, setSkipped] = useState(0)
  const [rounds, setRounds] = useState(0); const [saved, setSaved] = useState(false)
  const now = useNow(true, 200)
  useWakeLock(true)
  const tnow = pausedAt ?? now
  const el = Math.min(total, (tnow - t0 - pausedMs) / 1000 + skipped)
  const finished = el >= total
  let idx = segments.length - 1
  for (let i = 0; i < segments.length; i++) if (el < starts[i] + segments[i].dur) { idx = i; break }
  const seg = segments[idx]; const segEl = el - starts[idx]
  const remain = Math.max(0, Math.ceil(seg.dur - segEl))
  const next = segments[idx + 1]

  // Aviso al empezar cada segmento
  const lastIdx = useRef(-1)
  useEffect(() => {
    if (finished || lastIdx.current === idx) return
    lastIdx.current = idx
    if (seg.kind === 'work') { playGo(S); vibrate([150, 60, 150]) } else if (seg.kind === 'rest') { playDone(S); vibrate(200) }
    speak(seg.speak || seg.label, S)
  }, [idx, finished]) // eslint-disable-line
  // Pitidos de cuenta regresiva (últimos 3 s; en la preparación, últimos 5 s)
  const tickKey = useRef('')
  useEffect(() => {
    const lim = seg.kind === 'prep' ? 5 : 3
    if (pausedAt || finished || !S.ticks || remain < 1 || remain > lim || seg.dur <= lim) return
    const k = `${idx}:${remain}`; if (tickKey.current === k) return; tickKey.current = k
    playTick(remain, S); vibrate(remain <= 1 ? 120 : 40)
  }, [remain, idx, pausedAt, finished]) // eslint-disable-line
  // Avisos de tiempo restante (AMRAP): "Quedan 5 minutos"
  const spoken = useRef(new Set())
  useEffect(() => {
    if (pausedAt || finished || !seg.marks) return
    const m = seg.marks.find((x) => remain === x && !spoken.current.has(x)); if (m == null) return
    spoken.current.add(m); speak(m >= 60 ? `Quedan ${m / 60} minuto${m > 60 ? 's' : ''}.` : `Quedan ${m} segundos.`, S)
  }, [remain, pausedAt, finished]) // eslint-disable-line
  // Final
  const ended = useRef(false)
  useEffect(() => { if (finished && !ended.current) { ended.current = true; if (S.sound) playEnd(S); vibrate([300, 120, 300, 120, 500]); speak('Terminaste. Buen trabajo.', S) } }, [finished]) // eslint-disable-line

  const pause = () => { unlockAudio(); setPausedAt(Date.now()) }
  const resume = () => { unlockAudio(); setPausedMs((m) => m + (Date.now() - pausedAt)); setPausedAt(null) }
  const skip = () => setSkipped((k) => k + Math.max(0, seg.dur - segEl) + 0.01)
  const exit = async () => { if (finished || (await coach('¿Terminar este temporizador?', { yes: 'Sí, terminar', no: 'Seguir' }))) onClose() }
  useBackLayer(true, exit)

  const save = () => {
    if (!update || !saveAs) return
    update((s) => ({ ...s, history: [{ id: uid(), date: dateKey(), startedAt: t0, durationSec: Math.round(total), label: saveAs, zones: [], volume: 0, notes: amrap ? `${rounds} rondas` : '', sets: [] }, ...s.history] }))
    setSaved(true)
  }
  const color = seg.kind === 'rest' ? '#fbbf24' : seg.kind === 'prep' ? '#38bdf8' : '#39ff14'
  const R = 45

  return (
    <div className="fixed inset-0 z-[60] bg-bg flex flex-col">
      <div className="safe-top px-4 pt-3 pb-2 flex items-center justify-between gap-3">
        <button aria-label="Salir" onClick={exit} className="size-12 rounded-2xl bg-surface2 flex items-center justify-center shrink-0"><X size={24} /></button>
        <div className="text-center min-w-0"><div className="text-sm text-muted font-semibold truncate">{title}</div><div className="text-xl font-black tabular-nums">{fmtTime(Math.max(0, total - el))}</div></div>
        <div className="size-12" />
      </div>
      <div className="mx-4 h-2 rounded-full bg-surface2 overflow-hidden"><div className="h-full bg-neon" style={{ width: `${(el / total) * 100}%` }} /></div>

      {finished ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="size-28 rounded-full bg-neon flex items-center justify-center mb-5"><Check size={64} className="text-black" strokeWidth={4} /></div>
          <h2 className="text-4xl font-black mb-2">¡Terminaste!</h2>
          <p className="text-muted text-lg mb-6">{title} · {fmtTime(total)}{amrap ? ` · ${rounds} ronda${rounds === 1 ? '' : 's'}` : ''}</p>
          {saveAs && update && <Button variant="secondary" className="w-full mb-3" disabled={saved} onClick={save}>{saved ? 'Guardado en tu historial ✔' : 'Guardar en mi historial'}</Button>}
          <Button className="w-full min-h-16" onClick={onClose}>Listo</Button>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-5 text-center overflow-y-auto">
            <div className="text-sm font-black tracking-widest mb-1" style={{ color }}>{seg.kind === 'prep' ? 'PREPÁRATE' : seg.kind === 'rest' ? 'DESCANSO' : (seg.count ? `PASO ${seg.count}` : 'TRABAJA')}</div>
            <h2 className="text-3xl font-black leading-tight mb-3 max-w-sm">{seg.label}</h2>
            <div className="relative size-60 mb-4">
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" stroke="#2c2c2c" strokeWidth="6" />
                <circle cx="50" cy="50" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * R} strokeDashoffset={2 * Math.PI * R * (1 - Math.min(1, segEl / seg.dur))} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-7xl font-black tabular-nums">{fmtTime(remain)}</div>
            </div>
            {seg.sub && <p className="text-muted text-lg leading-snug max-w-sm mb-2">{seg.sub}</p>}
            {next && next.kind !== 'prep' && <p className="text-sm text-muted">Sigue: <b className="text-white">{next.label}</b></p>}
            {amrap && seg.kind === 'work' && (
              <div className="mt-5 flex items-center gap-4">
                <button aria-label="Quitar ronda" onClick={() => setRounds((r) => Math.max(0, r - 1))} className="size-16 rounded-2xl bg-surface2 text-3xl font-black">−</button>
                <div className="text-center w-28"><div className="text-5xl font-black text-neon">{rounds}</div><div className="text-xs text-muted">rondas</div></div>
                <button aria-label="Sumar ronda" onClick={() => { unlockAudio(); vibrate(40); setRounds((r) => r + 1) }} className="size-16 rounded-2xl bg-neon text-black text-3xl font-black">+</button>
              </div>)}
          </div>
          <div className="px-4 pt-2 pb-4 safe-bottom border-t border-line flex gap-3">
            <button onClick={pausedAt ? resume : pause} className={cx('flex-1 min-h-20 rounded-3xl text-2xl font-black flex items-center justify-center gap-3', pausedAt ? 'bg-amber-400 text-black' : 'bg-neon text-black')}>
              {pausedAt ? <><Play size={30} fill="black" /> REANUDAR</> : <><Pause size={30} /> PAUSAR</>}</button>
            {(!amrap || seg.kind === 'prep') && <button aria-label="Saltar" onClick={skip} className="size-20 shrink-0 rounded-3xl bg-surface2 flex items-center justify-center"><SkipForward size={28} /></button>}
          </div>
        </>)}
    </div>
  )
}
