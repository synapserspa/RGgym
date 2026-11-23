// Calistenia: ejercicios, rutinas completas y progresiones. Equipo del usuario: barra de dominadas, mancuernas,
// banca ajustable, barra con discos y bandas elásticas.

// equip: lista de implementos necesarios ([] = solo el cuerpo)
const cx = (id, name, zone, level, rest, equip, steps, def = {}) => ({
  id, name, zone, level, rest, steps, img: null, custom: false, cali: true, equip,
  sets: def.sets ?? 3, reps: def.reps ?? '8-12', rir: def.rir ?? '1-2',
})

export const EQUIP_LABEL = { barra: 'Barra de dominadas', banca: 'Banca', mancuernas: 'Mancuernas', discos: 'Barra con discos', bandas: 'Bandas', mesa: 'Mesa o barra baja', silla: 'Silla o banca' }

export const CALI_EXERCISES = [
  // ---------- EMPUJE ----------
  cx('cal-flexion-inclinada', 'Flexión inclinada (manos elevadas)', 'Pecho', 'Principiante', 60, ['banca'], [
    'Apoya las manos en una banca o silla firme, un poco más anchas que los hombros.', 'Cuerpo recto de cabeza a talones: aprieta abdomen y glúteos.', 'Baja el pecho hasta rozar el borde con los codos a ~45°.', 'Empuja hasta estirar los brazos sin perder la línea.',
  ], { sets: 3, reps: '10-15', rir: '1-2' }),
  cx('cal-flexion', 'Flexión estándar', 'Pecho', 'Principiante', 75, [], [
    'Manos bajo los hombros, cuerpo recto como una tabla.', 'Baja controlado hasta que el pecho casi toque el piso.', 'Codos a ~45° del torso, no abiertos en cruz.', 'Sube empujando el piso lejos de ti.',
  ], { sets: 3, reps: '8-15', rir: '1-2' }),
  cx('cal-flexion-pies-elevados', 'Flexión con pies elevados', 'Pecho', 'Intermedio', 75, ['banca'], [
    'Pon los pies sobre la banca y las manos en el piso bajo los hombros.', 'Mantén el cuerpo recto: no hundas la cadera.', 'Baja hasta rozar el piso con el pecho.', 'Empuja fuerte hasta extender. Trabaja más el pecho alto y los hombros.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),
  cx('cal-flexion-diamante', 'Flexión diamante', 'Brazos', 'Intermedio', 75, [], [
    'Junta las manos bajo el pecho formando un rombo con pulgares e índices.', 'Codos pegados al cuerpo al bajar.', 'Baja hasta tocar las manos con el pecho.', 'Empuja hasta extender. Trabaja tríceps y pecho interno.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),
  cx('cal-flexion-arquera', 'Flexión arquera', 'Pecho', 'Avanzado', 90, [], [
    'Manos muy abiertas, más allá de los hombros.', 'Baja hacia un lado doblando ese brazo; el otro brazo queda estirado.', 'Sube y alterna el lado.', 'Es el paso previo a la flexión a una mano.',
  ], { sets: 3, reps: '5-8 por lado', rir: '1-2' }),
  cx('cal-pike', 'Flexión pike (hombros)', 'Hombros', 'Intermedio', 90, [], [
    'Forma una “V” invertida: cadera alta, manos y pies en el piso.', 'Dobla los codos llevando la cabeza hacia el piso entre las manos.', 'Empuja hasta estirar los brazos.', 'Pies sobre la banca la hacen más difícil: es la ruta a la parada de manos.',
  ], { sets: 3, reps: '6-10', rir: '1-2' }),
  cx('cal-fondos-banca', 'Fondos en banca (tríceps)', 'Brazos', 'Principiante', 60, ['banca'], [
    'Manos en el borde de la banca detrás de ti, piernas estiradas hacia adelante.', 'Baja flexionando los codos hacia atrás hasta ~90°.', 'No bajes más de eso para cuidar los hombros.', 'Empuja hasta estirar. Con los pies elevados o peso en las piernas se hace más difícil.',
  ], { sets: 3, reps: '10-15', rir: '1-2' }),

  // ---------- TIRÓN ----------
  cx('cal-colgado', 'Colgado en barra (dead hang)', 'Espalda', 'Principiante', 60, ['barra'], [
    'Cuélgate de la barra con agarre algo más ancho que los hombros.', 'Hombros “activos”: bájalos y aléjalos de las orejas, sin encogerlos.', 'Cuerpo quieto, sin balanceo.', 'Aguanta el tiempo indicado. Fortalece agarre y hombros.',
  ], { sets: 3, reps: '30 s', rir: '-' }),
  cx('cal-remo-invertido', 'Remo invertido (mesa o barra baja)', 'Espalda', 'Principiante', 75, ['mesa'], [
    'Acuéstate debajo de una barra baja o una mesa resistente y agárrala.', 'Cuerpo recto, talones en el piso.', 'Tira del pecho hacia la barra juntando las escápulas.', 'Baja controlado. Pies más elevados = más difícil.',
  ], { sets: 3, reps: '8-12', rir: '1-2' }),
  cx('cal-dominada-negativa', 'Dominada negativa', 'Espalda', 'Principiante', 90, ['barra'], [
    'Sube a la posición alta (con un salto o un banco): barbilla sobre la barra.', 'Baja lo más lento posible, 4-5 segundos.', 'Controla todo el recorrido hasta quedar colgado.', 'Repite: es la mejor forma de ganar tus primeras dominadas.',
  ], { sets: 4, reps: '4-6', rir: '1-2' }),
  cx('cal-dominada', 'Dominada (agarre prono)', 'Espalda', 'Intermedio', 150, ['barra'], [
    'Agarre prono algo más ancho que los hombros, hombros activos.', 'Tira llevando el pecho hacia la barra, codos hacia las costillas.', 'Pasa la barbilla por encima sin balancear.', 'Baja hasta estirar los brazos completamente.',
  ], { sets: 4, reps: '6-8', rir: '1-2' }),
  cx('cal-dominada-supina', 'Dominada supina (chin-up)', 'Espalda', 'Intermedio', 150, ['barra'], [
    'Agarre supino (palmas hacia ti) al ancho de los hombros.', 'Tira hasta pasar la barbilla de la barra.', 'Trabaja mucho el bíceps además de la espalda.', 'Baja controlado hasta estirar.',
  ], { sets: 3, reps: '6-8', rir: '1-2' }),
  cx('cal-dominada-lastre', 'Dominada con lastre', 'Espalda', 'Avanzado', 180, ['barra', 'mancuernas'], [
    'Agrega peso: mochila, cinturón o una mancuerna sujeta entre los pies.', 'Misma técnica que la dominada: sin balanceo.', 'Empieza con 5-10 % de tu peso corporal.', 'Cuando hagas 3×6 limpias, sube el peso un poco.',
  ], { sets: 4, reps: '4-6', rir: '1-2' }),
  cx('cal-dominada-explosiva', 'Dominada explosiva (pecho a barra)', 'Espalda', 'Avanzado', 180, ['barra'], [
    'Tira con la máxima velocidad posible hacia arriba.', 'Intenta llevar el pecho (no solo la barbilla) a la barra.', 'Baja controlado en 2 segundos.', 'Es la base del muscle-up: calidad antes que cantidad.',
  ], { sets: 4, reps: '3-5', rir: '1-2' }),
  cx('cal-dominada-arquera', 'Dominada arquera', 'Espalda', 'Avanzado', 180, ['barra'], [
    'Agarre muy ancho.', 'Tira hacia un lado, doblando ese brazo mientras el otro queda estirado.', 'Alterna el lado en cada repetición.', 'Es la ruta a la dominada a un brazo.',
  ], { sets: 3, reps: '3-5 por lado', rir: '1-2' }),
  cx('cal-remo-mancuerna', 'Remo a una mano con mancuerna (banca)', 'Espalda', 'Principiante', 90, ['banca', 'mancuernas'], [
    'Apoya una rodilla y la mano del mismo lado en la banca, espalda plana.', 'Con la otra mano toma la mancuerna colgando.', 'Lleva el codo hacia la cadera sin girar el torso.', 'Baja hasta estirar el brazo. Repite y cambia de lado.',
  ], { sets: 3, reps: '8-12 por lado', rir: '1-2' }),
  cx('cal-remo-banda', 'Remo con banda elástica', 'Espalda', 'Principiante', 60, ['bandas'], [
    'Siéntate con las piernas estiradas y pasa la banda por las plantas de los pies.', 'Tira de los extremos hacia el abdomen, codos pegados.', 'Junta las escápulas 1 segundo.', 'Vuelve lento sin soltar la tensión.',
  ], { sets: 3, reps: '12-15', rir: '1-2' }),
  cx('cal-superman', 'Superman', 'Espalda', 'Principiante', 45, [], [
    'Acuéstate boca abajo con los brazos estirados al frente.', 'Levanta a la vez brazos, pecho y piernas.', 'Mantén 1-2 segundos apretando glúteos y espalda baja.', 'Baja con control.',
  ], { sets: 3, reps: '12-15', rir: '1' }),

  // ---------- PIERNAS ----------
  cx('cal-sentadilla', 'Sentadilla con peso corporal', 'Piernas', 'Principiante', 60, [], [
    'Pies al ancho de los hombros, puntas algo hacia afuera.', 'Baja llevando la cadera atrás y abajo, pecho alto.', 'Rodillas siguen la dirección de los pies.', 'Sube empujando todo el pie contra el piso.',
  ], { sets: 3, reps: '15-20', rir: '1-2' }),
  cx('cal-zancada', 'Zancada hacia atrás', 'Piernas', 'Principiante', 60, [], [
    'De pie, da un paso largo hacia atrás.', 'Baja hasta que ambas rodillas formen ~90° y la de atrás casi toque el piso.', 'Torso erguido, la rodilla de adelante sobre el tobillo.', 'Empuja con la pierna de adelante para volver. Cambia de lado.',
  ], { sets: 3, reps: '10-12 por lado', rir: '1-2' }),
  cx('cal-bulgara', 'Sentadilla búlgara', 'Piernas', 'Intermedio', 90, ['banca'], [
    'Apoya el empeine de un pie en la banca detrás de ti.', 'Baja con la pierna de adelante, torso ligeramente inclinado.', 'La rodilla de adelante no pasa mucho la punta del pie.', 'Sube empujando con el talón. Con mancuernas es aún más exigente.',
  ], { sets: 3, reps: '8-10 por lado', rir: '1-2' }),
  cx('cal-pistol-asistida', 'Sentadilla pistol asistida', 'Piernas', 'Avanzado', 120, [], [
    'Párate en una pierna con la otra estirada al frente; sujétate de un marco o banda.', 'Baja lento en una sola pierna con el talón siempre pegado.', 'Usa la asistencia solo lo necesario.', 'Reduce la ayuda con el tiempo hasta hacerla libre.',
  ], { sets: 3, reps: '4-6 por lado', rir: '1-2' }),
  cx('cal-sentadilla-salto', 'Sentadilla con salto', 'Piernas', 'Intermedio', 75, [], [
    'Baja a una sentadilla con el pecho alto.', 'Salta lo más alto que puedas extendiendo todo el cuerpo.', 'Aterriza suave, rodillas flexionadas, sin dejarlas caer hacia adentro.', 'Pausa un instante y repite.',
  ], { sets: 3, reps: '10-12', rir: '1-2' }),
  cx('cal-puente-gluteo', 'Puente de glúteo', 'Piernas', 'Principiante', 45, [], [
    'Acostado boca arriba, rodillas dobladas y pies en el piso.', 'Empuja con los talones y sube la cadera hasta alinear rodillas, cadera y hombros.', 'Aprieta los glúteos 1-2 segundos arriba.', 'Baja con control sin apoyar del todo.',
  ], { sets: 3, reps: '15-20', rir: '1-2' }),
  cx('cal-gemelo-unipodal', 'Elevación de talones a una pierna', 'Piernas', 'Principiante', 45, [], [
    'De pie sobre una pierna, apoyándote de una pared para el equilibrio.', 'Sube en la punta del pie lo más alto posible.', 'Pausa 1 segundo arriba.', 'Baja lento hasta estirar la pantorrilla. Cambia de pierna.',
  ], { sets: 3, reps: '12-15 por lado', rir: '1' }),

  // ---------- CORE ----------
  cx('cal-plancha', 'Plancha', 'Abdomen', 'Principiante', 45, [], [
    'Apoya los antebrazos bajo los hombros y las puntas de los pies.', 'Cuerpo recto: abdomen y glúteos apretados.', 'No hundas la cadera ni la subas.', 'Respira normal y aguanta el tiempo indicado.',
  ], { sets: 3, reps: '45 s', rir: '-' }),
  cx('cal-escaladores', 'Escaladores (mountain climbers)', 'Abdomen', 'Principiante', 45, [], [
    'Posición de flexión con los brazos estirados.', 'Lleva una rodilla al pecho y cambia de pierna rápido.', 'Cadera baja y estable, hombros sobre las manos.', 'Mantén un ritmo constante.',
  ], { sets: 3, reps: '30 s', rir: '-' }),
  cx('cal-hollow', 'Hollow hold', 'Abdomen', 'Intermedio', 45, [], [
    'Acostado boca arriba, baja las costillas y pega la zona lumbar al piso.', 'Levanta piernas estiradas y hombros del piso, brazos sobre la cabeza.', 'Forma una “banana” sin despegar la espalda baja.', 'Aguanta; si cuesta, flexiona un poco las rodillas.',
  ], { sets: 3, reps: '25 s', rir: '-' }),
  cx('cal-lsit', 'L-sit (en el piso o con bloques)', 'Abdomen', 'Avanzado', 90, [], [
    'Siéntate con las piernas estiradas y las manos a los lados de la cadera.', 'Empuja el piso y levanta la cadera y las piernas.', 'Brazos rectos, hombros bajos, puntas de los pies estiradas.', 'Empieza con las rodillas flexionadas (tuck) si aún no puedes.',
  ], { sets: 4, reps: '15 s', rir: '-' }),
  cx('cal-parada-manos', 'Parada de manos en pared (hold)', 'Hombros', 'Avanzado', 90, [], [
    'Apoya las manos a ~15 cm de la pared y sube los pies hasta pegarlos.', 'Brazos rectos, empujando el piso, cuerpo en línea.', 'Mira entre tus manos y aprieta abdomen y glúteos.', 'Empieza con tiempos cortos y descansos largos.',
  ], { sets: 4, reps: '20 s', rir: '-' }),

  // ---------- COMPLETOS Y MOVILIDAD ----------
  cx('cal-burpee', 'Burpee', 'Cardio', 'Intermedio', 60, [], [
    'De pie, baja las manos al piso y lleva los pies atrás a posición de flexión.', 'Haz una flexión (opcional) y vuelve los pies adelante.', 'Salta estirando el cuerpo con los brazos arriba.', 'Encadena las repeticiones a ritmo constante.',
  ], { sets: 3, reps: '10', rir: '1-2' }),
  cx('cal-mov-munecas', 'Movilidad de muñecas', 'Brazos', 'Principiante', 0, [], [
    'Haz círculos suaves con las muñecas en ambos sentidos.', 'Apoya las palmas en el piso con los dedos hacia ti y balancéate con suavidad.', 'Repite con el dorso de las manos.', 'Es obligatorio antes de flexiones, planchas y parada de manos.',
  ], { sets: 1, reps: '45 s', rir: '-' }),
  cx('cal-mov-hombros', 'Movilidad de hombros y escápulas', 'Hombros', 'Principiante', 0, ['bandas'], [
    'Con una banda o un palo, pásala de adelante hacia atrás por encima de la cabeza.', 'Haz círculos amplios con los brazos.', 'Junta y separa las escápulas con los brazos al frente.', 'Muévete sin dolor, a ritmo lento.',
  ], { sets: 1, reps: '45 s', rir: '-' }),
]

// ---------- Rutinas completas ----------
const it = (exId, sets, reps, rir = '1-2', weight = 0) => ({ exId, sets, reps, rir, weight })
const WARM = [it('cal-mov-munecas', 1, '45 s', '-'), it('cal-mov-hombros', 1, '45 s', '-')]

export const CALI_ROUTINES = [
  {
    id: 'r-cuerpo-3', name: 'Cuerpo completo · 3 días', mode: 'casa', level: 'Principiante', minutes: 40, perWeek: 3,
    desc: 'Tres sesiones de cuerpo completo solo con tu peso corporal. Ideal para construir la base de empuje, tirón, piernas y core.',
    days: [
      { label: 'Cuerpo completo A', items: [...WARM, it('cal-flexion', 3, '8-15'), it('cal-sentadilla', 3, '15-20'), it('cal-remo-invertido', 3, '8-12'), it('cal-puente-gluteo', 3, '15-20'), it('cal-plancha', 3, '45 s', '-')] },
      { label: 'Cuerpo completo B', items: [...WARM, it('cal-pike', 3, '6-10'), it('cal-zancada', 3, '10-12 por lado'), it('cal-superman', 3, '12-15', '1'), it('cal-escaladores', 3, '30 s', '-'), it('cal-hollow', 3, '20 s', '-')] },
      { label: 'Cuerpo completo C', items: [...WARM, it('cal-flexion-diamante', 3, '8-12'), it('cal-sentadilla-salto', 3, '10-12'), it('cal-fondos-banca', 3, '10-15'), it('cal-remo-invertido', 3, '8-12'), it('cal-plancha', 3, '45 s', '-')] },
    ],
  },
  {
    id: 'r-express', name: 'Express 20 min · circuito', mode: 'casa', level: 'Intermedio', minutes: 20, perWeek: 3, circuit: true,
    desc: 'Una serie de cada ejercicio seguidos, y repites la ronda. Sin implementos: perfecto para días con poco tiempo.',
    days: [
      { label: 'Circuito express', circuit: true, items: [it('cal-burpee', 3, '10'), it('cal-sentadilla', 3, '20'), it('cal-flexion', 3, '12'), it('cal-escaladores', 3, '30 s', '-'), it('cal-puente-gluteo', 3, '20'), it('cal-plancha', 3, '40 s', '-')] },
    ],
  },
  {
    id: 'r-upperlower-casa', name: 'Superior / Inferior en casa · 4 días', mode: 'casa', level: 'Intermedio', minutes: 45, perWeek: 4,
    desc: 'Cuatro días repartidos entre tren superior e inferior, sin ningún implemento (usa una mesa para el remo).',
    days: [
      { label: 'Superior A', items: [...WARM, it('cal-flexion-pies-elevados', 4, '8-12'), it('cal-pike', 3, '6-10'), it('cal-remo-invertido', 4, '8-12'), it('cal-fondos-banca', 3, '12-15'), it('cal-superman', 3, '12-15', '1')] },
      { label: 'Inferior A', items: [...WARM, it('cal-sentadilla-salto', 4, '10-12'), it('cal-zancada', 3, '12 por lado'), it('cal-puente-gluteo', 4, '15-20'), it('cal-gemelo-unipodal', 3, '12-15 por lado', '1'), it('cal-plancha', 3, '45 s', '-')] },
      { label: 'Superior B', items: [...WARM, it('cal-flexion-diamante', 4, '8-12'), it('cal-flexion-arquera', 3, '5-8 por lado'), it('cal-remo-invertido', 4, '8-12'), it('cal-fondos-banca', 3, '12-15'), it('cal-hollow', 3, '25 s', '-')] },
      { label: 'Inferior B', items: [...WARM, it('cal-pistol-asistida', 3, '4-6 por lado'), it('cal-zancada', 3, '12 por lado'), it('cal-sentadilla', 4, '20'), it('cal-gemelo-unipodal', 3, '12-15 por lado', '1'), it('cal-escaladores', 3, '30 s', '-')] },
    ],
  },
  {
    id: 'r-fuerza-ppl', name: 'Fuerza calistenia · Empuje / Tirón / Piernas', mode: 'equipo', level: 'Avanzado', minutes: 60, perWeek: 3,
    desc: 'Tu base de dominadas más barra, banca y mancuernas para sobrecargar. Tres días de fuerza con progresión de lastre.',
    days: [
      { label: 'Empuje', items: [...WARM, it('press-banca', 4, '6-8'), it('cal-pike', 3, '6-10'), it('cal-flexion-arquera', 3, '5-8 por lado'), it('press-militar', 3, '8-10'), it('cal-fondos-banca', 3, '12-15')] },
      { label: 'Tirón', items: [...WARM, it('cal-dominada-lastre', 4, '4-6'), it('cal-dominada-supina', 3, '6-8'), it('cal-remo-mancuerna', 3, '8-12 por lado'), it('cal-dominada-explosiva', 3, '3-5'), it('curl-martillo', 3, '10-12'), it('cal-colgado', 2, '30 s', '-')] },
      { label: 'Piernas y core', items: [...WARM, it('sentadilla', 4, '6-8'), it('cal-bulgara', 3, '8-10 por lado'), it('peso-muerto-rumano', 3, '8-10'), it('hip-thrust', 3, '8-12'), it('cal-gemelo-unipodal', 3, '12-15 por lado', '1'), it('cal-lsit', 3, '15 s', '-'), it('elevacion-piernas', 3, '10-12', '0-1')] },
    ],
  },
  {
    id: 'r-hibrido', name: 'Híbrido barra + pesas · Superior / Inferior', mode: 'equipo', level: 'Intermedio', minutes: 60, perWeek: 4,
    desc: 'Cuatro días combinando calistenia con barra y mancuernas: lo mejor de los dos mundos para fuerza y masa.',
    days: [
      { label: 'Superior A', items: [...WARM, it('press-banca', 4, '6-8'), it('cal-dominada-lastre', 4, '5-6'), it('press-militar', 3, '8-10'), it('cal-remo-mancuerna', 3, '8-12 por lado'), it('press-frances', 2, '10-12', '1'), it('curl-biceps', 2, '10-12', '0-1')] },
      { label: 'Inferior A', items: [...WARM, it('sentadilla', 4, '6-8'), it('peso-muerto-rumano', 3, '8-10'), it('cal-bulgara', 3, '8-10 por lado'), it('gemelos-pie', 3, '12-15', '0-1'), it('crunch', 3, '12-15', '0-1')] },
      { label: 'Superior B', items: [...WARM, it('press-inclinado', 4, '8-10'), it('cal-dominada', 4, '6-8'), it('elevaciones-laterales', 3, '12-15', '0-1'), it('aperturas-mancuernas', 2, '12-15', '0-1'), it('cal-remo-banda', 3, '12-15'), it('curl-martillo', 2, '10-12', '0-1')] },
      { label: 'Inferior B', items: [...WARM, it('sentadilla-hack', 3, '8-12'), it('hip-thrust', 4, '8-10'), it('cal-zancada', 3, '10 por lado'), it('cal-gemelo-unipodal', 3, '12-15 por lado', '1'), it('cal-hollow', 3, '30 s', '-')] },
    ],
  },
  {
    id: 'r-dominadas', name: 'Camino a las dominadas avanzadas', mode: 'equipo', level: 'Avanzado', minutes: 50, perWeek: 3,
    desc: 'Especialización de tirón para quien ya hace ~8 dominadas: más repeticiones, lastre y la ruta hacia el muscle-up.',
    days: [
      { label: 'Fuerza máxima', items: [...WARM, it('cal-dominada-lastre', 5, '3-5', '1-2'), it('cal-dominada-explosiva', 4, '3-5'), it('cal-remo-mancuerna', 3, '8-10 por lado'), it('cal-colgado', 3, '30 s', '-')] },
      { label: 'Volumen', items: [...WARM, it('cal-dominada', 5, '5-8'), it('cal-dominada-supina', 3, '6-8'), it('cal-remo-banda', 3, '12-15'), it('cal-hollow', 3, '30 s', '-'), it('curl-biceps', 3, '10-12', '0-1')] },
      { label: 'Habilidad', items: [...WARM, it('cal-dominada-arquera', 4, '3-5 por lado'), it('cal-dominada-negativa', 3, '4', '1-2'), it('cal-lsit', 4, '12 s', '-'), it('cal-superman', 3, '12-15', '1'), it('cal-parada-manos', 4, '20 s', '-')] },
    ],
  },
]

// ---------- Progresiones por patrón ----------
export const CALI_PROGRESSIONS = [
  { id: 'empuje', name: 'Empuje (pecho, hombros, tríceps)', steps: [
    ['cal-flexion-inclinada', 'Cuando hagas 3×15 limpias'], ['cal-flexion', '3×15 con técnica perfecta'], ['cal-flexion-pies-elevados', '3×12'],
    ['cal-flexion-diamante', '3×12'], ['cal-flexion-arquera', '3×8 por lado → hacia la flexión a una mano'] ] },
  { id: 'hombros', name: 'Hombros y parada de manos', steps: [
    ['cal-mov-hombros', 'Siempre antes de empujar'], ['cal-pike', '3×10'], ['cal-parada-manos', 'Hold de 30 s ×3'] ] },
  { id: 'tiron', name: 'Tirón (espalda, bíceps)', steps: [
    ['cal-colgado', '3×45 s'], ['cal-remo-invertido', '3×12'], ['cal-dominada-negativa', '4×6 lentas'], ['cal-dominada', '4×8 limpias'],
    ['cal-dominada-supina', '3×8'], ['cal-dominada-lastre', '3×6 con +10 % de tu peso'], ['cal-dominada-explosiva', 'Pecho a la barra: ruta al muscle-up'], ['cal-dominada-arquera', 'Ruta a la dominada a un brazo'] ] },
  { id: 'piernas', name: 'Piernas', steps: [
    ['cal-sentadilla', '3×20'], ['cal-zancada', '3×12 por lado'], ['cal-bulgara', '3×10 por lado'], ['cal-sentadilla-salto', '3×12'], ['cal-pistol-asistida', '3×6 por lado → pistol libre'] ] },
  { id: 'core', name: 'Core', steps: [
    ['cal-plancha', '3×60 s'], ['cal-escaladores', '3×40 s'], ['cal-hollow', '3×30 s'], ['elevacion-piernas', '3×12'], ['cal-lsit', 'Hold de 15 s ×4'] ] },
  { id: 'cadera', name: 'Glúteo y cadera', steps: [
    ['cal-puente-gluteo', '3×20'], ['hip-thrust', 'Con barra: 3×10 con peso'] ] },
]
