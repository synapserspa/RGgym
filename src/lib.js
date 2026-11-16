import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_SETTINGS, SEED_EXERCISES, SEED_PLAN } from './data'

const KEY = 'metodoh.v1'

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)

// ---------- Fechas (siempre en hora local) ----------
export const pad = (n) => String(n).padStart(2, '0')
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const mondayOf = (d) => { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x }
export const DAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }
export const fmtDur = (s) => { const m = Math.round(s / 60); return m >= 60 ? `${Math.floor(m / 60)} h ${pad(m % 60)} min` : `${m} min` }
export const fmtNum = (n) => Math.round(n).toLocaleString('es-ES')
export const fmtDate = (k) => { const d = parseKey(k); return `${DAY_NAMES[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()}` }

// Primer número de un rango de reps ("8-12" -> 8, "12-20" -> 12)
export const repsStart = (r) => { const m = String(r).match(/\d+/); return m ? Number(m[0]) : 0 }

// ---------- Estado persistente ----------
function initialState() {
  return {
    exercises: SEED_EXERCISES,
    plan: SEED_PLAN,
    history: [],
    measures: [],      // { id, date, weight, waist, steps, sleep }
    habits: {},        // { 'YYYY-MM-DD': ['rutina', ...] }
    settings: DEFAULT_SETTINGS,
    active: null,      // entrenamiento en curso (persistido para sobrevivir recargas)
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    const s = JSON.parse(raw)
    return { ...initialState(), ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) } }
  } catch { return initialState() }
}

export function useStore() {
  const [state, setState] = useState(load)
  const [saveError, setSaveError] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); setSaveError(false) } catch { setSaveError(true) }
  }, [state])
  const update = useCallback((fn) => setState((s) => fn(s)), [])
  const replaceAll = useCallback((s) => setState({ ...initialState(), ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) } }), [])
  return { state, update, replaceAll, saveError }
}

// ---------- Imágenes: comprimir a JPEG base64 ----------
export function compressImage(file, max = 640, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}

// ---------- Sonido y vibración ----------
let audioCtx
export function beep(times = 3) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain()
      const t = audioCtx.currentTime + i * 0.28
      o.type = 'sine'; o.frequency.value = i === times - 1 ? 988 : 784
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.25)
    }
  } catch { /* sin audio */ }
}
// Desbloquea el audio con un gesto del usuario (necesario en móviles)
export function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
  } catch { /* noop */ }
}
export const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p) } catch { /* noop */ } }

// Mantener la pantalla encendida durante el entrenamiento
export function useWakeLock(on) {
  const ref = useRef(null)
  useEffect(() => {
    if (!on || !('wakeLock' in navigator)) return
    let cancelled = false
    const req = async () => { try { ref.current = await navigator.wakeLock.request('screen'); if (cancelled) ref.current.release() } catch { /* noop */ } }
    req()
    const onVis = () => document.visibilityState === 'visible' && req()
    document.addEventListener('visibilitychange', onVis)
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); try { ref.current?.release() } catch { /* noop */ } }
  }, [on])
}

// Reloj que se actualiza cada segundo (basado en timestamps para sobrevivir a segundo plano)
export function useNow(active = true, ms = 250) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [active, ms])
  return now
}

// ---------- Métricas ----------
export const sessionVolume = (sets) => sets.reduce((a, s) => a + (s.reps || 0) * (s.weight || 0), 0)
