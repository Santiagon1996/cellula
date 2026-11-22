# Laboratory — Spatial Image Wheel

`LaboratorySection` conserva su API pública y el ancla `#laboratorios`.
Monta una única `LaboratoryImageWheel`; la selección y el único detalle
fullscreen siguen perteneciendo a la sección. Los datos y `LaboratorySelection`
no cambian. Contact y las fases pospuestas de otras features no se modifican.

## Arquitectura

- `data/laboratories.ts`, `types.ts`: proyectos e imágenes originales.
- `data/laboratory-views.ts`: vistas de portada y galería, sin inventar registros.
- `components/laboratory-image-wheel.tsx`: presentación y controles accesibles;
  recibe `laboratories`, `blocked` y `onSelect`, sin poseer otro detalle.
- `components/use-image-wheel.ts`: una rotación angular mutable; RAF temporal
  para cursor/inercia y tween GSAP finito para navegación manual.
- `components/image-wheel-geometry.ts`: fórmula y valores del prototipo 05B
  aprobado, sin cambios de radio, perspectiva, offsets ni velocidad.
- `components/laboratory-circular-geometry.ts`: matemáticas compartidas
  conservadas: envoltura, distancia, destino equivalente y radio de cuerda.
- `components/laboratory-detail.tsx`, `use-laboratory-detail.ts` y su CSS:
  GSAP Flip, bloqueo modal, foco, cierre y restauración originales, sin cambios.

La geometría usa `a = index * step + rotation`, `R sin(a)` en X (desktop)
o Y (mobile), y `frontZ + R(cos(a) - 1)` en Z. La cámara compartida emplea
1000/850 px de perspectiva. No se aplican escalas ni z-index artificiales.
Se mantienen las proporciones originales y las muestras temporales existentes.

El clip queda fuera de la cámara para no aplanar el contexto `preserve-3d`.
No hay filtros, autoplay, snapping, WebGL ni renders React por frame.

## Interacción y accesibilidad

El cursor determina velocidad angular con zona neutra y límite de .85 rad/s.
Salir, ocultar la pestaña, abandonar el viewport, abrir el detalle o desmontar
cancela el movimiento. StrictMode no duplica listeners ni observadores.

En móvil, el estado inicial permite scroll vertical nativo. «Explorar rueda»
activa el drag solo en su región; captura tras el umbral y libera al terminar.
La salida por botón, Escape o los márgenes sigue disponible. La inercia está
limitada a 2.2 rad/s y decae sin snap. No se bloquea el documento para explorar;
el bloqueo modal existente solo se usa mientras está abierto el detalle.

Un primer clic centra una vista; estando de frente abre el proyecto con el
origen y botón reales. Flechas, Home/End y controles de 48 px permiten navegar
sin cursor. Reduced motion mantiene navegación instantánea sin inercia.
Sin JS queda una colección estática con textos e imágenes visibles.
Safari iOS físico necesita revisión específica; Chromium no la sustituye.

## Limpieza y conservación de contratos

| Elemento retirado | Motivo / contrato conservado |
| --- | --- |
| `laboratory-circular-carousel.tsx` | Sustituido por la única rueda activa, con el mismo contrato controlado. |
| `laboratory-circular-card.tsx` | Presentación Frosted descartada; se conservan datos, imágenes y botón de origen en la rueda. |
| `use-circular-carousel.ts` | Motor de snap y arrastre anterior sin consumidores; selección, pausa y cleanup cubiertos en el motor angular. |
| `styles/laboratory-circular-carousel.css` | Selectores y filtros exclusivos del carrusel anterior, sin consumidores. |
| `laboratory-circular-carousel.test.tsx` | Presentación anterior; sus contratos vigentes migran a pruebas de rueda/sección. |
| `laboratory-circular-state.test.tsx` | Tratamiento Frosted obsoleto; identidad, bloqueo y retorno se verifican en integración. |
| `laboratory-circular-hydration.test.tsx` | La matriz de tamaños, preferencias, colecciones y StrictMode pasa al test de hidratación de la rueda. Las capas Frosted ya no existen. |
| `use-circular-carousel.test.tsx` | Tests del motor descartado; velocidad angular, drag, inercia y pausa se prueban en la implementación activa. |
| `circularCardPose`, `snapCircularPosition` | Funciones del aspecto anterior sin consumidores. Permanecen las matemáticas circulares usadas por la rueda y sus pruebas. |
| `prototype/` y dos rutas experimentales | Comparadores y motores descartados, no reservados para otra fase. La rueda útil se promueve a components/styles/data. Todos los archivos sin seguimiento se respaldaron y verificaron por hash antes del retiro. |

Los archivos versionados anteriores siguen recuperables en el historial Git.
El inventario y los respaldos de los archivos experimentales se guardan fuera
del repositorio. No se versionan logs, capturas ni rutas de verificación.

El único cambio en el compositor de Home es retirar el import del CSS circular
eliminado. Su estructura, navegación y secciones permanecen intactas.

## Validación

Las pruebas cubren datos y vistas, geometría 3D, selección controlada, bloqueo,
retorno de foco, cursor, touch, inercia, reduced motion, cleanup y StrictMode.
La hidratación usa el hook y next/image reales en 390/1440 px, ambas
preferencias y 0/1/2/3 proyectos, conservando los nodos iniciales.

Ejecutar secuencialmente `npm run typecheck`, `npm run lint`,
`npm run test:run` y `npm run build`. La revisión de navegador debe reproducir
los siete tamaños acordados y el ciclo completo de apertura/cierre en la landing.

Las fórmulas circulares proceden de la adaptación previa de React Bits:
https://reactbits.dev/components/circular-carousel . Se conserva su atribución
y [licencia](REACT-BITS-LICENSE.md), sin instalar un paquete adicional.
