# Laboratorio

Desarrollo en `feature/laboratory`, creada desde el commit tipografico `0548093`
de `test/integration`. La funcionalidad no se confirma ni se fusiona
automaticamente. No se modifica `main`.

## Composicion

- `LaboratorySection`: seleccion y composicion del carrusel/detalle.
- `LaboratoryCarousel` / `LaboratoryCard`: presentacion, controles y fuentes
  visuales de las transiciones.
- `useLaboratoryCarousel`: posiciones en refs y GSAP, loop vertical, hover,
  Pointer Events, teclado, pausa y limpieza.
- `useLaboratoryDetail`: captura FLIP, expansion/retorno, focus trap, Escape,
  scroll lock e inert; `LaboratoryDetail` presenta el contenido en un portal.
- `types.ts`: contrato tipado, imagenes, galerias y metadatos opcionales.
- `data/laboratories.ts`: tres muestras temporales reemplazables.
- `styles/laboratory.css`: composicion de seccion; las hojas de seccion, carrusel
  y detalle se importan una sola vez desde HomeLanding.

GSAP Flip esta disponible en la instalacion actual de GSAP 3.15.0. No se
incorporan librerias externas de carrusel ni Three.js. La captura y transicion
usan el plugin existente, segun la
[documentacion oficial](https://gsap.com/docs/v3/Plugins/Flip/).

## Contenido

Las tres entradas son **muestras temporales**, no laboratorios reales ni
contenido definitivo. Reutilizan los SVG de demostracion existentes en
`public/exhibitions/`; no se inventan autores, creditos ni fechas.
El indicador temporal se muestra en la seccion y en cada detalle.

Reemplazar `demoLaboratories` o pasar un array `readonly Laboratory[]` a
`LaboratorySection`. Cada entrada tiene `id` y `slug` propios, textos, una
portada con dimensiones/alt y una galeria (puede ser vacia). `year`, `credits`
y `temporary` son opcionales. Mantener IDs unicos y textos alternativos reales.

## Destinos existentes

`#laboratorio` sigue perteneciendo a About / QUE ES CELULA y conserva el enlace
del hero. La nueva seccion usa **`#laboratorios`**, enlazada por LAB en el menu
y por la configuracion compartida. No hay IDs duplicados ni cambios de rutas.
La seccion se compone despues de Exposiciones y antes del footer Contact.

## Movimiento y accesibilidad

La velocidad base es la prop `speed` de `LaboratoryCarousel`, expresada en
pixels/segundo (28 por defecto). GSAP actualiza posiciones sin renders de React
por frame. La geometria se recalcula al redimensionar. Las copias necesarias
para selecciones pequenas no agregan botones accesibles duplicados.

El autoplay se puede pausar. Hover ralentiza el movimiento; el teclado dispone
de botones y flechas arriba/abajo. El arrastre se distingue del toque mediante
un umbral de movimiento. La rueda no se intercepta y el bloqueo de scroll de
fondo se limita a la vista fullscreen.

El detalle restaura imagen, estilos, inert y foco antes de retirar el portal y
reanudar el estado previo del carrusel. Una pausa manual se conserva. Se respeta
`prefers-reduced-motion` sin autoplay ni transiciones complejas, incluyendo
cambios de preferencia durante una transicion. Listeners, ticker, observadores
y animaciones se limpian al desmontar.

Acid Grotesk y Basis Mono se heredan del sistema global. Se usan los tokens
cromaticos existentes. Wordmark, simbolo, HomeIdentity, Liquid Gradient,
timelines del menu y logica de Exhibition no se modifican.

## Validacion

| Comprobacion | Resultado |
| --- | --- |
| `npm run typecheck` | Aprobado. |
| `npm run lint` | Aprobado, sin errores ni advertencias. |
| `npm run test:run -- --maxWorkers=1 --pool=threads` | 11 archivos, 78 pruebas aprobadas; sin cambiar timeouts. |
| `npm run build` | Aprobado; rutas `/`, `/_not-found` y `/exposiciones`. |
| Teclado nativo en Chrome desktop | Tab/Shift+Tab, flechas, Enter y Escape aprobados, sin scroll interno ni desplazamiento de pagina al cambiar de tarjeta. |
| Revision visual final | Recorridos desktop/tablet/movil/reduced en curso; se actualizara con sus informes. |

Las pruebas cubren composicion, seleccion unica, loop periodico, hover/drag,
pausa, teclado, movimiento reducido, limpieza, foco/inert/estilos del detalle,
cierre durante apertura y resize. Las pruebas originales de Home, navegacion,
Liquid Gradient y Exhibition siguen pasando.

Durante la validacion se corrigieron nuevas regresiones de FLIP interrumpido por
el scrollbar, limites de tamano tras resize, cierre desde la expansion actual,
restauracion de autoplay despues de Escape y scroll del foco nativo en tarjetas
transformadas. Hay pruebas de regresion y verificacion de navegador para estos
casos. Los textos alternativos tambien se declaran explicitamente en Image.

El guion local reproducible y las capturas/informes estan fuera del repositorio:
[check-laboratory.mjs](../../../../verification/check-laboratory.mjs),
`verification/laboratory-*.json` y `verification/laboratory-*.png` en el workspace.
El contenido real y el cotejo visual de Figma permanecen pendientes; las pruebas
no afirman fidelidad contra un documento inaccesible ni cobertura universal de
todos los navegadores.

## Archivos de esta funcionalidad

Nuevos, relativos a `src/features/laboratory/`:

- `README.md`
- `types.ts`
- `data/laboratories.ts`
- `components/laboratory-section.tsx`
- `components/laboratory-carousel.tsx`
- `components/laboratory-card.tsx`
- `components/laboratory-detail.tsx`
- `components/laboratory-loop.ts`
- `components/use-laboratory-carousel.ts`
- `components/use-laboratory-detail.ts`
- `components/laboratory-section.test.tsx`
- `components/laboratory-carousel.test.tsx`
- `components/laboratory-detail.test.tsx`
- `components/laboratory-loop.test.ts`
- `styles/laboratory.css`
- `styles/laboratory-carousel.css`
- `styles/laboratory-detail.css`

Modificados, relativos a la raiz del repositorio:

- `src/features/laboratory/index.ts`: export publico y tipos.
- `src/features/home/components/home-landing.tsx`: composicion y estilos locales.
- `src/features/home/components/home-navigation-content.tsx`: destino LAB.
- `src/features/home/components/home-navigation.test.tsx`: contrato y navegacion.
- `src/shared/config/navigation.ts`: destino compartido del laboratorio.
