// Control de acceso del propietario.
//  · Interruptor remoto: estado.json (siempre se consulta el archivo oficial, también desde copias en otros sitios).
//  · Caducidad: si pasan 14 días sin validar con internet, pide conectarse.
//  · Refuerzos: primera apertura exige validar; las marcas se guardan en 3 lugares con control de integridad;
//    detecta reloj atrasado; y no funciona en dominios no autorizados.
// Aviso: todo esto corre en el navegador del usuario, así que frena el uso casual y las copias, pero no a alguien que modifique el código.
import { useCallback, useEffect, useState } from 'react'

const CANON_URL = 'https://synapserspa.github.io/RGgym/estado.json'
// Si algún día cambias el usuario o el dominio de GitHub Pages, agrégalo aquí o la app se bloqueará.
const ALLOWED_HOSTS = ['synapserspa.github.io', 'localhost', '127.0.0.1', '[::1]']
const DAYS = 14
const SALT = 'rod::gym::2026'
const K_LAST = 'metodoh.lastCheck'; const K_LOCK = 'metodoh.lock'; const K_SEEN = 'metodoh.seen'
const DEFAULT_MSG = 'Acceso suspendido lechón. Contacta al administrador.'

const hash = (s) => { let x = 2166136261; for (const c of s + SALT) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0 } return x.toString(36) }
const pack = (v) => `${v}|${hash(String(v))}`
const unpack = (raw) => {
  if (raw == null || raw === '') return null
  const i = raw.lastIndexOf('|')
  if (i < 0) return { v: raw, legacy: true }              // formato antiguo (sin firma)
  const v = raw.slice(0, i)
  return hash(v) === raw.slice(i + 1) ? { v } : { bad: true } // firma que no coincide = alguien tocó el dato
}

// ---- Almacenes: localStorage, cookie e IndexedDB
const ls = { get: (k) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* */ } } }
const ck = {
  get: (k) => { try { const m = document.cookie.split('; ').find((x) => x.startsWith(k + '=')); return m ? decodeURIComponent(m.slice(k.length + 1)) : null } catch { return null } },
  set: (k, v) => { try { document.cookie = v == null ? `${k}=; max-age=0; path=/; SameSite=Lax` : `${k}=${encodeURIComponent(v)}; max-age=31536000; path=/; SameSite=Lax` } catch { /* */ } },
}
const idbMem = {}
const idbOpen = () => new Promise((res, rej) => { try { const r = indexedDB.open('metodoh-sec', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) } catch (e) { rej(e) } })
const idbSet = async (k, v) => { try { const db = await idbOpen(); const tx = db.transaction('kv', 'readwrite'); v == null ? tx.objectStore('kv').delete(k) : tx.objectStore('kv').put(v, k) } catch { /* */ } }
const idbLoad = async () => { try { const db = await idbOpen(); for (const k of [K_LAST, K_LOCK, K_SEEN]) { idbMem[k] = await new Promise((res) => { const r = db.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => res(r.result ?? null); r.onerror = () => res(null) }) } } catch { /* */ } }

const readAll = (k) => [ls.get(k), ck.get(k), idbMem[k]].map(unpack).filter(Boolean)
const writeAll = (k, v) => { const p = v == null ? null : pack(v); ls.set(k, p); ck.set(k, p); idbMem[k] = p; idbSet(k, p) }

// ---- Estado a partir de lo guardado (funciona sin internet)
function status() {
  if (!ALLOWED_HOSTS.includes(location.hostname)) return { locked: true, kind: 'unauthorized', msg: 'Esta copia de la app no está autorizada. Usa la versión oficial.' }
  const locks = readAll(K_LOCK); const lasts = readAll(K_LAST); const seens = readAll(K_SEEN)
  const lock = locks.find((x) => x.v)
  if (lock) return { locked: true, kind: 'suspended', msg: lock.v }
  if ([...locks, ...lasts, ...seens].some((x) => x.bad)) return { locked: true, kind: 'tamper', msg: 'Se detectaron cambios en los datos de acceso. Conéctate a internet y toca Reintentar para validar.' }
  const nums = lasts.filter((x) => x.v).map((x) => Number(x.v)).filter(Boolean)
  if (!nums.length) return { locked: true, kind: 'activation', msg: 'Conéctate a internet para activar la app en este dispositivo.' }
  const now = Date.now(); const last = Math.min(...nums)
  const seen = Math.max(0, ...seens.filter((x) => x.v).map((x) => Number(x.v)))
  if (seen && now < seen - 36e5) return { locked: true, kind: 'expired', msg: 'La fecha de tu dispositivo parece atrasada. Corrígela y conéctate a internet para validar.' }
  if (now - last > DAYS * 864e5) return { locked: true, kind: 'expired', msg: `Acceso vencido: pasaron más de ${DAYS} días sin validar. Conéctate a internet para volver a usar la app.` }
  return { locked: false }
}
const touchSeen = () => { const prev = Math.max(0, ...readAll(K_SEEN).filter((x) => x.v).map((x) => Number(x.v))); writeAll(K_SEEN, Math.max(prev, Date.now())) }

// Consulta el estado.json oficial (sin caché). null = no se pudo validar (sin internet, 404, respuesta rara)
async function fetchEstado() {
  try {
    const url = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) ? './estado.json' : CANON_URL
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000)
    const r = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store', signal: ctl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const j = await r.json()
    return typeof j.activa === 'boolean' ? j : null
  } catch { return null }
}

export function useAccess() {
  const [st, setSt] = useState(() => { const s = status(); return s.kind === 'activation' ? { ...s, checking: true } : s })
  // Devuelve 'activa' | 'suspendida' | 'sin-conexion'
  const recheck = useCallback(async () => {
    setSt((s) => ({ ...s, checking: true }))
    const j = await fetchEstado()
    if (!j) { setSt({ ...status(), checking: false }); return 'sin-conexion' }
    if (j.activa) { writeAll(K_LOCK, null); writeAll(K_LAST, Date.now()); touchSeen(); setSt({ locked: false, checking: false }); return 'activa' }
    const msg = j.mensaje || DEFAULT_MSG
    writeAll(K_LOCK, msg); setSt({ locked: true, kind: 'suspended', msg, checking: false }); return 'suspendida'
  }, [])
  useEffect(() => {
    let alive = true
    idbLoad().then(() => { // reconstruye las marcas que falten desde los otros almacenes y vuelve a evaluar
      if (!alive) return
      for (const k of [K_LAST, K_LOCK, K_SEEN]) { const vals = readAll(k).filter((x) => x.v); if (vals.length) { const v = k === K_LOCK ? vals[0].v : k === K_SEEN ? Math.max(...vals.map((x) => Number(x.v))) : Math.min(...vals.map((x) => Number(x.v))); writeAll(k, v) } }
      setSt((cur) => (cur.kind === 'activation' && cur.checking ? cur : { ...status(), checking: cur.checking }))
    })
    touchSeen(); recheck()
    const iv = setInterval(recheck, 20 * 60 * 1000)
    const vis = () => { if (document.visibilityState === 'visible') { setSt((c) => (c.checking ? c : { ...status(), checking: false })); recheck() } }
    document.addEventListener('visibilitychange', vis)
    return () => { alive = false; clearInterval(iv); document.removeEventListener('visibilitychange', vis) }
  }, [recheck])
  return { ...st, recheck }
}
