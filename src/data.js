// Datos iniciales, basados en la "Guía Método H: De flaco a definido".

export const ZONES = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Abdomen', 'Cardio']
export const LEVELS = ['Principiante', 'Intermedio', 'Avanzado']

// Color por zona (para puntos del calendario, chips, placeholders)
export const ZONE_COLOR = {
  Pecho: '#ff5470',
  Espalda: '#38bdf8',
  Piernas: '#a3e635',
  Hombros: '#fbbf24',
  Brazos: '#c084fc',
  Abdomen: '#fb923c',
  Cardio: '#2dd4bf',
}

const ex = (id, name, zone, level, rest, steps, def = {}) => ({
  id, name, zone, level, rest, steps, img: null, custom: false,
  sets: def.sets ?? 3, reps: def.reps ?? '8-12', rir: def.rir ?? '1-2',
})

import { CALI_EXERCISES } from './cali'

const BASE_EXERCISES = [
  // PECHO
  ex('press-inclinado', 'Press inclinado con mancuernas', 'Pecho', 'Intermedio', 150, [
    'Ajusta el banco a 30-45°.', 'Baja controlado hasta el pecho alto, codos a ~45° del torso.', 'Empuja hacia arriba sin bloquear los codos de golpe.', 'Mantén los omóplatos juntos y los pies firmes.',
  ], { sets: 3, reps: '6-10', rir: '1-2' }),
  ex('press-banca', 'Press banca / máquina', 'Pecho', 'Intermedio', 150, [
    'Acuéstate con los ojos bajo la barra y los pies firmes en el suelo.', 'Agarre algo más ancho que los hombros.', 'Baja la barra al pecho medio con control.', 'Empuja explosivo hasta casi extender los codos.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),
  ex('aperturas-polea', 'Aperturas en polea', 'Pecho', 'Principiante', 75, [
    'Poleas a la altura de los hombros, un paso adelante.', 'Codos ligeramente flexionados y fijos.', 'Abre hasta sentir el estiramiento del pecho.', 'Junta las manos frente al pecho apretando.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('aperturas-mancuernas', 'Aperturas con mancuernas', 'Pecho', 'Principiante', 75, [
    'Acostado en banco plano, mancuernas sobre el pecho.', 'Abre los brazos en arco con codos semiflexionados.', 'Baja hasta notar estiramiento, sin pasar la línea del hombro.', 'Cierra apretando el pecho.',
  ], { sets: 2, reps: '12-15', rir: '0-1' }),
  ex('fondos', 'Fondos en paralelas', 'Pecho', 'Avanzado', 90, [
    'Sujeta las barras con brazos extendidos y torso algo inclinado.', 'Baja hasta que los hombros queden a la altura de los codos.', 'Empuja hasta extender sin bloquear.', 'Usa asistencia o lastre según tu nivel.',
  ], { sets: 2, reps: '8-12', rir: '1' }),

  // ESPALDA
  ex('remo-apoyado', 'Remo con pecho apoyado', 'Espalda', 'Intermedio', 120, [
    'Pecho pegado al banco para no hacer trampa.', 'Lleva los codos hacia atrás y arriba.', 'Aprieta la espalda 1 segundo arriba (trabaja la densidad).', 'Baja controlado hasta estirar los dorsales.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),
  ex('pullover-polea', 'Pullover en polea', 'Espalda', 'Principiante', 75, [
    'Frente a la polea alta, brazos casi rectos.', 'Lleva la cuerda/barra desde arriba hasta los muslos.', 'Usa el dorsal, no los brazos.', 'Sube controlando hasta estirar.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('jalon-pecho', 'Jalón al pecho', 'Espalda', 'Principiante', 120, [
    'Siéntate con los muslos fijos bajo el rodillo.', 'Agarre algo más ancho que los hombros.', 'Tira de la barra hasta la parte alta del pecho llevando codos abajo.', 'Sube lento sin dejarte arrastrar.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),

  // PIERNAS
  ex('sentadilla', 'Sentadilla', 'Piernas', 'Intermedio', 180, [
    'Pies a la anchura de los hombros, pecho alto.', 'Baja con control lo más profundo que tu técnica permita.', 'Rodillas siguen la dirección de los pies.', 'Sube empujando el suelo.',
  ], { sets: 3, reps: '6-10', rir: '1-2' }),
  ex('peso-muerto-rumano', 'Peso muerto rumano', 'Piernas', 'Intermedio', 150, [
    'Rodillas semiflexionadas y fijas.', 'Lleva la cadera hacia atrás con la espalda neutra.', 'Baja hasta sentir los isquios.', 'Sube apretando los glúteos.',
  ], { sets: 3, reps: '8-10', rir: '1-2' }),
  ex('prensa', 'Prensa de piernas', 'Piernas', 'Principiante', 150, [
    'Espalda y glúteos pegados al respaldo.', 'Pies al ancho de hombros en la plataforma.', 'Baja hasta ~90° de rodilla sin despegar la pelvis.', 'Empuja sin bloquear las rodillas.',
  ], { sets: 2, reps: '10-12', rir: '1' }),
  ex('curl-femoral', 'Curl femoral', 'Piernas', 'Principiante', 75, [
    'Ajusta la máquina con el rodillo sobre los tobillos.', 'Flexiona llevando los talones hacia los glúteos.', 'Controla la fase de bajada (2-3 s).', 'No levantes la cadera.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('gemelos-pie', 'Pantorrillas de pie', 'Piernas', 'Principiante', 60, [
    'Apoya la parte delantera del pie en el borde.', 'Baja el talón hasta estirar al máximo.', 'Sube lo más alto posible y pausa 1 s.', 'Rango completo, sin rebotar.',
  ], { sets: 3, reps: '10-15', rir: '0-1' }),
  ex('hip-thrust', 'Hip thrust', 'Piernas', 'Intermedio', 120, [
    'Espalda alta apoyada en un banco, barra sobre la cadera.', 'Pies al ancho de caderas, rodillas a ~90° arriba.', 'Empuja con los talones hasta alinear rodillas-cadera-hombros.', 'Aprieta glúteos 1 s y baja controlado.',
  ], { sets: 3, reps: '8-12', rir: '1' }),
  ex('extension-cuadriceps', 'Extensión de cuádriceps', 'Piernas', 'Principiante', 75, [
    'Ajusta el respaldo para que la rodilla quede en el eje de giro.', 'Extiende hasta casi estirar la pierna.', 'Aprieta el cuádriceps 1 s arriba.', 'Baja lento.',
  ], { sets: 2, reps: '12-15', rir: '0-1' }),
  ex('sentadilla-hack', 'Sentadilla hack / goblet', 'Piernas', 'Intermedio', 150, [
    'Pies a media anchura en la plataforma (o mancuerna al pecho).', 'Baja profundo con el torso estable.', 'Empuja con todo el pie.', 'No bloquees las rodillas arriba.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),
  ex('curl-femoral-sentado', 'Curl femoral sentado', 'Piernas', 'Principiante', 75, [
    'Ajusta los muslos fijos bajo el rodillo.', 'Flexiona llevando los talones hacia abajo y atrás.', 'Pausa y aprieta isquios.', 'Vuelve lento.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('gemelos-sentado', 'Pantorrillas sentado', 'Piernas', 'Principiante', 60, [
    'Rodillas a 90° con el rodillo sobre los muslos.', 'Baja el talón estirando el sóleo.', 'Sube y pausa 1 s.', 'Rango completo.',
  ], { sets: 3, reps: '12-15', rir: '0-1' }),

  // HOMBROS
  ex('press-militar', 'Press militar', 'Hombros', 'Intermedio', 120, [
    'De pie o sentado, core apretado.', 'Barra/mancuernas a la altura de la clavícula.', 'Empuja hasta extender sobre la cabeza.', 'Baja controlado sin arquear la espalda.',
  ], { sets: 2, reps: '8-12', rir: '1-2' }),
  ex('elevaciones-laterales', 'Elevaciones laterales', 'Hombros', 'Principiante', 60, [
    'Mancuernas a los lados, codos ligeramente flexionados.', 'Sube hasta la altura de los hombros.', 'Lidera con el codo, no con la mano.', 'Baja lento sin balanceo.',
  ], { sets: 3, reps: '12-20', rir: '0-1' }),

  // BRAZOS
  ex('curl-biceps', 'Curl de bíceps', 'Brazos', 'Principiante', 60, [
    'Codos pegados al torso.', 'Sube la mancuerna/barra girando la muñeca.', 'Aprieta arriba sin balancear.', 'Baja en 2-3 segundos.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('curl-martillo', 'Curl martillo', 'Brazos', 'Principiante', 60, [
    'Agarre neutro (palmas enfrentadas).', 'Codos fijos junto al cuerpo.', 'Sube hasta el hombro.', 'Baja con control.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('triceps-polea', 'Extensión de tríceps en polea', 'Brazos', 'Principiante', 60, [
    'Codos pegados a los costados.', 'Extiende hasta bloquear suave abajo.', 'Aprieta el tríceps 1 s.', 'Sube sin mover los codos.',
  ], { sets: 2, reps: '10-15', rir: '0-1' }),
  ex('press-frances', 'Press francés', 'Brazos', 'Intermedio', 90, [
    'Acostado, barra sobre el pecho con brazos extendidos.', 'Flexiona solo los codos llevando la barra a la frente.', 'Mantén los codos apuntando al techo.', 'Extiende apretando el tríceps.',
  ], { sets: 2, reps: '8-12', rir: '1' }),

  // ABDOMEN
  ex('crunch', 'Crunch abdominal', 'Abdomen', 'Principiante', 60, [
    'Enrolla la columna llevando las costillas hacia la pelvis.', 'No tires del cuello.', 'Exhala al subir y aprieta.', 'Baja lento sin soltar la tensión.',
  ], { sets: 3, reps: '10-15', rir: '0-1' }),
  ex('elevacion-piernas', 'Elevación de piernas colgado', 'Abdomen', 'Avanzado', 75, [
    'Cuélgate de la barra sin balancearte.', 'Eleva las piernas hasta 90° o más.', 'Controla la bajada.', 'Alternativa: dragon flag.',
  ], { sets: 3, reps: '10-15', rir: '0-1' }),

  // CARDIO
  ex('caminata', 'Caminata (pasos / NEAT)', 'Cardio', 'Principiante', 0, [
    'Cumple tu meta diaria de pasos (la eliges en Progreso → Estándares).', 'Ritmo vivo que permita hablar.', 'Caminar suma actividad diaria y te permite comer un poco más en déficit.', 'Camina en bloques de 20-30 min.',
  ], { sets: 1, reps: '30 min', rir: '-' }),
  ex('cinta-bici', 'Cardio en trotadora / bicicleta', 'Cardio', 'Principiante', 0, [
    'Calienta 3-5 min a ritmo suave.', 'Mantén un ritmo moderado constante.', 'Zona 2: puedes hablar con frases cortas.', 'Termina con 3 min de vuelta a la calma.',
  ], { sets: 1, reps: '20 min', rir: '-' }),
  ex('comba', 'Saltar la cuerda', 'Cardio', 'Intermedio', 45, [
    'Salta con las puntas de los pies.', 'Muñecas mueven la cuerda, codos pegados.', 'Saltos bajos y rítmicos.', 'Intervalos de 30-60 s con descanso.',
  ], { sets: 4, reps: '45 s', rir: '-' }),
]

export const SEED_EXERCISES = [...BASE_EXERCISES, ...CALI_EXERCISES]

const item = (exId, sets, reps, rir) => ({ exId, sets, reps, rir, weight: 0 })

// Rutina "Upper / Lower" de 4 días de la guía (Lun/Mar/Jue/Vie). Clave = día de la semana (0=Dom ... 6=Sáb)
export const SEED_PLAN = {
  0: { label: 'Descanso + pasos', rest: true, zones: ['Cardio'], items: [item('caminata', 1, '10.000 pasos', '-')] },
  1: {
    label: 'Torso A', zones: ['Pecho', 'Espalda', 'Hombros', 'Brazos'], items: [
      item('press-inclinado', 3, '6-10', '1-2'), item('remo-apoyado', 3, '8-12', '1-2'),
      item('aperturas-polea', 2, '10-15', '0-1'), item('pullover-polea', 2, '10-15', '0-1'),
      item('press-militar', 2, '8-12', '1-2'), item('elevaciones-laterales', 3, '12-20', '0-1'),
      item('curl-biceps', 2, '10-15', '0-1'), item('triceps-polea', 2, '10-15', '0-1'),
    ],
  },
  2: {
    label: 'Pierna A', zones: ['Piernas', 'Abdomen'], items: [
      item('sentadilla', 3, '6-10', '1-2'), item('peso-muerto-rumano', 3, '8-10', '1-2'),
      item('prensa', 2, '10-12', '1'), item('curl-femoral', 2, '10-15', '0-1'),
      item('gemelos-pie', 3, '10-15', '0-1'), item('crunch', 3, '10-15', '0-1'),
    ],
  },
  3: { label: 'Descanso + pasos', rest: true, zones: ['Cardio'], items: [item('caminata', 1, '10.000 pasos', '-')] },
  4: {
    label: 'Torso B', zones: ['Pecho', 'Espalda', 'Hombros', 'Brazos'], items: [
      item('press-banca', 3, '8-12', '1-2'), item('jalon-pecho', 3, '8-12', '1-2'),
      item('remo-apoyado', 2, '10-12', '1'), item('aperturas-mancuernas', 2, '12-15', '0-1'),
      item('pullover-polea', 2, '12-15', '0-1'), item('elevaciones-laterales', 3, '12-20', '0-1'),
      item('curl-martillo', 2, '10-15', '0-1'), item('fondos', 2, '8-12', '1'),
    ],
  },
  5: {
    label: 'Pierna B', zones: ['Piernas', 'Abdomen'], items: [
      item('sentadilla-hack', 3, '8-12', '1-2'), item('hip-thrust', 3, '8-12', '1'),
      item('extension-cuadriceps', 2, '12-15', '0-1'), item('curl-femoral-sentado', 2, '10-15', '0-1'),
      item('gemelos-sentado', 3, '12-15', '0-1'), item('elevacion-piernas', 3, '10-15', '0-1'),
    ],
  },
  6: { label: 'Descanso + pasos', rest: true, zones: ['Cardio'], items: [item('caminata', 1, '10.000 pasos', '-')] },
}

// Checklist diario de estándares (guía, pág. 13)
export const HABITS = [
  { id: 'rutina', label: 'Rutina de mañana (4 pasos)' },
  { id: '345', label: 'Método 3-4-5 escrito' },
  { id: 'entreno', label: 'Entrenamiento completado y registrado' },
  { id: 'proteina', label: 'Proteína objetivo alcanzada' },
  { id: 'calorias', label: 'Calorías dentro del objetivo' },
  { id: 'pasos', label: 'Pasos diarios' },
  { id: 'pantallas', label: 'Sin pantallas 1 h antes de dormir' },
  { id: 'sueno', label: '8 h de sueño' },
]

export const DEFAULT_SETTINGS = { rest: 0, sound: true, vibrate: true, circuit: false, name: '', welcomed: false, bg: null, bgDim: 0.75, goal: 'fuerza-definicion', steps: 10000,
  volume: 'alto', soundEnd: 'alarma', customSound: null, customSoundName: '', ticks: true, voice: true,
  secPerRep: 3, prepSec: 10, extraChange: 10 }
