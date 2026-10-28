# Laboratory — Circular Carousel y Frosted Glass

Rama `feature/laboratory-circular-carousel`, creada desde
`bda2867662fe30edab0511ee2acc0af41a3ca14c` (`brand`), el commit que contiene
Laboratory y el sistema de marca validado. Al preparar la rama, `main` y
`origin/main` seguían en `cdd15ce`; el árbol de trabajo estaba limpio y la rama
nueva no existía. Se ejecutó `git fetch origin`. El avance circular quedó
guardado en **`41c168111cde69c302fb3d6e5f09571ef998566b`**, con el mensaje
`feat(laboratory): implement responsive circular carousel`, después de repetir
TypeScript, ESLint, las 222 pruebas y el build. Se prepararon exclusivamente
sus 14 archivos y se revisó el diff del índice. Ese commit no incluye el
tratamiento Frosted Glass descrito abajo, que queda como cambio local para
revisión. No se realiza un segundo commit ni push, merge o rebase.

La [limpieza de archivos sin uso](#limpieza-de-archivos-sin-uso) es posterior
a las validaciones históricas del carrusel y de hidratación descritas aquí.

## Frosted Glass — tratamiento actual

La selección por `laboratory.id` y `data-active` controla la nitidez. La tarjeta
activa conserva `filter: none`, opacidad de imagen 1 y veladura 0. Hover y foco
siguen revelando la información y su escala suave, con la imagen nítida; se
retiran el blur activo de 1,5 px en móvil y el de 2 px del hover anterior.

| Propiedad de las imágenes inactivas | Móvil, menos de 768 px | Desktop, desde 768 px |
| --- | --- | --- |
| Blur | 3 px | 4 px |
| Contraste | 90 % | 90 % |
| Saturación | 95 % | 95 % |
| Opacidad de la imagen | 100 % | 100 % |
| Veladura | 28 % | 28 % |
| Transición de filtro y veladura | 0,55 s | 0,55 s |

La veladura es un gradiente de Cream a una mezcla Cream 75 % / Slate 25 %,
aplicado con opacidad 0,28. La variación suave conserva color y silueta y da
profundidad al cristal. Todos los colores proceden de los tokens oficiales.
El easing CSS es `cubic-bezier(.215, .61, .355, 1)` y acompaña el snap de 0,55 s.
Con movimiento reducido los cambios de estado se resuelven inmediatamente.

Las capas están separadas: una imagen original con su filtro, una veladura
decorativa `aria-hidden` y el contenido editorial fuera de ambas. Se filtra
únicamente la imagen; bordes, textos, foco y controles conservan nitidez.
La capa Frosted está dentro de `[data-lab-media]`, tiene `pointer-events: none`
y se oculta junto con el origen cuando actúa Flip. El fullscreen utiliza su
imagen y selectores propios y no recibe filtro ni veladura.

Se mantienen la geometría, el ID seleccionado, las transiciones Flip, el scroll
nativo móvil y todos los controles. No se añade `backdrop-filter`, otra imagen,
dependencias, WebGL, estado React por frame ni bucles GSAP. Las transiciones
CSS solo se producen cuando cambia la selección de las tarjetas implicadas;
los vecinos que no cambian de estado mantienen sus estilos.

Archivos del tratamiento, sin preparar ni versionar:

- `components/laboratory-circular-card.tsx`: capa decorativa dentro de la media.
- `styles/laboratory-circular-carousel.css`: estados, veladura, blur responsive
  y movimiento reducido.
- `components/laboratory-circular-state.test.tsx`: integración con el hook real,
  selección y estado accesible por ID, cambio de eje, bloqueo/retorno del detalle
  y capas decorativas sin duplicar imágenes ni descripciones.
- Este README: SHA inicial, decisiones y evidencia del tratamiento.

Validación del tratamiento, 23 de octubre de 2026:

| Comprobación | Resultado |
| --- | --- |
| TypeScript, ESLint y build | Correctos; ejecutados de nuevo después del tratamiento. |
| `npm run test:run -- --maxWorkers=2` | **25 archivos, 225 pruebas aprobadas**, incluidas tres pruebas nuevas con el hook real. |
| Navegador de producción local | Nueve escenarios: movimiento normal a 320, 375, 390, 430, 768, 1024 y 1440 px; reducido a 390 y 1440 px. |
| Nitidez y capas | Activa con `filter: none`, imagen a opacidad 1 y veladura 0; inactivas con blur 3/4 px, contraste 0,9, saturación 0,95 y veladura 0,28. Texto, media y título sin filtro; una imagen por estudio. |
| Transición | Se muestrean inicio, punto intermedio y final. En móvil la nueva activa pasa de 3 a 0,95 a 0 px de blur y su veladura de 0,28 a 0,089 a 0; la opacidad de su imagen permanece en 1. |
| Hover y foco | Revelan el contenido sin recuperar el blur activo anterior. Controles, nombre y descripción accesibles conservados. |
| Geometría | Mismas matrices y opacidades de profundidad que en el commit inicial en los nueve escenarios, sin desbordamiento de página. |
| Navegación | Anterior/siguiente, teclado, drag horizontal con snap y cambio de orientación conservando el ID. Swipe móvil real desplaza la página **246 px** sin abrir el detalle. |
| Fullscreen | Cuatro recorridos con imagen y portada sin filtro ni veladura; Escape, contención/restauración del foco e `inert` correctos. El retorno conserva ID y tratamiento. |
| Movimiento reducido y reposo | Transición calculada de 0 s con la preferencia activa. Dos periodos de 15 segundos en reposo mantienen ID y geometría, sin autoplay. |
| Consola y recursos | Sin errores JavaScript ni recursos de la aplicación con HTTP de error. |

Se revisaron las capturas móviles y de escritorio, incluido hover: los vecinos
conservan silueta y color bajo un tratamiento suave; la activa permanece
reconocible y nítida. La menor intensidad móvil limita el trabajo del filtro.

Se compararon los dos tratamientos en una misma página a 390 px, con CPU de
Chrome ralentizada 4×: calentamiento y tres tandas alternadas por variante,
cuatro snaps por tanda. La mediana de `TaskDuration` pasó de 2,236 a 2,448 s
(+9,5 %) y la de `RecalcStyleDuration` de 0,303 a 0,362 s. El percentil 95 del
intervalo entre frames fue 16,9 / 16,8 ms, con una mediana de un long task en
ambas variantes. En esta observación no aparece una caída consistente de la
cadencia de frames. El efecto tiene un coste de tareas medible y mantiene la
intensidad móvil menor; no añade imágenes, paquetes ni renderizados React por
frame.

[Datos A/B controlados](../../../../verification/laboratory-frosted/performance-ab.json).
La comparación usa una emulación de Chrome sin ventana, no una GPU móvil
física. Se descartaron los calentamientos y los intentos sin reloj de frames;
los resultados publicados corresponden a las seis tandas válidas con el target
activo. Las observaciones entre cargas de página fueron variables y no se usan
para atribuir una mejora de rendimiento al tratamiento.

La pausa fija inicial de un caso de navegador leyó un filtro aún intermedio
bajo carga. El guion pasó a esperar los estilos finales y completó los nueve
escenarios sin cambios en la aplicación. JSDOM comprueba el contrato de
selección y accesibilidad; los valores de filtro y las transiciones anteriores
proceden de estilos calculados en Chrome.

[Comparador Frosted Glass antes/después](../../../../verification/laboratory-frosted/review.html)
· [Estado guardado](../../../../verification/laboratory-frosted/before.json)
· [Estado y recorridos actuales](../../../../verification/laboratory-frosted/after.json)
· [Guion de navegador](../../../../verification/check-laboratory-frosted.mjs).

| Capturas del tratamiento | 390 px | 1440 px |
| --- | --- | --- |
| Antes del efecto | [Anterior](../../../../verification/laboratory-frosted/before-390-normal.png) | [Anterior](../../../../verification/laboratory-frosted/before-1440-normal.png) |
| Después | [Actual](../../../../verification/laboratory-frosted/after-390-normal.png) | [Actual](../../../../verification/laboratory-frosted/after-1440-normal.png) |
| Fullscreen nítido | [Detalle](../../../../verification/laboratory-frosted/after-390-normal-fullscreen.png) | [Detalle](../../../../verification/laboratory-frosted/after-1440-normal-fullscreen.png) |

La evidencia anterior del carrusel guardado se conserva más abajo. Las capturas
del tratamiento corresponden al build ejecutado localmente; no se realiza un
despliegue ni un segundo commit.

## Diagnóstico de hidratación

El error comunicado también figuraba en el log anterior de desarrollo. El
signo `-` de React señala un `span.laboratory-circular-card__frost` presente
en el HTML del servidor que el cliente no esperaba dentro de la media.
Es una discrepancia estructural; la traza por sí sola no identifica la
condición que hizo divergir ambas versiones.

La auditoría no encontró esa condición en la fuente actual. La capa Frosted
ya se renderiza incondicionalmente, inmediatamente después de `Image`, tanto
para la tarjeta activa como para sus vecinas. CSS controla su opacidad con
`data-active`. Los IDs proceden de `useId` y de los datos originales. La
selección inicial es el primer ID y la orientación inicial es `vertical` en
ambos entornos. Las medidas, `matchMedia`, transformaciones y listeners se
ejecutan en `useLayoutEffect`, después de hidratar, conservando los nodos.

Los bundles SSR y cliente de desarrollo inspeccionados contenían la misma
fuente de Card, con la capa incondicional. El build de producción anterior
tampoco reprodujo el fallo: cuatro escenarios conservaron raíz, viewport,
tarjetas, botones, imágenes, veladuras y captions. Por tanto, no se atribuye
el error a `matchMedia`, a GSAP ni a una caché sin evidencia adicional. Una
ejecución con HTML nuevo y cliente anterior es compatible con el diff,
pero su origen no ha quedado demostrado en el entorno del fallo.

Se añade `components/laboratory-circular-hydration.test.tsx`, con el hook y
`next/image` reales:

- 16 combinaciones de 390/1440 px, movimiento normal/reducido y 0/1/2/3 estudios.
- Cuatro casos de hidratación, desmontaje y nueva hidratación con Strict Mode.
- Navegación y vuelta circular real con dos estudios en móvil y desktop.
- Un control negativo que simula expresamente servidor con Frosted y cliente
  sin esa capa. Debe detectar el mismo `- span` y el reemplazo del DOM; no
  constituye una reproducción del origen del incidente del usuario.

Los casos positivos usan `renderToString` sin globals del navegador y
`hydrateRoot` con `onRecoverableError`, interceptan `console.error` y exigen
conservar los mismos nodos e IDs. También comparan el HTML de ambos renders
iniciales antes de ejecutar efectos. Esta primera versión contenía 22 pruebas; el control negativo
comprueba que el detector falla cuando la estructura realmente diverge.

La instrumentación de navegador retiene los scripts de Next, guarda los nodos
SSR y los compara tras liberar JavaScript; la captura de consola, errores y
promesas rechazadas empieza antes de cargar la página. Esta comprobación
incluye recarga con caché fría, navegación, cambio de eje, acciones rápidas y
apertura/cierre con Flip y retorno del foco. JSDOM no se utiliza para afirmar
el blur visual ni la geometría real.

Validación técnica final del 23 de octubre de 2026:

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto. |
| `npm run lint` | Correcto. |
| `npm run test:run -- --maxWorkers=2` | **26 archivos y 247 pruebas aprobadas**, incluidas las 22 de hidratación. |
| `npm run build` | Correcto. Build `vAO7fDc17U5IcZcAN6r3Y`; `/`, `/_not-found` y `/exposiciones` estáticas. |
| Desarrollo, Chrome real | **9 escenarios aprobados**: los siete anchos solicitados, más movimiento reducido a 390/1440 px. Recarga fría y mismos nodos SSR en todos. |
| Fast Refresh real | **390 y 1440 px aprobados**, con evento de recompilación registrado. Conserva nodos, selección y foco; cada acción sigue avanzando un estudio. |
| Producción, Chrome real | **9 escenarios y 18 hidrataciones aprobadas** a 320, 375, 390, 430, 768, 1024 y 1440 px, más reducido a 390/1440. Carga inicial y recarga fría conservan todos los nodos; cero errores de hidratación, consola, ventana y recursos de la aplicación, y cero avisos. |
| Posición inicial | Raíz, viewport y tarjeta activa mantienen exactamente sus coordenadas y dimensiones SSR → hidratado: diferencias de 0 px en los nueve escenarios. |
| Navegación y detalle | Cambio de eje conserva ID y foco; ocho acciones consecutivas en cada dirección se asientan correctamente. Tres activaciones rápidas abren un único detalle; Flip, Escape, `inert` y retorno del foco correctos. |
| Capturas finales | Los tres SVG están cargados y decodificados, con sus dimensiones naturales de 800 × 1000, en los nueve escenarios. Activa nítida y vecinas con blur y veladura. |
| Reposo y visibilidad | Dos periodos de 15 s a 390 px y dos a 1440 px mantienen ID y matrices. Salir y regresar a la pestaña y al viewport no inicia movimiento. |

La comprobación de Fast Refresh añadió un comentario temporal y restauró
después los bytes originales de Card, cuyo SHA-256 vuelve a
`b47d1c487bac48795609aa63503e94ae136de1da9439d60bf7244a2e78d7a0fa`.
No queda ese comentario en el código. En desarrollo apareció un aviso real
de Next Image sobre el LCP de `/exhibitions/membrana-rosa.svg`; no es un
error de hidratación y no se modificó Exhibition para silenciarlo.

Se revisaron las capturas de producción a 320, 390, 768 y 1440 px. Una primera
captura a 1440 px mostró vecinos grises; el guion todavía no esperaba la
decodificación de las imágenes. Se añadieron mediciones de carga y espera de
`decode()` y se guardaron de nuevo las nueve capturas, sin modificar la
aplicación. Como no se midió la carga en aquella primera captura, no se afirma
que el timing fuera su única causa demostrada. Los resultados visuales finales
corresponden a las imágenes verificadas como cargadas.

Esta validación usa Chrome real sin ventana y viewport emulado; no sustituye
una prueba en un dispositivo móvil físico ni reproduce el estado del navegador
en el que se produjo el incidente anterior. No se ha identificado de manera
concluyente la causa de esa ejecución histórica, por lo que la ausencia actual
del error no se presenta como prueba de una corrección de lógica inexistente.

[Diagnóstico y traza conservada](../../../../verification/laboratory-hydration/diagnosis.md)
· [Desarrollo](../../../../verification/laboratory-hydration/development-summary.json)
· [Fast Refresh](../../../../verification/laboratory-hydration/fast-refresh.json)
· [Producción](../../../../verification/laboratory-hydration/after-summary.json)
· [Capturas comparadas](../../../../verification/laboratory-hydration/review.html)
· [Carga de imágenes](../../../../verification/laboratory-hydration/capture-readiness.json)
· [Reposo y visibilidad](../../../../verification/laboratory-hydration/stability.json)
· [Guion de navegador](../../../../verification/check-laboratory-hydration.mjs).
El informe distingue los hechos observados de las hipótesis. No se oculta el
error, no se desactiva SSR ni se introduce una reconstrucción vacía inicial.
La investigación conserva la lógica de producción y el tratamiento Frosted
existentes; no se presenta una refactorización cosmética como corrección de
una condición que no se ha encontrado.

Estado Git al cerrar la revisión de hidratación, antes de la limpieza:
rama `feature/laboratory-circular-carousel`, HEAD `41c1681`,
índice vacío. Permanecen cinco archivos pendientes: este README, Card, CSS,
`laboratory-circular-state.test.tsx` y el nuevo test de hidratación. Esta
investigación añade el test de hidratación y la documentación; conserva los
cambios Frosted previos y no modifica la lógica del carrusel ni de Flip.
No se realiza commit ni push.

## Limpieza de archivos sin uso

El 23 de octubre de 2026 se eliminaron 14 archivos después de comprobar sus
importaciones, reexportaciones e importaciones dinámicas desde las rutas de
Next. Los archivos retirados no formaban parte del render activo:

- Laboratory anterior: `laboratory-carousel.tsx`, `laboratory-card.tsx`,
  `use-laboratory-carousel.ts`, `laboratory-loop.ts`, `laboratory-carousel.css`,
  `laboratory-carousel.test.tsx` y `laboratory-loop.test.ts`.
- Componentes y utilidades desconectados: `home-intro.tsx`,
  `home-intro.test.tsx`, `shared/ui/container.tsx`,
  `shared/config/navigation.ts` y `shared/motion/index.ts`.
- Los dos `.gitkeep` de las carpetas Acid Grotesk y Basis Grotesque Mono,
  que ya contienen fuentes versionadas.

También se retiró `laboratoryCopy.openStudy`, consumido únicamente por el
componente anterior, y se corrigieron las referencias de arquitectura y
recursos. Las auditorías históricas conservan su significado con una nota de
retirada. Se mantienen todos los recursos oficiales, el generador de los
pósteres del degradado, la licencia de React Bits y los cambios Frosted locales.

Se borraron `.next` y `tsconfig.tsbuildinfo` con el servidor local detenido,
y se reconstruyó la aplicación para regenerar sus artefactos desde cero.
Next actualiza `next-env.d.ts` para importar los tipos recién generados en
`.next/types`, sin depender del directorio de desarrollo anterior.

Los tres archivos de pruebas retirados contenían 22 casos del código legado;
las 22 pruebas nuevas de hidratación se conservan. La reducción del número
total de pruebas corresponde exclusivamente a los componentes eliminados.
Esta limpieza no modifica el carrusel circular, sus estados Frosted ni las
transiciones Flip, y no demuestra por sí sola el origen del incidente de
hidratación anterior. No se realiza commit ni push.

Validación posterior a la limpieza:

| Comprobación | Resultado |
| --- | --- |
| Grafo de módulos | Cero módulos de producción huérfanos y cero imports locales rotos; 22 imports CSS existentes. |
| `npm run typecheck` | Correcto. |
| `npm run lint` | Correcto. |
| `npm run test:run -- --maxWorkers=2` | **23 archivos y 225 pruebas aprobadas**, incluidas las 22 de hidratación. |
| `npm run build` | Correcto desde caché eliminada. Build `2-sfPeESsZxThhngtiBzN`; mismas tres rutas estáticas. |
| `next start` local | `/` y `/exposiciones` responden HTTP 200. Home contiene tres tarjetas circulares y tres capas Frosted, sin el track del carrusel retirado. |

## Verificación del primer render cliente

Se refuerza la prueba para observar el DOM real de `hydrateRoot` al entrar en
la primera lectura de `matchMedia`, al comienzo del efecto del motor y antes
de medir, cambiar la orientación o aplicar transforms. Su HTML coincide
exactamente con el SSR parseado y todos sus elementos son los mismos nodos.
Después de las mediciones se siguen conservando tarjetas, imágenes, veladuras
e IDs. La prueba mantiene el hook y `next/image` reales.

Se añaden cuatro hidrataciones directas de `LaboratoryCircularCard` combinando
`active` y `blocked`. Todas conservan el HTML completo y una única capa Frosted,
sin errores recuperables ni de consola. El total focal es de **26 pruebas**,
incluido el control negativo expresamente simulado. TypeScript, ESLint y la
suite completa de **23 archivos y 229 pruebas** pasan tras este refuerzo.

No existe en la fuente actual una condición que inserte o retire `__frost`:
el JSX de Card lo incluye siempre y CSS controla su opacidad. El carrusel
conserva `use client`; su estado inicial es determinista. Medidas, listeners
y motor ya se configuran en `useLayoutEffect`, después del commit de
hidratación; los tweens se crean por interacción. Esta comprobación modifica
únicamente las pruebas y esta documentación. No se presenta una causa del
incidente histórico como demostrada sin poder reproducirla.

## Referencia y adaptación

Se inspeccionó el [Circular Carousel oficial de React Bits](https://reactbits.dev/components/circular-carousel),
su [registro TypeScript/CSS](https://raw.githubusercontent.com/DavidHDev/react-bits/main/public/r/CircularCarousel-TS-CSS.json)
y la [fuente original](https://github.com/DavidHDev/react-bits/blob/main/src/ts-default/Components/CircularCarousel/CircularCarousel.tsx)
(blob consultado `f28d6040654a97360b1e2bab1ad14b72b07427f1`).

La API real define `autoplay: 'drift' | 'step' | 'off'`; el ejemplo con `false`
no es válido. El preset `cylinder` gira alrededor de Y y `wheel` alrededor de X;
no existe una prop `orientation`. Para la quietud requerida tampoco convienen
la entrada `rise`, el parallax decorativo ni el ciclo de actualización original.

El componente original no ofrece `id`, un elemento visual real de Next Image
para Flip ni un slot editorial de este proyecto. Su representación curva
subdivide cada imagen en franjas y caras, y el array vacío activa imágenes de
respaldo externas. La adaptación incorpora la geometría circular de esa fuente,
conserva una imagen DOM medible por estudio y reemplaza el motor por movimiento
manual finito. No se instala un paquete ni se finge utilizar props inexistentes.

La licencia es **MIT + Commons Clause**, conservada íntegramente en
[REACT-BITS-LICENSE.md](REACT-BITS-LICENSE.md). Se permite integrar el código en
una web con su aviso; no redistribuir los componentes como producto separado.
No hay dependencias nuevas ni WebGL en Laboratory; se usan React y GSAP ya
instalados.

## Arquitectura

- `LaboratorySection`: conserva una única `LaboratorySelection` y bloquea el
  carrusel hasta que el detalle termina de cerrar.
- `LaboratoryCircularCarousel` y `LaboratoryCircularCard`: composición, imágenes
  `next/image`, contenido editorial, controles y selección accesible.
- `useCircularCarousel`: una posición mutable y un único motor para ambos ejes.
  El estado React cambia al seleccionar un estudio, no por frame.
- `laboratory-circular-geometry.ts`: distancia circular, radio, pose y snap
  independientes del DOM. El mínimo de ocho posiciones geométricas permite ver
  vecinos con una colección de tres estudios sin duplicar botones ni imágenes.
- `LaboratoryDetail` / `useLaboratoryDetail`: fullscreen existente en portal,
  GSAP Flip, Escape, trap de foco, scroll lock e `inert`.
- `laboratory-circular-carousel.css`: estilos propios y variante de sección
  oscura, compartidos por ambos ejes del carrusel.

El carrusel circular es la implementación activa de la sección. Durante la
limpieza del 23 de octubre de 2026 se retiraron `laboratory-carousel.tsx`,
`laboratory-card.tsx`, `use-laboratory-carousel.ts`, `laboratory-loop.ts`,
`laboratory-carousel.css` y sus dos archivos de pruebas. Formaban un conjunto
sin referencias desde ninguna ruta, importación dinámica ni exportación
activa. Su versión anterior sigue disponible en el historial Git.

## Interacciones

Por debajo de 768 px, las tarjetas siguen un cilindro vertical; desde 768 px,
uno horizontal. La tarjeta activa queda frontal, con desplazamiento Z y rotación
cero, y mantiene su identidad por `laboratory.id`. Los vecinos muestran
profundidad y perspectiva real, sin rotar todo el carrusel 90 grados.

Los botones anterior/siguiente, de 48 × 48 px, recorren circularmente los
estudios. El indicador muestra posición y nombre. Las flechas del eje, Home y
End permiten elegir con teclado; Enter o Espacio abren el estudio activo.
El foco de las tarjetas utiliza un único botón activo en el orden de Tab.
Las tarjetas laterales se seleccionan primero; EXPLORAR abre la frontal una vez
asentada. No hay clones accesibles.

En móvil, `touch-action: pan-y pinch-zoom` conserva el scroll y el zoom nativos.
El gesto vertical sobre las tarjetas desplaza la página; la navegación del
carrusel se realiza con sus botones explícitos. Esta es la alternativa prevista
en la petición para evitar capturar el scroll de la landing. Con ratón se puede
arrastrar sobre el eje; en escritorio también se admite arrastre horizontal
táctil sin capturar los gestos verticales. El snap incorpora inercia limitada y
suprime la apertura accidental por el clic que sigue a un drag.

La tarjeta activa revela categoría, título Acid, descripción Basis, aviso
temporal y EXPLORAR: automáticamente en móvil o con hover/foco en escritorio.
Su imagen permanece nítida y los vecinos reciben el tratamiento Frosted Glass;
el texto está en una capa independiente de contraste alto. En movimiento
reducido la navegación se
resuelve inmediatamente y se eliminan transiciones espaciales complejas.

## Fullscreen y quietud

Antes de seleccionar se detiene cualquier tween y se bloquean nuevas acciones
síncronamente. Flip captura el elemento real `[data-lab-media]` con su
`data-flip-id`. La tarjeta frontal evita depender de una captura matricial 2D
para una cara rotada con perspectiva. El detalle conserva el cierre durante la
apertura, el resize, la restauración de estilos e `inert`, y devuelve el foco
antes de desbloquear la sección.

Resize, cambio de eje o de visibilidad cancelan gestos y asientan el mismo ID.
El retorno del detalle no inicia movimiento. No hay autoplay, intervalos,
entrada animada ni parallax. No se registra ningún ticker o bucle persistente;
solo un tween finito tras una acción explícita. Al terminar, se elimina la
referencia de animación. Listeners, observadores y captura de puntero se
limpian al desmontar.

## Datos, marca y destinos

Se mantienen todos los campos de `Laboratory` y las tres muestras temporales
originales, con sus SVG locales, dimensiones y textos alternativos. No se
inventan proyectos, fotografías, créditos ni fechas. El array vacío muestra un
mensaje local y no carga imágenes de stock. El copy nuevo se centraliza en
`data/laboratory-copy.ts`.

Black y Green forman la estructura, Cream la tinta y Electric Green los acentos.
Los tokens proceden del sistema global. Acid Grotesk y Basis Grotesque Mono Pro
se heredan de [las fuentes oficiales locales](../../app/fonts/README.md).

`#laboratorios` mantiene su destino en el menú. `#laboratorio` continúa
perteneciendo a About. HomeIdentity, Liquid Gradient, Exhibition, navegación y
Contact conservan sus implementaciones.

## Validación del carrusel antes de Frosted Glass

Validación final del 23 de octubre de 2026:

| Comprobación | Resultado |
| --- | --- |
| `npm run lint` | Correcto, sin errores ni advertencias. |
| `npm run typecheck` | Correcto. |
| Vitest, con dos workers | **24 archivos y 222 pruebas aprobadas**. Ejecutado mediante `node node_modules/vitest/vitest.mjs run --maxWorkers=2`, equivalente al script `test:run`. |
| Último ajuste de foco | Las 13 pruebas de presentación/composición se repitieron y aprobaron después del ajuste de `aria-disabled`. |
| Build final | Correcto; `/`, `/_not-found` y `/exposiciones` estáticas, sin rutas de prototipo publicadas. |
| Chrome local contra `next start` | Siete anchos con movimiento normal: 320, 375, 390, 430, 768, 1024 y 1440 px. Movimiento reducido adicional a 390 y 1440 px: nueve escenarios aprobados. |
| Geometría y controles | Cambio de eje en 768 px, una tarjeta activa, vecinos visibles, un único botón por estudio, navegación manual, indicador y controles de 48 px. Sin overflow horizontal de página. |
| Fuentes reales | Chrome identifica `AcidGrotesk-Medium` en el título y Basis Grotesque Mono Pro en descripción y numeración. No se deduce la carga únicamente del nombre de las variables CSS. |
| Teclado | Flechas del eje, Home/End y controles nativos; selección lateral sin abrir, foco visible y retorno al botón EXPLORAR. |
| Scroll y drag | Swipe móvil real: **161 px de desplazamiento del documento**, sin abrir el detalle. Drag horizontal de ratón: cambia de estudio, aplica snap y no genera una apertura accidental. |
| Hover | Imagen activa con blur real de 2 px y contenido editorial legible; vecinos sin filtro. |
| Fullscreen | **12 ciclos de apertura/cierre** con Flip, Escape, cierre durante apertura y cambio de orientación con el detalle abierto. Se conservan ID, foco e `inert`; el cierre sin resize mantiene el scroll. |
| Quietud | **Siete periodos de 15 segundos** al inicio, al cerrar, tras salir/regresar al viewport, cambiar de pestaña y redimensionar. Mismo ID y mismas matrices de las tarjetas, sin autoplay. |
| Recursos y consola | Sin errores JavaScript ni recursos de la aplicación con HTTP de error en los nueve escenarios. |

La revisión corrigió el bloqueo del botón de origen durante fullscreen: usa
`aria-disabled` y un guard de acción para que el detalle pueda devolverle el
foco antes de llamar a `onClosed`. Los controles de navegación siguen usando
`disabled`. El hook mantiene su bloqueo síncrono contra selecciones repetidas.

Un primer envío de Enter del guion CDP no incluía su carácter y no activaba el
clic nativo del navegador. Se corrigió el helper, se comprobó la secuencia de
eventos y se completó la repetición; no requirió cambiar la aplicación. Solo
los escenarios completos aprobados se cuentan en la tabla.

[Abrir el comparador visual antes/después](../../../../verification/laboratory-circular/review.html)
· [Resultados completos](../../../../verification/laboratory-circular/results.json)
· [Script reproducible](../../../../verification/check-laboratory-circular.mjs).

| Capturas | 390 px | 1440 px |
| --- | --- | --- |
| Carrusel anterior | [Anterior](../../../../verification/laboratory-circular/before-390.png) | [Anterior](../../../../verification/laboratory-circular/before-1440.png) |
| Circular, movimiento normal | [Actual](../../../../verification/laboratory-circular/after-390-normal.png) | [Actual](../../../../verification/laboratory-circular/after-1440-normal.png) |
| Circular, movimiento reducido | [Actual](../../../../verification/laboratory-circular/after-390-reduced.png) | [Actual](../../../../verification/laboratory-circular/after-1440-reduced.png) |

Las capturas encuadran el carrusel, y proceden del build de producción ejecutado
localmente. Las fuentes del código oficial y su licencia originales se
conservan fuera del repositorio, en `verification/laboratory-circular/`.
La comprobación 3D se realiza en Chrome con emulación de viewport; no se ha
medido el coste GPU en dispositivos móviles físicos.

El coste adicional de dependencias es cero. Se renderizan tres imágenes para
los tres estudios actuales, frente a las múltiples franjas/caras de la fuente
original. En este estado anterior solo la imagen activa utilizaba filtro.
El motor anterior registraba un
ticker continuo incluso cuando su callback decidía no dibujar; el nuevo solo
actualiza transforms durante un gesto o un tween finito. El build incluye el
motor circular y no contiene las etiquetas de pausa/reanudación del anterior.

## Archivos de este cambio

Nuevos dentro de esta feature:

- `components/laboratory-circular-carousel.tsx`
- `components/laboratory-circular-card.tsx`
- `components/use-circular-carousel.ts`
- `components/laboratory-circular-geometry.ts`
- `components/laboratory-circular-carousel.test.tsx`
- `components/use-circular-carousel.test.tsx`
- `components/laboratory-circular-geometry.test.ts`
- `styles/laboratory-circular-carousel.css`
- `REACT-BITS-LICENSE.md`

Modificados: `components/laboratory-section.tsx`, su prueba,
`data/laboratory-copy.ts`, este README y la importación de CSS en
`src/features/home/components/home-landing.tsx`. Ese commit inicial no eliminó
archivos; la limpieza posterior se detalla arriba.

Commit del avance Circular Carousel:

```text
feat(laboratory): implement responsive circular carousel
```
