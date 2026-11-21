/** Temporary editorial reference supplied by the user; not a confirmed exhibition listing. */
export const featuredExhibition = {
  label: 'DESTACADO DEL MES',
  title: 'HALO',
  coverTitle: ['NOMBRE', 'DESTACADO', 'DEL MES'],
  coverCaption: 'NOMBRE DEL ARTISTA Y + DATOS',
  artist: 'Rinko Kawauchi',
  year: '2017',
  statusLabel: 'SELECCIÓN PROVISIONAL',
  editorialStatus: 'pending-confirmation',
  publicationRights: 'pending-confirmation',
  image: {
    src: '/exhibitions/halo/Halo_05-1200x800.jpg',
    blurredSrc: '/exhibitions/halo/Halo_05-blurred.webp',
    alt: 'Una figura entre cascadas de chispas y luz en una escena nocturna.',
    width: 1200,
    height: 800,
    position: '50% 50%',
    mobilePosition: '45% 50%',
    source: 'IMÁGENES/destacado mes/halo/Halo_05-1200x800.jpg',
  },
} as const;
