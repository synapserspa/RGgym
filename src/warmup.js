// Calentamientos y estiramientos guiados: pasos con duración y una indicación corta.
const s = (name, dur, cue) => ({ name, dur, cue })

export const WARMUPS = {
  general: { name: 'Calentamiento general', steps: [
    s('Marcha en el lugar', 45, 'Sube las rodillas y balancea los brazos, a ritmo suave.'),
    s('Círculos de brazos', 30, 'Círculos amplios hacia adelante y luego hacia atrás.'),
    s('Movilidad de muñecas', 30, 'Círculos suaves con las muñecas en ambos sentidos.'),
    s('Gato y camello', 40, 'En cuatro apoyos, arquea y redondea la espalda lento.'),
    s('Sentadilla lenta', 40, 'Baja controlado, pecho alto, y sube empujando el piso.'),
    s('Bisagra de cadera', 30, 'Cadera atrás con la espalda recta, rodillas semiflexionadas.'),
    s('Puente de glúteo', 30, 'Sube la cadera y aprieta los glúteos.'),
    s('Plancha suave', 20, 'Cuerpo recto, abdomen firme.'),
  ] },
  upper: { name: 'Calentamiento de tren superior', steps: [
    s('Marcha en el lugar', 40, 'Sube las rodillas y balancea los brazos.'),
    s('Círculos de brazos', 30, 'Amplios, hacia adelante y hacia atrás.'),
    s('Movilidad de muñecas', 30, 'Círculos y apoyo de las palmas con los dedos hacia ti.'),
    s('Escápulas en el piso o pared', 40, 'Junta y separa las escápulas con los brazos al frente.'),
    s('Rotación de hombros con banda', 40, 'Pasa la banda o un palo de adelante hacia atrás sobre la cabeza.'),
    s('Flexiones lentas', 30, 'Pocas repeticiones, técnica limpia, sin llegar al esfuerzo.'),
    s('Colgado suave en la barra', 25, 'Cuélgate con los hombros activos para soltar el agarre.'),
  ] },
  lower: { name: 'Calentamiento de tren inferior', steps: [
    s('Marcha en el lugar', 45, 'Sube las rodillas a ritmo suave.'),
    s('Círculos de cadera', 30, 'Círculos amplios con las manos en la cintura.'),
    s('Sentadilla lenta', 45, 'Baja controlado y pausa un segundo abajo.'),
    s('Zancada hacia atrás', 40, 'Alterna las piernas con el torso erguido.'),
    s('Bisagra de cadera', 30, 'Cadera atrás, espalda recta.'),
    s('Puente de glúteo', 30, 'Aprieta los glúteos arriba.'),
    s('Elevación de talones', 25, 'Sube y baja los talones despacio.'),
  ] },
}

export const STRETCH = { name: 'Estiramientos para terminar', steps: [
  s('Respiración profunda', 30, 'Inhala por la nariz y exhala lento: baja las pulsaciones.'),
  s('Pecho en el marco de una puerta', 30, 'Antebrazo apoyado y gira el torso hacia el lado opuesto.'),
  s('Dorsales: postura del niño', 30, 'Siéntate sobre los talones y estira los brazos al frente.'),
  s('Hombro cruzado: lado derecho', 25, 'Lleva el brazo derecho al otro lado del pecho.'),
  s('Hombro cruzado: lado izquierdo', 25, 'Lleva el brazo izquierdo al otro lado del pecho.'),
  s('Tríceps: lado derecho', 25, 'Codo arriba, mano a la espalda; empuja el codo suave.'),
  s('Tríceps: lado izquierdo', 25, 'Codo arriba, mano a la espalda; empuja el codo suave.'),
  s('Cuádriceps: pierna derecha', 30, 'De pie, talón al glúteo y rodillas juntas.'),
  s('Cuádriceps: pierna izquierda', 30, 'De pie, talón al glúteo y rodillas juntas.'),
  s('Isquiotibiales sentado', 35, 'Piernas estiradas, inclínate desde la cadera con la espalda recta.'),
  s('Glúteo en figura 4: lado derecho', 30, 'Acostado, tobillo sobre la rodilla opuesta y atrae la pierna.'),
  s('Glúteo en figura 4: lado izquierdo', 30, 'Acostado, tobillo sobre la rodilla opuesta y atrae la pierna.'),
  s('Flexor de cadera: lado derecho', 30, 'Rodilla en el piso, empuja la cadera hacia adelante.'),
  s('Flexor de cadera: lado izquierdo', 30, 'Rodilla en el piso, empuja la cadera hacia adelante.'),
  s('Pantorrillas en la pared', 30, 'Talón atrás en el piso y empuja la pared.'),
] }

// Qué calentamiento corresponde según las zonas del día
export function warmupFor(zones = []) {
  const lower = zones.includes('Piernas'); const upper = zones.some((z) => ['Pecho', 'Espalda', 'Hombros', 'Brazos'].includes(z))
  return lower && !upper ? WARMUPS.lower : upper && !lower ? WARMUPS.upper : WARMUPS.general
}

// Pasos -> segmentos para el temporizador
export const stepsToSegments = (title, steps, prep = 5) => [
  { kind: 'prep', dur: prep, label: 'Prepárate', sub: title, speak: `${title}. Prepárate.` },
  ...steps.map((st, i) => ({ kind: 'work', dur: st.dur, label: st.name, sub: st.cue, count: `${i + 1} de ${steps.length}`, speak: st.name })),
]
