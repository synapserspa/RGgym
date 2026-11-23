// Dibujos esquemáticos de cada ejercicio: posición inicial y final, con la posición inicial "fantasma" y una flecha
// que muestra hacia dónde se mueve. Figura de palitos en vista lateral (o frontal cuando se entiende mejor).
// Ángulos en grados: 0 = derecha, 90 = abajo, 180 = izquierda, 270 = arriba.

const T = 26, UA = 13, FA = 12, TH = 21, SH = 21, FLOOR = 102
const rad = (d) => (d * Math.PI) / 180
const add = (p, len, deg) => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))]
const f1 = (n) => Math.round(n * 10) / 10
const line = (a, b, w, c, o = 1, dash = '') => `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" opacity="${o}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
const circ = (c, r, stroke, fill = 'none', w = 3) => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`
const EQ = '#8a93a5'

// ---------- Poses laterales ----------
// p = cadera, t = tronco (cadera→hombro), ua/fa = brazo, th/sh = pierna, fo = pie (por defecto perpendicular a la pierna)
// ua2/fa2, th2/sh2 = segundo brazo/pierna (más tenues). w = pesa en 'W' muñeca, 'S' hombro, 'P' cadera
// eq = elementos fijos [x1,y1,x2,y2,grosor]; rings = círculos [x,y,r]; cable = punto de anclaje de la polea
const STAND = { p: [50, 60], t: 270, th: 90, sh: 90 }
const LYING = { p: [62, 72], t: 180, th: 25, sh: 90 }
const BENCH_FLAT = [[22, 78, 72, 78, 6], [30, 78, 30, FLOOR, 2], [64, 78, 64, FLOOR, 2]]
const INCL = { p: [66, 74], t: 225, th: 20, sh: 90 }
const BENCH_INCL = [[70, 80, 38, 49, 6], [68, 80, 68, FLOOR, 2], [50, 66, 46, FLOOR, 2]]
const ROW_BENCH = [[42, 66, 62, 46, 6], [52, 56, 52, FLOOR, 2]]
const HIP_BENCH = [[14, 88, 40, 88, 6], [20, 88, 20, FLOOR, 2]]
const SEAT_PD = [[40, 82, 66, 82, 5], [58, 68, 84, 68, 4]]
const SEAT_LE = [[30, 76, 70, 76, 5], [38, 76, 42, 40, 5]]
const PRONE = [[18, 82, 80, 82, 6], [24, 82, 24, FLOOR, 2], [74, 82, 74, FLOOR, 2]]
const FLOORLN = [[10, FLOOR, 90, FLOOR, 2]]
const STEP = [[34, FLOOR + 3, 74, FLOOR + 3, 5], [40, FLOOR + 3, 40, FLOOR + 3, 1]]
const BAR_PU = [[28, 9, 72, 9, 4]]

const PU_BENCH = [[52, 91, 92, 91, 6], [56, 91, 56, 102, 2], [88, 91, 88, 102, 2]]
const PU_BAR = [[28, 18, 72, 18, 4]]
const IR_BAR = [[56, 70, 88, 70, 4], [58, 70, 58, 102, 2], [86, 70, 86, 102, 2]]
const BG_BENCH = [[2, 86, 24, 86, 6], [8, 86, 8, 102, 2]]
const DB_BENCH = [[8, 82, 44, 82, 6], [14, 82, 14, 102, 2], [38, 82, 38, 102, 2]]
const BD_BENCH = [[2, 80, 40, 80, 6], [8, 80, 8, 102, 2], [34, 80, 34, 102, 2]]

const POSES = {
  curl: { track: 'W', cap: 'De pie · sube la pesa doblando el codo', a: { ...STAND, ua: 92, fa: 92, w: 'W' }, b: { ...STAND, ua: 88, fa: 300, w: 'W' } },
  press: { track: 'W', cap: 'De pie · empuja la pesa sobre la cabeza', a: { ...STAND, ua: 60, fa: 285, w: 'W' }, b: { ...STAND, ua: 272, fa: 272, w: 'W' } },
  bench: { track: 'W', cap: 'Acostado en banco plano · empuja hacia arriba', a: { ...LYING, ua: 100, fa: 272, w: 'W', eq: BENCH_FLAT }, b: { ...LYING, ua: 270, fa: 270, w: 'W', eq: BENCH_FLAT } },
  incline: { track: 'W', cap: 'Banco inclinado · empuja hacia arriba', a: { ...INCL, ua: 80, fa: 290, w: 'W', eq: BENCH_INCL }, b: { ...INCL, ua: 285, fa: 285, w: 'W', eq: BENCH_INCL } },
  flyDb: { track: 'W', cap: 'Acostado · abre los brazos y vuelve a juntarlos', a: { ...LYING, ua: 112, fa: 112, w: 'W', eq: BENCH_FLAT }, b: { ...LYING, ua: 270, fa: 270, w: 'W', eq: BENCH_FLAT } },
  dips: { track: 'S', cap: 'En paralelas · baja flexionando y empuja', a: { p: [52, 77], t: 260, ua: 115, fa: 0, th: 80, sh: 200, fo: 110, eq: [[28, 62, 74, 62, 3]] }, b: { p: [50, 63], t: 270, ua: 92, fa: 90, th: 80, sh: 200, fo: 110, eq: [[28, 62, 74, 62, 3]] } },
  row: { track: 'W', cap: 'Pecho apoyado · lleva los codos hacia atrás', a: { p: [38, 62], t: 315, ua: 90, fa: 90, th: 100, sh: 88, w: 'W', eq: ROW_BENCH }, b: { p: [38, 62], t: 315, ua: 150, fa: 100, th: 100, sh: 88, w: 'W', eq: ROW_BENCH } },
  pullover: { track: 'W', cap: 'De pie · brazos casi rectos, baja hasta los muslos', a: { p: [48, 60], t: 276, ua: 292, fa: 292, th: 90, sh: 90, cable: [18, 6] }, b: { p: [48, 60], t: 292, ua: 62, fa: 70, th: 90, sh: 90, cable: [18, 6] } },
  pulldown: { track: 'W', cap: 'Sentado · baja la barra hasta el pecho', a: { p: [50, 76], t: 265, ua: 275, fa: 275, th: 5, sh: 90, eq: SEAT_PD, cable: [50, 2] }, b: { p: [50, 76], t: 262, ua: 112, fa: 300, th: 5, sh: 90, eq: SEAT_PD, cable: [50, 2] } },
  squat: { track: 'S', cap: 'Baja con la espalda recta y sube empujando', a: { ...STAND, ua: 125, fa: 300, w: 'S' }, b: { p: [40, 82], t: 300, ua: 125, fa: 300, th: 352, sh: 93, w: 'S' } },
  rdl: { track: 'W', cap: 'Lleva la cadera atrás · espalda recta', a: { ...STAND, ua: 95, fa: 90, w: 'W' }, b: { p: [38, 62], t: 335, ua: 90, fa: 90, th: 80, sh: 95, w: 'W' } },
  legpress: { track: 'F', cap: 'Sentado reclinado · empuja la plataforma', a: { p: [40, 80], t: 210, th: 300, sh: 20, eq: [[46, 86, 12, 68, 6], [72, 52, 74, 88, 5]] }, b: { p: [40, 80], t: 210, th: 330, sh: 330, eq: [[46, 86, 12, 68, 6], [78, 40, 80, 76, 5]] } },
  legcurl: { track: 'F', cap: 'BOCA ABAJO · lleva los talones a los glúteos', a: { p: [50, 76], t: 180, ua: 130, fa: 100, th: 0, sh: 0, fo: 270, eq: PRONE, rings: [[92, 74, 3]] }, b: { p: [50, 76], t: 180, ua: 130, fa: 100, th: 0, sh: 300, fo: 270, eq: PRONE, rings: [[81.5, 56, 3]] } },
  calf: { track: 'A', cap: 'De pie · sube los talones y baja controlado', a: { ...STAND, ua: 92, fa: 92, fo: 0, eq: STEP }, b: { p: [50, 46], t: 270, th: 90, sh: 90, ua: 92, fa: 92, fo: 62, fl: 14, eq: STEP } },
  calfSeat: { track: 'A', cap: 'Sentado · sube los talones con el peso en las rodillas', a: { p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 90, w: 'K', eq: [[56, 94, 88, 94, 5], [72, 94, 72, 105, 3], [32, 76, 52, 76, 5], [38, 76, 42, 40, 5]] }, b: { p: [44, 60], t: 265, ua: 100, fa: 20, th: 0, sh: 90, fo: 60, fl: 14, w: 'K', eq: [[56, 94, 88, 94, 5], [72, 94, 72, 105, 3], [32, 76, 52, 76, 5], [38, 76, 42, 40, 5]] } },
  legcurlSeat: { track: 'F', cap: 'SENTADO · baja los talones hacia atrás', a: { p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 352, eq: SEAT_LE }, b: { p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 95, eq: SEAT_LE } },
  hipthrust: { track: 'P', cap: 'Espalda en el banco · sube la cadera', a: { p: [56, 96], t: 215, th: 300, sh: 90, w: 'P', eq: HIP_BENCH }, b: { p: [56, 82], t: 190, th: 350, sh: 90, w: 'P', eq: HIP_BENCH } },
  legext: { track: 'F', cap: 'Sentado · extiende las rodillas', a: { p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 90, eq: SEAT_LE }, b: { p: [44, 70], t: 265, ua: 100, fa: 20, th: 0, sh: 350, eq: SEAT_LE } },
  pushdown: { track: 'W', cap: 'Codos pegados al cuerpo · empuja hacia abajo', a: { ...STAND, ua: 90, fa: 280, w: 'W', cable: [62, 2] }, b: { ...STAND, ua: 90, fa: 92, w: 'W', cable: [62, 2] } },
  skull: { track: 'W', cap: 'Acostado · baja a la frente y extiende', a: { ...LYING, ua: 270, fa: 170, w: 'W', eq: BENCH_FLAT }, b: { ...LYING, ua: 270, fa: 270, w: 'W', eq: BENCH_FLAT } },
  crunch: { track: 'S', cap: 'Acostado · enrolla el torso hacia las rodillas', a: { p: [60, 96], t: 185, th: 300, sh: 75, ua: 175, fa: 215, eq: FLOORLN }, b: { p: [60, 96], t: 220, th: 300, sh: 75, ua: 200, fa: 240, eq: FLOORLN } },
  legraise: { track: 'F', cap: 'Colgado · sube las piernas hasta 90°', a: { p: [50, 60], t: 270, ua: 270, fa: 270, th: 90, sh: 90, eq: BAR_PU }, b: { p: [50, 60], t: 270, ua: 270, fa: 270, th: 0, sh: 0, fo: -90, eq: BAR_PU } },
  walk: { cardio: true, cap: 'Camina a paso firme', a: { p: [50, 60], t: 272, th: 60, sh: 95, th2: 108, sh2: 132, ua: 40, fa: 335, ua2: 135, fa2: 115 }, b: { p: [50, 60], t: 272, th: 108, sh: 132, th2: 60, sh2: 95, ua: 135, fa: 115, ua2: 40, fa2: 335 } },
  bike: { cardio: true, cap: 'Pedalea a ritmo constante', a: { p: [40, 66], t: 300, ua: 20, fa: 10, th: 65, sh: 105, th2: 0, sh2: 80, rings: [[26, 88, 12], [78, 88, 12]], eq: [[26, 88, 44, 70, 2], [44, 70, 74, 66, 2], [74, 66, 78, 88, 2], [26, 88, 60, 88, 2], [34, 70, 48, 70, 4]] }, b: { p: [40, 66], t: 300, ua: 20, fa: 10, th: 5, sh: 80, th2: 65, sh2: 105, rings: [[26, 88, 12], [78, 88, 12]], eq: [[26, 88, 44, 70, 2], [44, 70, 74, 66, 2], [74, 66, 78, 88, 2], [26, 88, 60, 88, 2], [34, 70, 48, 70, 4]] } },
  rope: { cardio: true, cap: 'Salta con las puntas de los pies', a: { ...STAND, ua: 60, fa: 30, eq: ropeArc(false) }, b: { p: [50, 50], t: 270, th: 90, sh: 90, ua: 60, fa: 30, eq: ropeArc(true) } },

  // ---------- Calistenia ----------
  pushup: { track: 'S', cap: 'Cuerpo recto · baja el pecho y empuja el piso', a: { p: [45.5, 85.7], t: 340.5, th: 160.5, sh: 160.5, ua: 90, fa: 90 }, b: { p: [44.4, 92.8], t: 349.4, th: 169.4, sh: 169.4, ua: 120, fa: 20 } },
  pushupInc: { track: 'S', cap: 'Manos elevadas en una banca · baja el pecho al borde', a: { p: [43.3, 78.9], t: 330.5, th: 150.5, sh: 150.5, ua: 90, fa: 90, eq: PU_BENCH }, b: { p: [43.6, 86.1], t: 339.6, th: 159.6, sh: 159.6, ua: 120, fa: 20, eq: PU_BENCH } },
  pike: { track: 'S', cap: 'Cadera alta en “V” · baja la cabeza entre las manos', a: { p: [47, 60], t: 45, th: 110, sh: 100, ua: 90, fa: 90 }, b: { p: [48, 58], t: 70, th: 110, sh: 100, ua: 40, fa: 84 } },
  pullup: { track: 'S', cap: 'Cuélgate y sube hasta pasar la barbilla de la barra', a: { p: [50, 69], t: 270, ua: 270, fa: 270, th: 95, sh: 140, eq: PU_BAR }, b: { p: [50, 45.5], t: 270, ua: 100, fa: 275, th: 95, sh: 140, eq: PU_BAR } },
  pullupW: { track: 'S', cap: 'Con peso colgado de la cintura · sin balanceo', a: { p: [50, 69], t: 270, ua: 270, fa: 270, th: 95, sh: 140, w: 'P', eq: PU_BAR }, b: { p: [50, 45.5], t: 270, ua: 100, fa: 275, th: 95, sh: 140, w: 'P', eq: PU_BAR } },
  deadhang: { static: true, cap: 'MANTÉN · hombros activos, sin balancear', a: { p: [50, 69], t: 270, ua: 270, fa: 270, th: 95, sh: 140, eq: PU_BAR } },
  invrow: { track: 'S', cap: 'Bajo una barra o mesa · lleva el pecho a la barra', a: { p: [44.1, 97.3], t: 355, th: 175, sh: 175, ua: 270, fa: 270, eq: IR_BAR }, b: { p: [47.6, 84.9], t: 340, th: 160, sh: 160, ua: 150, fa: 300, eq: IR_BAR } },
  squatBW: { track: 'S', cap: 'Cadera atrás y abajo · pecho alto', a: { ...STAND, ua: 0, fa: 0 }, b: { p: [40, 82], t: 300, ua: 0, fa: 0, th: 352, sh: 93 } },
  lunge: { track: 'S', cap: 'Paso largo atrás · baja las dos rodillas a 90°', a: { ...STAND, ua: 92, fa: 92, th2: 90, sh2: 90 }, b: { p: [48, 78], t: 270, ua: 92, fa: 92, th: 10, sh: 90, th2: 115, sh2: 178 } },
  bulgara: { track: 'S', cap: 'Pie de atrás sobre la banca · baja con la pierna de adelante', a: { p: [48, 60], t: 270, ua: 92, fa: 92, th: 90, sh: 90, th2: 150, sh2: 140, eq: BG_BENCH }, b: { p: [46, 78], t: 275, ua: 92, fa: 92, th: 10, sh: 90, th2: 165, sh2: 177, eq: BG_BENCH } },
  pistol: { track: 'S', cap: 'Una pierna · la otra estirada al frente, con apoyo', a: { p: [50, 60], t: 270, ua: 0, fa: 0, th: 90, sh: 90, th2: 20, sh2: 20 }, b: { p: [38, 84], t: 300, ua: 0, fa: 0, th: 352, sh: 93, th2: 0, sh2: 0 } },
  jumpSquat: { track: 'S', cap: 'Baja a sentadilla y salta explosivo', a: { p: [40, 82], t: 300, ua: 0, fa: 0, th: 352, sh: 93 }, b: { p: [50, 48], t: 270, ua: 270, fa: 270, th: 90, sh: 90 } },
  bridge: { track: 'P', cap: 'Acostado · empuja con los talones y sube la cadera', a: { p: [56, 96], t: 180, ua: 0, fa: 0, th: 300, sh: 95 }, b: { p: [54, 83], t: 165, ua: 0, fa: 0, th: 350, sh: 90 } },
  plank: { static: true, cap: 'MANTÉN · cuerpo recto, abdomen y glúteos firmes', a: { p: [44.6, 92.4], t: 348, th: 168, sh: 168, ua: 90, fa: 0 } },
  hollow: { static: true, cap: 'MANTÉN · espalda baja pegada al piso', a: { p: [50, 92], t: 195, ua: 190, fa: 190, th: 345, sh: 345 } },
  lsit: { static: true, cap: 'MANTÉN · brazos rectos, piernas estiradas al frente', a: { p: [40, 96], t: 270, ua: 90, fa: 90, th: 0, sh: 0, eq: [[30, 95, 50, 95, 4], [40, 95, 40, 102, 2]] } },
  handstand: { static: true, cap: 'MANTÉN · apoyado en la pared, cuerpo en línea', a: { p: [50, 51], t: 90, ua: 90, fa: 90, th: 280, sh: 285, eq: [[66, 4, 66, 104, 3]] } },
  climber: { cardio: true, cap: 'En posición de flexión · alterna las rodillas al pecho', a: { p: [45.5, 85.7], t: 340.5, th: 160.5, sh: 160.5, th2: 20, sh2: 170, ua: 90, fa: 90 }, b: { p: [45.5, 85.7], t: 340.5, th: 20, sh: 170, th2: 160.5, sh2: 160.5, ua: 90, fa: 90 } },
  burpee: { cardio: true, cap: 'Manos al piso, patada atrás, y salto con brazos arriba', a: { p: [40, 90], t: 300, ua: 90, fa: 90, th: 352, sh: 93 }, b: { p: [50, 48], t: 270, ua: 270, fa: 270, th: 90, sh: 90 } },
  seatrow: { track: 'W', cap: 'Sentado con la banda en los pies · tira hacia el abdomen', a: { p: [30, 92], t: 270, ua: 10, fa: 0, th: 0, sh: 0, cable: [72, 90] }, b: { p: [30, 92], t: 270, ua: 165, fa: 0, th: 0, sh: 0, cable: [72, 90] } },
  dbrow: { track: 'W', cap: 'Apoyado en la banca · lleva el codo hacia la cadera', a: { p: [60, 62], t: 190, ua: 105, fa: 95, ua2: 90, fa2: 90, th: 95, sh: 88, w: 'W', eq: DB_BENCH }, b: { p: [60, 62], t: 190, ua: 15, fa: 95, ua2: 90, fa2: 90, th: 95, sh: 88, w: 'W', eq: DB_BENCH } },
  superman: { track: 'W', cap: 'Boca abajo · levanta brazos, pecho y piernas a la vez', a: { p: [55, 96], t: 180, ua: 180, fa: 180, th: 0, sh: 0 }, b: { p: [55, 96], t: 190, ua: 195, fa: 200, th: 350, sh: 345 } },
  benchdip: { track: 'S', cap: 'Manos en la banca · baja los codos a 90° y empuja', a: { p: [32.3, 81], t: 265, ua: 90, fa: 90, th: 30, sh: 30, eq: BD_BENCH }, b: { p: [32.3, 93], t: 265, ua: 160, fa: 20, th: 0, sh: 25, eq: BD_BENCH } },

  // ---------- Vista frontal ----------
  // head = cabeza, sh = [hombro izq, der], el = codos, wr = muñecas, hip = cadera, kn = rodillas, ft = pies
  flyCable: {
    front: true, track: 'W', cap: 'De pie · junta las manos al frente del pecho',
    a: { head: [50, 28], sh: [[41, 40], [59, 40]], el: [[27, 41], [73, 41]], wr: [[13, 38], [87, 38]], hip: [50, 68], kn: [[45, 86], [55, 86]], ft: [[43, 102], [57, 102]], w: 'W', cables: [[6, 8], [94, 8]] },
    b: { head: [50, 28], sh: [[41, 40], [59, 40]], el: [[34, 50], [66, 50]], wr: [[46, 51], [54, 51]], hip: [50, 68], kn: [[45, 86], [55, 86]], ft: [[43, 102], [57, 102]], w: 'W', cables: [[6, 8], [94, 8]] },
  },
  lateral: {
    front: true, track: 'W', cap: 'De pie · sube los brazos a los lados hasta los hombros',
    a: { head: [50, 28], sh: [[41, 40], [59, 40]], el: [[37, 54], [63, 54]], wr: [[36, 68], [64, 68]], hip: [50, 68], kn: [[45, 86], [55, 86]], ft: [[43, 102], [57, 102]], w: 'W' },
    b: { head: [50, 28], sh: [[41, 40], [59, 40]], el: [[27, 40], [73, 40]], wr: [[14, 39], [86, 39]], hip: [50, 68], kn: [[45, 86], [55, 86]], ft: [[43, 102], [57, 102]], w: 'W' },
  },
}

function ropeArc(over) {
  const pts = []
  for (let i = 0; i <= 12; i++) { const a = Math.PI * (i / 12); pts.push([50 + 30 * Math.cos(Math.PI - a), over ? 62 - 66 * Math.sin(a) * 0.9 : 70 + 34 * Math.sin(a)]) }
  return pts.slice(1).map((q, i) => [pts[i][0], pts[i][1], q[0], q[1], 2])
}

export const FIGURE_OF = {
  'press-inclinado': 'incline', 'press-banca': 'bench', 'aperturas-polea': 'flyCable', 'aperturas-mancuernas': 'flyDb', fondos: 'dips',
  'remo-apoyado': 'row', 'pullover-polea': 'pullover', 'jalon-pecho': 'pulldown',
  sentadilla: 'squat', 'peso-muerto-rumano': 'rdl', prensa: 'legpress', 'curl-femoral': 'legcurl', 'gemelos-pie': 'calf', 'hip-thrust': 'hipthrust',
  'extension-cuadriceps': 'legext', 'sentadilla-hack': 'squat', 'curl-femoral-sentado': 'legcurlSeat', 'gemelos-sentado': 'calfSeat',
  'press-militar': 'press', 'elevaciones-laterales': 'lateral', 'curl-biceps': 'curl', 'curl-martillo': 'curl', 'triceps-polea': 'pushdown', 'press-frances': 'skull',
  crunch: 'crunch', 'elevacion-piernas': 'legraise', caminata: 'walk', 'cinta-bici': 'bike', comba: 'rope',
  'cal-flexion-inclinada': 'pushupInc', 'cal-flexion': 'pushup', 'cal-flexion-pies-elevados': 'pushup', 'cal-flexion-diamante': 'pushup', 'cal-flexion-arquera': 'pushup',
  'cal-pike': 'pike', 'cal-fondos-banca': 'benchdip', 'cal-colgado': 'deadhang', 'cal-remo-invertido': 'invrow', 'cal-dominada-negativa': 'pullup', 'cal-dominada': 'pullup',
  'cal-dominada-supina': 'pullup', 'cal-dominada-lastre': 'pullupW', 'cal-dominada-explosiva': 'pullup', 'cal-dominada-arquera': 'pullup', 'cal-remo-mancuerna': 'dbrow',
  'cal-remo-banda': 'seatrow', 'cal-superman': 'superman', 'cal-sentadilla': 'squatBW', 'cal-zancada': 'lunge', 'cal-bulgara': 'bulgara', 'cal-pistol-asistida': 'pistol',
  'cal-sentadilla-salto': 'jumpSquat', 'cal-puente-gluteo': 'bridge', 'cal-gemelo-unipodal': 'calf', 'cal-plancha': 'plank', 'cal-escaladores': 'climber', 'cal-hollow': 'hollow',
  'cal-lsit': 'lsit', 'cal-parada-manos': 'handstand', 'cal-burpee': 'burpee', 'cal-mov-munecas': 'lateral', 'cal-mov-hombros': 'lateral',
}
export const FIGURE_BY_ZONE = { Pecho: 'bench', Espalda: 'pulldown', Piernas: 'squat', Hombros: 'press', Brazos: 'curl', Abdomen: 'crunch', Cardio: 'walk' }
export const poseKeyOf = (id, zone) => FIGURE_OF[id] || FIGURE_BY_ZONE[zone] || 'walk'
export const FIGURE_KEYS = Object.keys(POSES)

// Subtítulos específicos cuando el mismo dibujo sirve para varios ejercicios
const CAP_OVERRIDE = {
  'cal-flexion-pies-elevados': 'Pies sobre una banca · baja el pecho al piso y empuja',
  'cal-flexion-diamante': 'Manos juntas en rombo · codos pegados al cuerpo',
  'cal-flexion-arquera': 'Manos muy abiertas · baja hacia un lado y alterna',
  'cal-dominada-negativa': 'Sube con ayuda y baja lento en 4-5 segundos',
  'cal-dominada-supina': 'Palmas hacia ti · pasa la barbilla de la barra',
  'cal-dominada-explosiva': 'Tira rápido y lleva el pecho a la barra',
  'cal-dominada-arquera': 'Agarre ancho · sube hacia un lado y alterna',
  'cal-mov-munecas': 'Círculos suaves con las muñecas en ambos sentidos',
  'cal-mov-hombros': 'Círculos amplios con los brazos, banda sobre la cabeza',
  'cal-gemelo-unipodal': 'Sobre una pierna · sube y baja el talón',
  'curl-martillo': 'De pie · palmas enfrentadas, sube doblando el codo',
  'sentadilla-hack': 'Baja profundo con la espalda apoyada y sube',
}

// ---------- Dibujo de un cuadro ----------
function joints(pose) {
  const P = pose.p; const S = add(P, T, pose.t)
  const E = pose.ua != null ? add(S, UA, pose.ua) : null; const W = E ? add(E, FA, pose.fa) : null
  const K = add(P, TH, pose.th); const F = add(K, SH, pose.sh)
  return { P, S, E, W, K, F, head: add(S, 9, pose.t), toe: add(F, pose.fl ?? 7, pose.fo ?? pose.sh - 90) }
}

function sideFrame(pose, color, ghost = false) {
  const j = joints(pose); const out = []
  if (!ghost) {
    ;(pose.eq || []).forEach(([x1, y1, x2, y2, w]) => { if (x1 !== x2 || y1 !== y2) out.push(line([x1, y1], [x2, y2], w || 3, EQ, 0.9)) })
    ;(pose.rings || []).forEach(([x, y, r]) => out.push(circ([x, y], r, EQ, 'none', 2)))
    if (pose.cable) out.push(line(pose.cable, j.W || j.S, 1.2, EQ, 0.9))
  }
  if (pose.th2 != null) { const K2 = add(pose.p, TH, pose.th2); const F2 = add(K2, SH, pose.sh2); out.push(line(pose.p, K2, 5, color, 0.45), line(K2, F2, 5, color, 0.45), line(F2, add(F2, 7, pose.sh2 - 90), 4, color, 0.45)) }
  if (pose.ua2 != null) { const E2 = add(j.S, UA, pose.ua2); out.push(line(j.S, E2, 4, color, 0.45), line(E2, add(E2, FA, pose.fa2), 4, color, 0.45)) }
  out.push(line(j.P, j.K, 6, color), line(j.K, j.F, 6, color), line(j.F, j.toe, 5, color)) // pierna y pie
  out.push(line(j.P, j.S, 7, color))                                                          // tronco
  if (j.E) out.push(line(j.S, j.E, 4.5, '#fff'), line(j.E, j.W, 4.5, '#fff'))                 // brazo
  out.push(circ(j.head, 6.5, color, '#0e1116', 3))
  const wp = { W: j.W, S: j.S, P: j.P, K: j.K }[pose.w]
  if (wp) out.push(circ(wp, 5, '#fff', color, 2))
  return out.join('')
}

function frontFrame(pose, color, ghost = false) {
  const out = []
  if (!ghost && pose.cables) pose.cables.forEach((c, i) => out.push(line(c, pose.wr[i], 1.2, EQ, 0.9), circ(c, 2.5, EQ, EQ, 1)))
  const [kl, kr] = pose.kn; const [fl, fr] = pose.ft
  out.push(line(pose.hip, kl, 6, color), line(kl, fl, 6, color), line(pose.hip, kr, 6, color), line(kr, fr, 6, color))
  out.push(line(fl, [fl[0] - 5, fl[1]], 4, color), line(fr, [fr[0] + 5, fr[1]], 4, color))
  const mid = [(pose.sh[0][0] + pose.sh[1][0]) / 2, pose.sh[0][1]]
  out.push(line(mid, pose.hip, 9, color), line(pose.sh[0], pose.sh[1], 8, color))
  ;[0, 1].forEach((i) => out.push(line(pose.sh[i], pose.el[i], 4.5, '#fff'), line(pose.el[i], pose.wr[i], 4.5, '#fff')))
  out.push(circ(pose.head, 7, color, '#0e1116', 3))
  if (pose.w === 'W') pose.wr.forEach((w) => out.push(circ(w, 4.5, '#fff', color, 2)))
  return out.join('')
}

// Flecha curva punteada de un punto a otro
function arrow(a, b, color, bend = 1) {
  const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = Math.hypot(dx, dy)
  if (d < 7) return ''
  const c = [(a[0] + b[0]) / 2 - (dy / d) * 9 * bend, (a[1] + b[1]) / 2 + (dx / d) * 9 * bend]
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0]); const h = 5
  const p1 = [b[0] - h * Math.cos(ang - 0.5), b[1] - h * Math.sin(ang - 0.5)]; const p2 = [b[0] - h * Math.cos(ang + 0.5), b[1] - h * Math.sin(ang + 0.5)]
  return `<path d="M${f1(a[0])} ${f1(a[1])} Q${f1(c[0])} ${f1(c[1])} ${f1(b[0])} ${f1(b[1])}" fill="none" stroke="${color}" stroke-width="1.8" stroke-dasharray="3 2.5" stroke-linecap="round"/>`
    + `<path d="M${f1(p1[0])} ${f1(p1[1])} L${f1(b[0])} ${f1(b[1])} L${f1(p2[0])} ${f1(p2[1])}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
}

function pointOf(pose, track) {
  const j = joints(pose)
  return { W: j.W, F: j.toe, A: j.F, S: j.S, P: j.P }[track]
}

function drawFrame(spec, which, color, withGhost) {
  const pose = spec[which]; const A = spec.a
  const draw = spec.front ? frontFrame : sideFrame
  let out = ''
  if (which === 'b' && withGhost && !spec.cardio) out += `<g opacity="0.24">${draw(A, color, true)}</g>`
  out += draw(pose, color)
  if (which === 'b' && !spec.cardio && spec.track) {
    if (spec.front) {
      ;[0, 1].forEach((i) => { out += arrow(A.wr[i], pose.wr[i], '#c6f432', i ? 1 : -1) })
    } else {
      const from = pointOf(A, spec.track); const to = pointOf(pose, spec.track)
      if (from && to) out += arrow(from, to, '#c6f432')
    }
  }
  return out
}

const FLOORLINE = (x0, x1) => `<line x1="${x0}" y1="${FLOOR + 3}" x2="${x1}" y2="${FLOOR + 3}" stroke="#2c3442" stroke-width="2" stroke-linecap="round"/>`
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')

// SVG completo. compact = solo la posición final (miniaturas)
export function figureSVG(id, zone, color, compact = false) {
  const key = poseKeyOf(id, zone); const spec = POSES[key]
  if (spec.static) {
    const cap0 = esc(CAP_OVERRIDE[id] || spec.cap || '')
    if (compact) return `<svg viewBox="0 -10 100 122" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${FLOORLINE(4, 96)}${drawFrame(spec, 'a', color, false)}</svg>`
    return `<svg viewBox="0 -10 230 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${FLOORLINE(65, 165)}<g transform="translate(65,0)">${drawFrame(spec, 'a', color, false)}</g><text x="115" y="121" text-anchor="middle" font-size="8" font-weight="800" fill="#c6f432" font-family="Inter,Arial">MANTÉN LA POSICIÓN</text><text x="115" y="135" text-anchor="middle" font-size="8" font-weight="600" fill="#e6e8ee" font-family="Inter,Arial">${cap0}</text></svg>`
  }
  if (compact) return `<svg viewBox="0 -10 100 122" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${FLOORLINE(4, 96)}${drawFrame(spec, 'b', color, true)}</svg>`
  const cap = esc(CAP_OVERRIDE[id] || spec.cap || '')
  return `<svg viewBox="0 -10 230 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
    ${FLOORLINE(2, 100)}${FLOORLINE(130, 228)}
    <g>${drawFrame(spec, 'a', color, false)}</g>
    <g transform="translate(130,0)">${drawFrame(spec, 'b', color, true)}</g>
    <path d="M104 52 h14 m-5 -5 l5 5 l-5 5" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="50" y="121" text-anchor="middle" font-size="8" font-weight="800" fill="#9aa3b5" font-family="Inter,Arial">INICIO</text>
    <text x="180" y="121" text-anchor="middle" font-size="8" font-weight="800" fill="#9aa3b5" font-family="Inter,Arial">FINAL</text>
    <text x="115" y="135" text-anchor="middle" font-size="8" font-weight="600" fill="#e6e8ee" font-family="Inter,Arial">${cap}</text>
  </svg>`
}
