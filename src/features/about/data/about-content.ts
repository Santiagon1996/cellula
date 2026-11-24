import type { AboutConcept, AboutMaterialItem, AboutValue } from '../types';

export const aboutIntroductionParagraphs = [
  'Nace de la experiencia de transitar distintos ámbitos académicos/creativos- la arquitectura, el tatuaje y las artes visuales- y detectar así necesidades intrínsecas a ellos.',
  'Desde las artes visuales; la materialidad y la relación directa con el público forman parte natural del hacer.',
  'Desde la arquitectura, aparece una mirada estructural: la necesidad de pensar cómo se organizan los espacios, cómo se integran las partes y cómo una lógica clara puede sostener un sistema en el tiempo.',
  'Con el tiempo, se hace evidente que esa integración no sucede de manera aislada. Requiere una estructura que permita articular distintas prácticas sin diluirlas, y una dirección que dé coherencia al conjunto.',
  'CÈL·LULA surge como la búsqueda de ese equilibrio.',
] as const;

// Requested web narrative, not a literal transcription of the brandbook.
// Editorial approval status is recorded in aboutContentProvenance below.
export const aboutCopy = {
  question: '¿QUÉ ES CÈL·LULA?',
  definitionTitle: '¿QUÉ ES CÈL·LULA?',
  introActLabel: '01 / DESCOMPONER',
  introLabel: 'LA PREGUNTA VIVA',
  introAnnotation: 'UNA PREGUNTA ABIERTA',
  scrollLabel: 'SIGUE LA PREGUNTA',
  valuesLabel: 'LO QUE NOS MUEVE',
  valuesAriaLabel: 'Valores de CÈL·LULA',
  declaration: 'NO SOMOS UNA SOLA COSA.',
  declarationLines: ['NO SOMOS', 'UNA SOLA COSA.'],
  introduction: aboutIntroductionParagraphs.join(' '),
  decomposeTitle: 'UNA IDEA PUEDE TOMAR MUCHAS FORMAS.',
  decomposeDescription: 'CÈL·LULA es un laboratorio cultural: un espacio híbrido donde la producción artística y la experimentación conviven. Un entorno vivo donde los procesos creativos son visibles, compartidos y parte esencial de la experiencia.',
  connectTitle: 'CREAR. EXPLORAR. CONECTAR.',
  connectDescription: 'Creemos en el valor del hacer, en la construcción colectiva y en una forma de crear que evoluciona constantemente junto a quienes la habitan.',
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
  activeAboutCopy: {
    source: 'textos-para-web.pdf',
    sourcePage: 1,
    sha256: '81bddaf2b9698ecef5c45077b5fb92a24fda5234bd84ba3a171ebc1610fd8f82',
    approval: 'user-approved',
    introduction: 'Repeated passage removed; PDF line wraps joined.',
    definition: 'Incomplete PDF sentence completed with wording approved by the user.',
    photography: 'Deferred by the user; independent sculpture original pending.',
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
