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
    method: { goals: ['', '', ''], morning: ['', '', '', ''], morningDone: {}, tasks: {} }, // Método 3-4-5
    overrides: {},     // plan solo para una fecha concreta: { 'YYYY-MM-DD': {label,zones,items,rest} }
    history: [],
    measures: [],      // { id, date, weight, waist, steps, sleep }
    habits: {},        // { 'YYYY-MM-DD': ['rutina', ...] }
    settings: DEFAULT_SETTINGS,
    active: null,      // entrenamiento en curso (persistido para sobrevivir recargas)
  }
}

// Migración de datos guardados: actualiza nombres/instrucciones de ejercicios precargados (español latino)
const DATA_VERSION = 4
function migrate(s) {
  const out = { ...initialState(), ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) } }
  if ((s.dataVersion || 1) < DATA_VERSION) {
    const seed = Object.fromEntries(SEED_EXERCISES.map((e) => [e.id, e]))
    out.exercises = (out.exercises || []).map((e) => (!e.custom && seed[e.id] ? { ...e, name: seed[e.id].name, steps: seed[e.id].steps } : e))
  }
  if ((s.dataVersion || 1) < 3) { // ejercicios nuevos (calistenia) para quien ya tenía datos
    const have = new Set((out.exercises || []).map((e) => e.id))
    out.exercises = [...out.exercises, ...SEED_EXERCISES.filter((e) => !have.has(e.id))]
  }
  out.dataVersion = DATA_VERSION
  return out
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    return migrate(JSON.parse(raw))
  } catch { return initialState() }
}

export function useStore() {
  const [state, setState] = useState(load)
  const [saveError, setSaveError] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); setSaveError(false) } catch { setSaveError(true) }
  }, [state])
  const update = useCallback((fn) => setState((s) => fn(s)), [])
  const replaceAll = useCallback((s) => setState(migrate(s)), [])
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

// ---------- Vibración ----------
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

// ---------- Botón "atrás" del celular ----------
// Cada pantalla/hoja abierta apunta una entrada en el historial; "atrás" cierra la capa superior en vez de salir de la app.
// En la pantalla principal, el primer "atrás" avisa y el segundo (dentro de 2 s) sale.
const layers = []
let ignorePops = 0; let armed = false; let rootToast = null; let backReady = false

export function initBackNav(onRootBack) {
  rootToast = onRootBack
  if (backReady) return
  backReady = true
  history.replaceState({ root: 1 }, '')
  history.pushState({ sentinel: 1 }, '')
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) { ignorePops--; return }
    const top = layers.pop()
    if (top) { top.onClose(); return }
    if (armed) { armed = false; history.back(); return }
    armed = true; rootToast && rootToast()
    history.pushState({ sentinel: 1 }, '')
    setTimeout(() => { armed = false }, 2000)
  })
}

export function useBackLayer(open, onClose) {
  const ref = useRef(onClose); ref.current = onClose
  useEffect(() => {
    if (!open) return
    const layer = { onClose: () => ref.current() }
    layers.push(layer); history.pushState({ layer: layers.length }, '')
    return () => {
      const i = layers.indexOf(layer)
      if (i >= 0) { layers.splice(i, 1); ignorePops++; history.back() } // se cerró desde la interfaz: quitar su entrada
    }
  }, [open])
}

// ---------- Copia de seguridad (descarga un JSON con todos los datos) ----------
export function downloadBackup(state) {
  const blob = new Blob([JSON.stringify({ app: 'metodo-rod', version: 1, exportedAt: new Date().toISOString(), data: { ...state, active: null } })], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `metodo-rod-backup-${dateKey()}.json`
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
