// Interruptor remoto del propietario (estado.json) + caducidad si pasan 14 días sin validar con internet.
import { useCallback, useEffect, useState } from 'react'

const LAST = 'metodoh.lastCheck'   // última validación exitosa
const LOCK = 'metodoh.lock'        // mensaje de bloqueo guardado (persiste aunque no haya internet)
const DAYS = 14
const DEFAULT_MSG = 'Acceso suspendido lechón. Contacta al administrador.'
const EXPIRED_MSG = `Acceso vencido: pasaron más de ${DAYS} días sin validar. Conéctate a internet para volver a usar la app.`

const rd = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const wr = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch { /* sin almacenamiento */ } }

// Estado según lo guardado en el dispositivo (funciona sin internet)
function localStatus() {
  const lock = rd(LOCK)
  if (lock) return { locked: true, msg: lock, kind: 'suspended' }
  const last = Number(rd(LAST)) || 0
  if (!last) { wr(LAST, String(Date.now())); return { locked: false } }
  const age = Date.now() - last
  if (age > DAYS * 864e5 || age < -36e5) return { locked: true, msg: EXPIRED_MSG, kind: 'expired' } // vencido o reloj atrasado
  return { locked: false }
}

// Consulta estado.json (sin caché). Devuelve null si no se pudo validar (sin internet, 404, respuesta rara)
async function fetchEstado() {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000)
    const r = await fetch(`./estado.json?t=${Date.now()}`, { cache: 'no-store', signal: ctl.signal })
    clearTimeout(t)
    if (!r.ok) return null
    const j = await r.json()
    return typeof j.activa === 'boolean' ? j : null
  } catch { return null }
}

export function useAccess() {
  const [st, setSt] = useState(localStatus)
  // Devuelve 'activa' | 'suspendida' | 'sin-conexion'
  const recheck = useCallback(async () => {
    const j = await fetchEstado()
    if (!j) { setSt(localStatus()); return 'sin-conexion' }
    if (j.activa) { wr(LOCK, null); wr(LAST, String(Date.now())); setSt({ locked: false }); return 'activa' }
    const msg = j.mensaje || DEFAULT_MSG
    wr(LOCK, msg); setSt({ locked: true, msg, kind: 'suspended' }); return 'suspendida'
  }, [])
  useEffect(() => {
    recheck()
    const iv = setInterval(recheck, 20 * 60 * 1000)
    const vis = () => document.visibilityState === 'visible' && recheck()
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', vis) }
  }, [recheck])
  return { ...st, recheck }
}
