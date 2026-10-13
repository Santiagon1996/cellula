import type { AboutConcept } from '../types';

// Provisional editorial content. Approval status stays visible in the section.
export const aboutCopy = {
  question: '¿QUÉ ES CÉLULA?',
  declaration: 'NO SOMOS UNA SOLA COSA.',
  introduction: 'Un espacio para la creación, el arte y la experimentación.',
  decomposeTitle: 'UNA IDEA PUEDE TOMAR MUCHAS FORMAS.',
  decomposeDescription: 'Mirar de cerca, separar las partes y encontrar una nueva posibilidad entre ellas.',
  connectTitle: 'CREAR. EXPLORAR. CONECTAR.',
  connectDescription: 'Tres maneras de acercarse a una idea. Un proceso que permanece abierto.',
  transformTitle: 'NADA SE QUEDA IGUAL.',
  transformDescription: 'Cada encuentro cambia la forma de mirar. Lo que empieza como una pregunta puede convertirse en otra cosa.',
  finale: 'LAS IDEAS CAMBIAN CUANDO SE ENCUENTRAN.',
  exhibitionLinkLabel: 'EXPLORAR EXPOSICIONES',
  pendingNotice: 'COPY PENDIENTE DE APROBACIÓN',
} as const;

export const aboutConcepts = [
  {
    id: 'crear',
    label: 'CREAR',
    number: '01',
    title: 'Dar forma a una idea.',
    description: 'Probar materiales, combinar gestos y dejar que una intuición encuentre su propia forma.',
  },
  {
    id: 'explorar',
    label: 'EXPLORAR',
    number: '02',
    title: 'Seguir una pregunta.',
    description: 'Mirar desde otro lugar, ensayar caminos y descubrir posibilidades durante el proceso.',
  },
  {
    id: 'conectar',
    label: 'CONECTAR',
    number: '03',
    title: 'Encontrar algo en común.',
    description: 'Poner ideas en relación y observar qué aparece cuando formas y miradas se encuentran.',
  },
] as const satisfies readonly AboutConcept[];
