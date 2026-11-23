# Exhibition — Featured y CardSwap

## Implementado y montado

HomeLanding contiene una única sección `#exposiciones`, después de About y antes
de Laboratory. Su portada `ExhibitionFeatured` introduce el CardSwap existente;
no posee navegación ni estado de carrusel propio.

- `data/featured-exhibition.ts`: fotografía, variante blur, encuadre y datos
  editoriales provisionales. Cambiar el recurso no requiere reescribir el reveal.
- `components/exhibition-featured.tsx`: un ScrollTrigger coordina presencia,
  enfoque, mantenimiento, desenfoque y salida hacia Cream mediante opacidades.
- `styles/exhibition-featured.css`: presentación local consolidada de la portada
  y su galería; no modifica Home ni About.
- `ExhibitionCardSwap`: selección de obra, ficha, controles y anuncios accesibles.
- `CardSwap.tsx`: motor adaptado con navegación manual, drag, hover y focus;
  la integración usa `autoplay={false}`.
- `demo-artworks.ts`, `exhibition-copy.ts` y `types.ts`: datos y contratos actuales.

Sin JavaScript o con reduced motion, la portada conserva la imagen nítida y el
texto. El blur es un asset preprocesado: no se anima un filtro de gran radio.
Las capas decorativas no duplican el contenido accesible y el efecto limpia
su timeline y trigger al desmontar.

## Recursos y contenido provisional

Se utiliza `public/exhibitions/halo/Halo_05-1200x800.jpg` y su variante
`Halo_05-blurred.webp`. La referencia entregada es Rinko Kawauchi — Halo (2017).
La portada conserva placeholders aprobados para composición, no información
definitiva de programación. `editorialStatus` y `publicationRights` permanecen
en `pending-confirmation`; el uso en desarrollo no acredita derechos de publicación.

Las cinco obras SVG son demos. Tres también se reutilizan en las muestras
temporales de Laboratory; no son assets duplicados eliminables.

## Implementado pero pospuesto

ExhibitionPage, ExhibitionSlider, su metadata, CSS y tests se conservan para una
galería futura. **No existe actualmente la ruta `/exposiciones`**, ni el preview
`/exposiciones?preview=card-swap`. El CTA hacia esa ruta se retiró de la landing.
El barrel conserva Slider y CardSwap sin activar páginas adicionales.

## Procedencia y verificación

La procedencia está en `card-swap-provenance.json` y el snapshot upstream
correspondiente. Sus campos `previewRoute` y `existingRoutePreserved` describen
la integración histórica, no rutas vigentes; se conservan sin reescribirlos.
No renombrar el motor ni retirar avisos sin actualizar esa
trazabilidad. La geometría, licencia y adaptaciones se documentan en
[la revisión de CardSwap](../../../docs/exhibition-card-swap-geometry.md).

Los tests vigentes cubren motor, controles, contenido, hidratación, portada y
composición en Home. Los de Slider y Page conservan contratos futuros; no prueban
que exista una ruta Next.js. El script histórico de navegador mantiene una
comprobación de `/exposiciones` incompatible con la landing actual; véase
[scripts](../../../docs/scripts.md) antes de ejecutarlo.
