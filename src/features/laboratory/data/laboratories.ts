import type { Laboratory, LaboratoryImage } from '../types';

const images = {
  membrane: { src: '/exhibitions/membrana-rosa.svg', alt: 'Formas de rosa y lavanda sobre un fondo crema.', width: 800, height: 1000 },
  sky: { src: '/exhibitions/corriente-de-cielo.svg', alt: 'Ondas azules alrededor de una forma de color crema.', width: 800, height: 1000 },
  matter: { src: '/exhibitions/materia-blanda.svg', alt: 'Anillos rosa y crema alrededor de un centro azul.', width: 800, height: 1000 },
} satisfies Record<string, LaboratoryImage>;

// Temporary studies reuse existing demo artwork, not real laboratories or credits.
export const demoLaboratories: readonly Laboratory[] = [
  {
    id: 'lab-membrana', slug: 'membrana-rosa', title: 'Membrana rosa', category: 'Forma',
    shortDescription: 'Un estudio de formas que se encuentran.',
    description: 'Dos formas se encuentran y dejan entre ellas un espacio para respirar. Un estudio temporal de proximidad, contorno y espacio compartido.',
    coverImage: images.membrane, gallery: [images.matter, images.sky], temporary: true,
  },
  {
    id: 'lab-corriente', slug: 'corriente-de-cielo', title: 'Corriente de cielo', category: 'Color',
    shortDescription: 'El color como un paisaje en movimiento.',
    description: 'Una corriente lenta atraviesa el color. Un estudio temporal de luz y de las relaciones entre superficies que parecen cambiar de lugar.',
    coverImage: images.sky, gallery: [images.membrane], temporary: true,
  },
  {
    id: 'lab-materia', slug: 'materia-blanda', title: 'Materia blanda', category: 'Materia',
    shortDescription: 'Pliegues, encuentros y nuevas formas.',
    description: 'El color se pliega sobre su propio contorno. Un estudio temporal de materia imaginada, entre formas abiertas y espacios interiores.',
    coverImage: images.matter, gallery: [images.sky, images.membrane], temporary: true,
  },
];
