import type { AboutConcept, AboutMaterialItem, AboutValue } from '../types';

// Requested web narrative, not a literal transcription of the brandbook.
// Editorial approval status is recorded in aboutContentProvenance below.
export const aboutCopy = {
  question: '¿QUÉ ES CÈL·LULA?',
  definitionTitle: '¿QUÉ ES CÉLULA?',
  introActLabel: '01 / DESCOMPONER',
  introLabel: 'LA PREGUNTA VIVA',
  introAnnotation: 'UNA PREGUNTA ABIERTA',
  scrollLabel: 'SIGUE LA PREGUNTA',
  valuesLabel: 'LO QUE NOS MUEVE',
  valuesAriaLabel: 'Valores de CÈL·LULA',
  declaration: 'NO SOMOS UNA SOLA COSA.',
  declarationLines: ['NO SOMOS', 'UNA SOLA COSA.'],
  introduction: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  decomposeTitle: 'UNA IDEA PUEDE TOMAR MUCHAS FORMAS.',
  decomposeDescription: 'Mirar de cerca, separar las partes y encontrar una nueva posibilidad entre ellas.',
  connectTitle: 'CREAR. EXPLORAR. CONECTAR.',
  connectDescription: 'Tres maneras de acercarse a una idea. Un proceso que permanece abierto.',
  ecosystemActLabel: '02 / CONECTAR',
  systemTitle: 'UN SISTEMA VIVO.',
  ecosystemHint: 'Elige una palabra y descubre cómo se relaciona con las demás.',
  ecosystemAriaLabel: 'Explora el ecosistema de CÈL·LULA',
  conceptValuesLabel: 'Valores relacionados',
  transformTitle: 'NADA SE QUEDA IGUAL.',
  transformDescription: 'Cada encuentro cambia la forma de mirar. Lo que empieza como una pregunta puede convertirse en otra cosa.',
  finale: 'LAS IDEAS CAMBIAN CUANDO SE ENCUENTRAN.',
  finaleActLabel: '03 / TRANSFORMAR',
  finaleLabel: 'MOSTRAR LA MATERIA',
  finaleKicker: 'LA FORMA NUNCA ES DEFINITIVA',
  organismCaption: 'TRES IMPULSOS / UN ENCUENTRO',
  finaleLines: ['LAS IDEAS', 'CAMBIAN CUANDO', 'SE ENCUENTRAN.'],
  finaleSupport: 'Un espacio donde el proceso es visible, la creación se comparte y las formas permanecen abiertas.',
  exhibitionLinkLabel: 'EXPLORAR EXPOSICIONES',
} as const;

export const aboutValues = [
  'Experimentación',
  'Transparencia',
  'Evolución',
  'Comunidad',
  'Curaduría',
  'Autenticidad',
] as const satisfies readonly AboutValue[];

export const aboutConcepts = [
  {
    id: 'crear',
    label: 'CREAR',
    number: '01',
    title: 'Dar forma a una idea.',
    description: 'Probar materiales, combinar gestos y dejar que una intuición encuentre su propia forma.',
    values: ['Experimentación', 'Autenticidad'],
  },
  {
    id: 'explorar',
    label: 'EXPLORAR',
    number: '02',
    title: 'Seguir una pregunta.',
    description: 'Mirar desde otro lugar, ensayar caminos y descubrir posibilidades durante el proceso.',
    values: ['Transparencia', 'Evolución'],
  },
  {
    id: 'conectar',
    label: 'CONECTAR',
    number: '03',
    title: 'Encontrar algo en común.',
    description: 'Poner ideas en relación y observar qué aparece cuando formas y miradas se encuentran.',
    values: ['Comunidad', 'Curaduría'],
  },
] as const satisfies readonly AboutConcept[];

const originalPhotographySource = 'https://drive.google.com/drive/folders/1O35VPUPoct2djKPe32RDthPSTHSllnhd?usp=drive_link';

// These slots reserve composition roles. They do not represent delivered photos.
// Populate dimensions, descriptive alt, caption and source only from designer originals.
export const aboutMaterial = {
  label: '03 / TRANSFORMAR',
  title: 'MOSTRAR LA MATERIA',
  description: 'Cuerpos, gestualidad, materia y procesos.',
  images: [
    { id: 'body-gesture', category: 'bodies', status: 'pending-original', src: null, alt: '', caption: null, width: 0, height: 0, sourceReference: originalPhotographySource },
    { id: 'matter-organism', category: 'matter', status: 'pending-original', src: null, alt: '', caption: null, width: 0, height: 0, sourceReference: originalPhotographySource },
    { id: 'creative-process', category: 'process', status: 'pending-original', src: null, alt: '', caption: null, width: 0, height: 0, sourceReference: originalPhotographySource },
  ] as const satisfies readonly AboutMaterialItem[],
} as const;

export const aboutContentProvenance = {
  brandbook: {
    file: 'CEL-LULA_Brandbook.pdf',
    year: 2026,
    sha256: '89eb5d4be33c63e2ce03adb860e01076b8b46b8bb9cc4783021f5fced51ee7e0',
    pageCount: 43,
  },
  officialValues: { classification: 'official', page: 7 },
  brandConcept: { classification: 'official', page: 8, text: 'SISTEMA VIVO' },
  webNarrative: {
    classification: 'editorial-adaptation',
    approval: 'pending-editorial-validation',
    basisPages: [6, 8, 9],
  },
  valueGrouping: {
    classification: 'editorial-proposal',
    approval: 'pending-editorial-validation',
    source: 'About 2.0 brief, phase 5.3; not an official brandbook grouping',
  },
  finaleSupport: {
    classification: 'editorial-proposal',
    approval: 'pending-editorial-validation',
    source: 'About 2.0 brief, phase 6.4',
  },
  photography: {
    status: 'awaiting-designer-originals',
    basisPages: [30, 31, 32],
    source: originalPhotographySource,
    required: ['original file', 'actual width and height', 'descriptive alt', 'caption and author credit', 'approved crop'],
  },
} as const;
