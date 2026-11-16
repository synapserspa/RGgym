// Sonidos (generados con WebAudio, sin archivos), sonido propio del usuario y voz en español latino.

let ctx, master
const VOL = { normal: 0.7, alto: 1.2, maximo: 2.0 }
export const VOLUMES = [['normal', 'Normal'], ['alto', 'Alto'], ['maximo', 'Máximo']]
export const SOUNDS = [
  ['alarma', 'Alarma'], ['campana', 'Campana'], ['digital', 'Digital'], ['sirena', 'Sirena'], ['silbato', 'Silbato'],
]

const getCtx = () => { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); return ctx }

// Salida común: ganancia + compresor, para que el volumen suba sin distorsionar
function out(vol) {
  const c = getCtx()
  if (!master) {
    const comp = c.createDynamicsCompressor()
    comp.threshold.value = -20; comp.knee.value = 10; comp.ratio.value = 10; comp.attack.value = 0.002; comp.release.value = 0.2
    master = c.createGain(); master.connect(comp); comp.connect(c.destination)
  }
  master.gain.value = VOL[vol] ?? VOL.alto
  return master
}

// Debe llamarse dentro de un toque del usuario (los celulares bloquean el audio hasta entonces)
export function unlockAudio() {
  try {
    const c = getCtx()
    if (c.state !== 'running') c.resume()
    const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0)
    window.speechSynthesis?.getVoices()
  } catch { /* sin audio */ }
}

function tone({ f, f2, t = 0, d = 0.15, type = 'square', g = 0.5, vol }) {
  const c = getCtx(); if (c.state !== 'running') c.resume()
  const o = c.createOscillator(); const gn = c.createGain(); const t0 = c.currentTime + t
  o.type = type; o.frequency.setValueAtTime(f, t0)
  if (f2) o.frequency.linearRampToValueAtTime(f2, t0 + d)
  gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(g, t0 + 0.01)
  gn.gain.setValueAtTime(g, t0 + Math.max(0.01, d - 0.04)); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  o.connect(gn).connect(out(vol)); o.start(t0); o.stop(t0 + d + 0.02)
}

const BUILTIN = {
  alarma: (v) => { for (let i = 0; i < 4; i++) tone({ f: i % 2 ? 740 : 988, t: i * 0.32, d: 0.26, g: 0.7, vol: v }) },
  campana: (v) => { [1, 2.76, 5.4].forEach((m, i) => tone({ f: 660 * m, d: 1.6 / (i + 1), type: 'sine', g: 0.6 / (i + 1), vol: v })); tone({ f: 660, t: 0.7, d: 1.4, type: 'sine', g: 0.5, vol: v }) },
  digital: (v) => { [1000, 1000, 1000, 1500].forEach((f, i) => tone({ f, t: i * 0.18, d: 0.12, g: 0.7, vol: v })) },
  sirena: (v) => { tone({ f: 600, f2: 1300, d: 0.6, type: 'sawtooth', g: 0.5, vol: v }); tone({ f: 1300, f2: 600, t: 0.6, d: 0.6, type: 'sawtooth', g: 0.5, vol: v }) },
  silbato: (v) => { [0, 0.45].forEach((t) => tone({ f: 2700, f2: 3100, t, d: 0.35, type: 'triangle', g: 0.9, vol: v })) },
}

const bufCache = new Map()
async function playCustom(url, vol) {
  const c = getCtx(); if (c.state !== 'running') c.resume()
  const key = url.length + url.slice(-48)
  let buf = bufCache.get(key)
  if (!buf) { buf = await c.decodeAudioData(await (await fetch(url)).arrayBuffer()); bufCache.set(key, buf) }
  const src = c.createBufferSource(); src.buffer = buf; src.connect(out(vol)); src.start(); src.stop(c.currentTime + 8)
}

// Fin de descanso: el sonido que elija el usuario
export function playEnd(s) {
  try {
    if (s.soundEnd === 'custom' && s.customSound) return playCustom(s.customSound, s.volume).catch(() => BUILTIN.alarma(s.volume))
    ;(BUILTIN[s.soundEnd] || BUILTIN.alarma)(s.volume)
  } catch { /* sin audio */ }
}
// Pitidos de cuenta regresiva (últimos 10 s); los últimos 3 son más agudos y largos
export function playTick(left, s) { try { left <= 3 ? tone({ f: 1568, d: 0.18, g: 0.8, vol: s.volume }) : tone({ f: 1046, d: 0.09, g: 0.6, vol: s.volume }) } catch { /* */ } }
// Comienza la serie
export function playGo(s) { try { tone({ f: 1318, d: 0.12, g: 0.8, vol: s.volume }); tone({ f: 1760, t: 0.14, d: 0.3, g: 0.8, vol: s.volume }) } catch { /* */ } }
// Terminó la serie (modo automático)
export function playDone(s) { try { tone({ f: 880, d: 0.12, g: 0.8, vol: s.volume }); tone({ f: 660, t: 0.15, d: 0.2, g: 0.8, vol: s.volume }); tone({ f: 523, t: 0.35, d: 0.3, g: 0.8, vol: s.volume }) } catch { /* */ } }

// Voz en español latino (si el celular la tiene instalada)
export function speak(text, s) {
  try {
    if (!s?.voice || !window.speechSynthesis) return
    const synth = window.speechSynthesis; synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const vs = synth.getVoices()
    const v = vs.find((x) => /^es[-_](MX|US|419|CL|AR|CO|PE)/i.test(x.lang)) || vs.find((x) => /^es/i.test(x.lang))
    u.lang = v?.lang || 'es-MX'; if (v) u.voice = v
    u.rate = 1; u.volume = 1
    synth.speak(u)
  } catch { /* sin voz */ }
}
