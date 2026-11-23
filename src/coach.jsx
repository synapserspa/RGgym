import { useEffect, useState } from 'react'
import { useBackLayer } from './lib'

// Reemplaza los cuadros nativos del navegador (que muestran "synapserspa.github.io dice") por el cuadro de "Tu Coach Rod dice:".
let opener = null

export function coach(message, opts = {}) {
  return new Promise((resolve) => {
    if (!opener) return resolve(window.confirm(message)) // por si aún no se montó
    opener({ message, yes: opts.yes || 'Aceptar', no: opts.no || 'Cancelar', info: !!opts.info, resolve })
  })
}
export const coachAlert = (message) => coach(message, { info: true, yes: 'Entendido' })

export function CoachDialog() {
  const [d, setD] = useState(null)
  useEffect(() => { opener = (x) => setD(x); return () => { opener = null } }, [])
  const close = (v) => setD((cur) => { cur?.resolve(v); return null })
  useBackLayer(!!d, () => close(false))
  if (!d) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-5" role="dialog" aria-modal="true" aria-label="Tu Coach Rod dice">
      <div className="absolute inset-0 bg-black/75" onClick={() => !d.info && close(false)} />
      <div className="relative slide-up w-full max-w-sm rounded-3xl border border-neon/40 bg-[#101010] p-5 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <img src="./icons/icon-192.png" alt="" className="size-12 rounded-2xl border border-neon/50" />
          <div className="text-lg font-black text-neon leading-tight">Tu Coach Rod dice:</div>
        </div>
        <p className="text-lg leading-snug mb-5">{d.message}</p>
        <div className={d.info ? '' : 'grid grid-cols-2 gap-3'}>
          {!d.info && <button onClick={() => close(false)} className="min-h-14 rounded-2xl bg-surface2 border border-line font-bold">{d.no}</button>}
          <button onClick={() => close(true)} className="w-full min-h-14 rounded-2xl bg-neon text-black font-black">{d.yes}</button>
        </div>
      </div>
    </div>
  )
}
