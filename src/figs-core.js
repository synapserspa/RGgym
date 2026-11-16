// Dibujos esquemáticos (figura de palitos, vista lateral) de cada ejercicio: posición inicial y final.
// Cada pose se define con ángulos (grados, 0 = derecha, 90 = abajo, 270 = arriba) y se calcula con trigonometría.

const T = 26, UA = 13, FA = 12, TH = 21, SH = 21, FLOOR = 102
const rad = (d) => (d * Math.PI) / 180
const add = (p, len, deg) => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))]
const f1 = (n) => Math.round(n * 10) / 10
const line = (a, b, w, c, o = 1) => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`
const circ = (c, r, stroke, fill = 'none', w = 3) => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`

const EQ = '#8a93a5'

// ---------- Poses ----------
// p = cadera, t = tronco (cadera→hombro), ua/fa = brazo (hombro→codo→muñeca), th/sh = pierna (cadera→rodilla→pie)
// ua2/fa2, th2/sh2 = segundo brazo / pierna (más tenues); w = dónde va la pesa ('W' muñeca, 'S' hombro, 'P' cadera, 'F' pie)
// eq = elementos fijos: [x1,y1,x2,y2,grosor]; cable = punto de anclaje de la polea; rings = círculos [x,y,r]
const STAND = { p: [50, 60], t: 270, th: 90, sh: 90 }
const LYING = { p: [62, 72], t: 180, th: 25, sh: 90 }
const BENCH_FLAT = [[22, 78, 72, 78, 6], [30, 78, 30, FLOOR, 2], [64, 78, 64, FLOOR, 2]]
const INCL = { p: [66, 74], t: 225, th: 20, sh: 90 }
const BENCH_INCL = [[70, 80, 38, 49, 6], [68, 80, 68, FLOOR, 2], [50, 66, 46, FLOOR, 2]]

const POSES = {
  curl: [{ ...STAND, ua: 92, fa: 92, w: 'W' }, { ...STAND, ua: 88, fa: 300, w: 'W' }],
  press: [{ ...STAND, ua: 60, fa: 285, w: 'W' }, { ...STAND, ua: 272, fa: 272, w: 'W' }],
  lateral: [{ ...STAND, ua: 92, fa: 95, w: 'W' }, { ...STAND, ua: 5, fa: 0, w: 'W' }],
  bench: [{ ...LYING, ua: 100, fa: 272, w: 'W', eq: BENCH_FLAT }, { ...LYING, ua: 270, fa: 270, w: 'W', eq: BENCH_FLAT }],
  incline: [{ ...INCL, ua: 80, fa: 290, w: 'W', eq: BENCH_INCL }, { ...INCL, ua: 285, fa: 285, w: 'W', eq: BENCH_INCL }],
  flyDb: [{ ...LYING, ua: 112, fa: 112, w: 'W', eq: BENCH_FLAT }, { ...LYING, ua: 270, fa: 270, w: 'W', eq: BENCH_FLAT }],
  flyCable: [{ ...STAND, ua: 185, fa: 190, cable: [8, 8] }, { ...STAND, ua: 5, fa: 0, cable: [8, 8] }],
  dips: [{ p: [52, 77], t: 260, ua: 115, fa: 0, th: 80, sh: 200, eq: [[28, 62, 74, 62, 3]] }, { p: [50, 63], t: 270, ua: 92, fa: 90, th: 80, sh: 200, eq: [[28, 62, 74, 62, 3]] }],
  row: [{ p: [38, 62], t: 315, ua: 90, fa: 90, th: 100, sh: 88, w: 'W', eq: [[42, 66, 62, 46, 6], [52, 56, 52, FLOOR, 2]] }, { p: [38, 62], t: 315, ua: 150, fa: 100, th: 100, sh: 88, w: 'W', eq: [[42, 66, 62, 46, 6], [52, 56, 52, FLOOR, 2]] }],
  pullover: [{ p: [46, 60], t: 268, ua: 300, fa: 300, th: 90, sh: 90, cable: [30, 4] }, { p: [46, 60], t: 262, ua: 78, fa: 82, th: 90, sh: 90, cable: [30, 4] }],
  pulldown: [{ p: [50, 76], t: 265, ua: 275, fa: 275, th: 5, sh: 90, eq: [[40, 82, 66, 82, 5], [58, 68, 84, 68, 4]], cable: [50, 2] }, { p: [50, 76], t: 262, ua: 112, fa: 300, th: 5, sh: 90, eq: [[40, 82, 66, 82, 5], [58, 68, 84, 68, 4]], cable: [50, 2] }],
  squat: [{ ...STAND, ua: 125, fa: 300, w: 'S' }, { p: [40, 82], t: 300, ua: 125, fa: 300, th: 352, sh: 93, w: 'S' }],
  rdl: [{ ...STAND, ua: 95, fa: 90, w: 'W' }, { p: [38, 62], t: 335, ua: 90, fa: 90, th: 80, sh: 95, w: 'W' }],
  legpress: [{ p: [40, 80], t: 210, th: 300, sh: 20, eq: [[46, 86, 12, 68, 6], [72, 52, 74, 88, 5]] }, { p: [40, 80], t: 210, th: 330, sh: 330, eq: [[46, 86, 12, 68, 6], [78, 40, 80, 76, 5]] }],
  legcurl: [{ p: [50, 76], t: 180, th: 0, sh: 0, eq: [[18, 82, 80, 82, 6]], rings: [[92, 76, 3]] }, { p: [50, 76], t: 180, th: 0, sh: 300, eq: [[18, 82, 80, 82, 6]], rings: [[81.5, 57.8, 3]] }],
  calf: [{ ...STAND, ua: 92, fa: 92, eq: [[34, FLOOR + 3, 74, FLOOR + 3, 4]] }, { p: [50, 54], t: 270, th: 90, sh: 90, ua: 92, fa: 92, eq: [[34, FLOOR + 3, 74, FLOOR + 3, 4]] }],
  hipthrust: [{ p: [56, 96], t: 215, th: 300, sh: 90, w: 'P', eq: [[14, 88, 40, 88, 6], [20, 88, 20, FLOOR, 2]] }, { p: [56, 82], t: 190, th: 350, sh: 90, w: 'P', eq: [[14, 88, 40, 88, 6], [20, 88, 20, FLOOR, 2]] }],
  legext: [{ p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 90, eq: [[30, 76, 70, 76, 5], [38, 76, 42, 40, 5]] }, { p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 350, eq: [[30, 76, 70, 76, 5], [38, 76, 42, 40, 5]] }],
  pushdown: [{ ...STAND, ua: 90, fa: 280, w: 'W', cable: [62, 2] }, { ...STAND, ua: 90, fa: 92, w: 'W', cable: [62, 2] }],
  skull: [{ ...LYING, ua: 270, fa: 170, w: 'W', eq: BENCH_FLAT }, { ...LYING, ua: 270, fa: 270, w: 'W', eq: BENCH_FLAT }],
  crunch: [{ p: [60, 96], t: 185, th: 300, sh: 75, eq: [[10, FLOOR, 90, FLOOR, 2]] }, { p: [60, 96], t: 215, th: 300, sh: 75, ua: 240, fa: 200, eq: [[10, FLOOR, 90, FLOOR, 2]] }],
  legraise: [{ p: [50, 60], t: 270, ua: 270, fa: 270, th: 90, sh: 90, eq: [[28, 9, 72, 9, 4]] }, { p: [50, 60], t: 270, ua: 270, fa: 270, th: 0, sh: 0, eq: [[28, 9, 72, 9, 4]] }],
  walk: [{ p: [50, 60], t: 272, th: 60, sh: 95, th2: 108, sh2: 132, ua: 40, fa: 335, ua2: 135, fa2: 115 }, { p: [50, 60], t: 272, th: 108, sh: 132, th2: 60, sh2: 95, ua: 135, fa: 115, ua2: 40, fa2: 335 }],
  bike: [{ p: [40, 66], t: 300, ua: 20, fa: 10, th: 65, sh: 105, th2: 0, sh2: 80, rings: [[26, 88, 12], [78, 88, 12]], eq: [[26, 88, 44, 70, 2], [44, 70, 74, 66, 2], [74, 66, 78, 88, 2], [26, 88, 60, 88, 2], [34, 70, 48, 70, 4]] }, { p: [40, 66], t: 300, ua: 20, fa: 10, th: 5, sh: 80, th2: 65, sh2: 105, rings: [[26, 88, 12], [78, 88, 12]], eq: [[26, 88, 44, 70, 2], [44, 70, 74, 66, 2], [74, 66, 78, 88, 2], [26, 88, 60, 88, 2], [34, 70, 48, 70, 4]] }],
  rope: [{ ...STAND, ua: 60, fa: 30, eq: ropeArc(false) }, { p: [50, 50], t: 270, th: 90, sh: 90, ua: 60, fa: 30, eq: ropeArc(true) }],
}

function ropeArc(over) {
  const pts = []
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); const x = 50 + 30 * Math.cos(Math.PI - a); const y = over ? 62 - 66 * Math.sin(a) * 0.9 : 70 + 34 * Math.sin(a); pts.push([x, y]) }
  return pts.slice(1).map((q, i) => [pts[i][0], pts[i][1], q[0], q[1], 2])
}

// Ejercicio → patrón de dibujo
export const FIGURE_OF = {
  'press-inclinado': 'incline', 'press-banca': 'bench', 'aperturas-polea': 'flyCable', 'aperturas-mancuernas': 'flyDb', fondos: 'dips',
  'remo-apoyado': 'row', 'pullover-polea': 'pullover', 'jalon-pecho': 'pulldown',
  sentadilla: 'squat', 'peso-muerto-rumano': 'rdl', prensa: 'legpress', 'curl-femoral': 'legcurl', 'gemelos-pie': 'calf', 'hip-thrust': 'hipthrust',
  'extension-cuadriceps': 'legext', 'sentadilla-hack': 'squat', 'curl-femoral-sentado': 'legcurl', 'gemelos-sentado': 'calf',
  'press-militar': 'press', 'elevaciones-laterales': 'lateral', 'curl-biceps': 'curl', 'curl-martillo': 'curl', 'triceps-polea': 'pushdown', 'press-frances': 'skull',
  crunch: 'crunch', 'elevacion-piernas': 'legraise', caminata: 'walk', 'cinta-bici': 'bike', comba: 'rope',
}
// Si el ejercicio es creado por el usuario, se elige un dibujo según la zona
export const FIGURE_BY_ZONE = { Pecho: 'bench', Espalda: 'pulldown', Piernas: 'squat', Hombros: 'press', Brazos: 'curl', Abdomen: 'crunch', Cardio: 'walk' }

function frame(pose, color) {
  const far = color
  const P = pose.p; const S = add(P, T, pose.t); const head = add(S, 9, pose.t)
  const E = pose.ua != null ? add(S, UA, pose.ua) : null; const W = E ? add(E, FA, pose.fa) : null
  const K = add(P, TH, pose.th); const F = add(K, SH, pose.sh)
  const out = []
  ;(pose.eq || []).forEach(([x1, y1, x2, y2, w]) => out.push(line([x1, y1], [x2, y2], w || 3, EQ, 0.9)))
  ;(pose.rings || []).forEach(([x, y, r]) => out.push(circ([x, y], r, EQ, 'none', 2)))
  // extremidades del lado lejano (más tenues)
  if (pose.th2 != null) { const K2 = add(P, TH, pose.th2); out.push(line(P, K2, 5, far, 0.45), line(K2, add(K2, SH, pose.sh2), 5, far, 0.45)) }
  if (pose.ua2 != null) { const E2 = add(S, UA, pose.ua2); out.push(line(S, E2, 4, far, 0.45), line(E2, add(E2, FA, pose.fa2), 4, far, 0.45)) }
  if (pose.cable) out.push(line(pose.cable, W || S, 1.2, EQ, 0.9))
  out.push(line(P, K, 6, far), line(K, F, 6, far))
  out.push(line(P, S, 7, far))
  if (E) out.push(line(S, E, 4.5, '#fff'), line(E, W, 4.5, '#fff'))
  out.push(circ(head, 6.5, far, '#0e1116', 3))
  const wp = { W, S, P, F }[pose.w]
  if (wp) out.push(circ(wp, 5, '#fff', far, 2))
  return out.join('')
}

const FLOORLINE = (x0, x1) => `<line x1="${x0}" y1="${FLOOR + 3}" x2="${x1}" y2="${FLOOR + 3}" stroke="#2c3442" stroke-width="2" stroke-linecap="round"/>`

// SVG completo. compact = solo la posición final (para miniaturas)
export function figureSVG(id, zone, color, compact = false) {
  const key = FIGURE_OF[id] || FIGURE_BY_ZONE[zone] || 'walk'
  const [a, b] = POSES[key]
  if (compact) return `<svg viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${FLOORLINE(4, 96)}${frame(b, color)}</svg>`
  return `<svg viewBox="0 0 230 124" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    ${FLOORLINE(2, 100)}${FLOORLINE(130, 228)}
    <g transform="translate(0,0)">${frame(a, color)}</g>
    <g transform="translate(130,0)">${frame(b, color)}</g>
    <path d="M104 52 h14 m-5 -5 l5 5 l-5 5" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="50" y="121" text-anchor="middle" font-size="8" font-weight="700" fill="#9aa3b5" font-family="Inter,Arial">INICIO</text>
    <text x="180" y="121" text-anchor="middle" font-size="8" font-weight="700" fill="#9aa3b5" font-family="Inter,Arial">FINAL</text>
  </svg>`
}
export const FIGURE_KEYS = Object.keys(POSES)
export const poseKeyOf = (id, zone) => FIGURE_OF[id] || FIGURE_BY_ZONE[zone] || 'walk'
