# Exhibition: geometría y navegación de CardSwap

Fecha: 24 de octubre de 2026. Rama: `feature/exhibition-card-swap`.

## Diagnóstico y procedencia

`src/features/exhibitions/components/CardSwap.tsx` es una **adaptación del motor oficial TypeScript + Tailwind de React Bits**, no una reconstrucción propia ni una copia sin cambios. La instantánea `card-swap-upstream.json` conserva el contenido oficial con SHA-256 `6bcb6cb409f24e4687900fe9c60f11523730c14c808ed124a2ad5c35c1d98912`. La consulta del código público confirmó la coincidencia con la fuente oficial.

Referencias: [documentación](https://reactbits.dev/components/card-swap), [fuente fijada](https://github.com/DavidHDev/react-bits/blob/f586a29d6b90a9bf8027b76e978a82230160b8c6/src/ts-tailwind/Components/CardSwap/CardSwap.tsx), [commit upstream](https://github.com/DavidHDev/react-bits/commit/f586a29d6b90a9bf8027b76e978a82230160b8c6).

La diferencia estaba en `exhibition-card-swap.tsx`: dimensiones verticales de 320 × 400 y separaciones mucho menores que las oficiales. Coincidían con el formato 4:5 del antiguo `ExhibitionSlider`, aunque sus selectores CSS no se aplicaban al nuevo componente. La imagen tenía dimensiones intrínsecas 800 × 1000 y `object-fit: cover`; el tamaño real de la tarjeta lo imponía el motor, no esos atributos de imagen.

La perspectiva interna ya era 900 px y el cálculo `stackBounds` oficial ya incluía profundidad, inclinación, apertura al hover y 32 px de margen. No había que sustituirlos. La integración no añadía otra perspectiva ni GSAP sobre las tarjetas. El `overflow: hidden` de `.exhibition-page` podía recortar el movimiento fuera de sus límites; se retira. El recorte de imagen y el radio dentro de cada tarjeta sí son intencionados. Los filtros se aplican a la imagen, no al stage ni al texto.

Además, la adaptación de accesibilidad había aplicado `inert` a toda tarjeta posterior. Eso bloqueaba los eventos de puntero y hacía inaccesible el click oficial para llevar una tarjeta al frente. Ahora se mantiene inerte su contenido y se deja disponible el área exterior de la tarjeta visible. Las tarjetas fuera de la pila visible siguen completamente inertes.

## Parámetros

| Propiedad | Oficial | CÈL·LULA antes | Propuesto / final | Efecto y justificación |
| --- | --- | --- | --- | --- |
| width | 460 px | 320 px | 460 px | Recupera el ancho apaisado de referencia. |
| height | 340 px | 400 px | 340 px | Elimina la proporción 4:5 heredada de la presentación anterior. |
| Proporción de tarjeta | 23:17 | 4:5 | 23:17 | El motor escala toda la composición proporcionalmente en móvil. |
| cardDistance | 60 px | 18 px | 60 px | Hace reconocibles los bordes posteriores. |
| verticalDistance | 70 px | 22 px | 70 px | Recupera la separación ascendente entre niveles. |
| depth | 90 px | 60 px | 90 px | Recupera la reducción aparente por profundidad Z. |
| skewAmount | 6° | 3° | 6° | Recupera la inclinación calculada por el motor. |
| visibleCards | 4 | 4 | 4, limitado a las obras disponibles | Sin duplicar obras. |
| cardRadius | 18 px | 18 px | 18 px | Conserva el borde oficial. |
| speed | 1 | 1.25 | 1 | Recupera la velocidad del muelle oficial. |
| bounce | 0.35 | 0.2 | 0.35 | Recupera el asentamiento oficial. |
| parallax | 0.5 | 0 | 0.5 | Reactiva la respuesta de perspectiva al puntero. |
| hoverSpread | 0.12 | 0 | 0.12 | Recupera la apertura de la pila al hover. |
| dim | 0.5 | 0 | 0.5 | Conserva la capa de profundidad oficial, sin bajar la opacidad de toda la tarjeta visible. |
| autoplay | true por defecto; false en el encargo | false | false explícito | Ninguna rotación automática. |
| intro | true por defecto; false en el encargo | false | false explícito | Ningún movimiento de entrada al montar. |
| draggable | true | true | true | Mantiene el arrastre oficial. |
| pauseOnHover | true | true por defecto | true por defecto | No programa avances con autoplay desactivado. |
| delay | 4000 ms | 4000 ms por defecto | Sin uso | La rama de autoplay nunca programa este temporizador en Exhibition. |
| perspective | 900 px interna | 900 px interna | 900 px interna | Sin perspectiva externa. |
| Bounds | `stackBounds`, margen 32 px | Mismo cálculo, otras dimensiones | Mismo cálculo, parámetros oficiales | El stage reserva la extensión de las cuatro tarjetas, incluyendo hover. |

El resultado calculado de bounds pasa de **403 × 502 a 626 × 589 px**. Los cuerpos de `stackBounds`, `slot` y `targetOf` coinciden con upstream. `fit` conserva su fórmula; únicamente expone `--swap-scale` para el texto editorial. Las posiciones finales por nivel son `(0, 0, 0)`, `(60, -70, -90)`, `(120, -140, -180)` y `(180, -210, -270)`. La escala por perspectiva de la cuarta tarjeta es 0,7692 frente a 0,8333 antes.

## Inspección de CSS

| Capa | Resultado de la revisión |
| --- | --- |
| Página Exhibition | Base Black y texto Cream; se elimina su `overflow: hidden`. No añade perspectiva ni transformaciones. |
| Landing | `.home-page` conserva su `overflow: clip`; los bounds y el fit de la pila contemplan el ancho interior y su margen. Su efecto visual durante gestos queda pendiente de navegador. |
| Stage exterior | Ancho `min(100% - 2rem, 44rem)`; en Home usa el ancho interior de la sección. Sin recorte, filtros, perspectiva ni transformaciones propios. |
| Sizer del motor | Su `overflow: hidden` envuelve solo el espaciador invisible, no la pila. El ratio procede de los bounds, no de la imagen. |
| Stage del motor | Posición absoluta centrada, perspectiva interna 900 px y fit uniforme oficiales. No se añade otro `transform-style`, `perspective-origin` o motor de animación. |
| Slots | Posición absoluta, transformaciones y z-index calculados por el motor. Radio 18 px; overflow e isolation locales para el marco de cada tarjeta. |
| Opacidad | Las cuatro tarjetas visibles en reposo tienen opacidad completa; solo se ocultan las que quedan fuera del número visible. La sombra oficial de profundidad y la veladura son capas independientes. |
| Imágenes | `next/image` con `fill`; contenedor del tamaño de la tarjeta. `object-fit: contain`, sin distorsión ni recorte de composición. |
| Frosted Glass | Blur de imagen 3 px en móvil y 4 px en escritorio; contraste posterior 0,94; veladura 22%; transición 500 ms. Frontal en reposo sin filtro ni veladura. |
| Texto | Fuera del filtro; panel Black al 90% para contrastar con Cream. Título Acid, técnica y descripción Basis Mono. Visibilidad oculta hasta hover, foco o apertura explícita. |
| Recortes y efectos adicionales | Sin `backdrop-filter`, `contain` de pintura o `clip-path` sobre la pila. El `clip-path` del estado accesible solo oculta visualmente su texto. |

## Adaptaciones conservadas y cambios

Se conservan las ecuaciones de posición, perspectiva, muelles, fling y fit responsive oficiales, junto con las adaptaciones existentes de SSR, reduced motion, captura de puntero y descanso del motor. La selección posterior cambia el orden circular y usa esos mismos muelles directamente: no crea temporizadores de avances encadenados. Anterior, siguiente y drag conservan el intercambio oficial.

La ficha frontal se abre o mantiene al pulsar la tarjeta; el botón «Ver ficha» permite abrirla y cerrarla con teclado o toque. El estado activo procede de `onChange`, asociado al ID de la obra, nunca de la posición DOM. Solo el contenido frontal recibe foco. El anuncio `aria-live` se actualiza una vez por cambio de obra.

El filtro frontal en reposo es `none`, con contraste, saturación y opacidad originales. Al abrir ficha o hacer hover se desenfoca únicamente la imagen y aparece la veladura; el texto sigue nítido. Los colores estructurales y activadores proceden de los tokens existentes. Acid Grotesk y Basis Grotesque Mono Pro están cargadas con `next/font/local` en el layout raíz.

Las cinco obras originales son SVG de 800 × 1000. `cover` en una tarjeta 460 × 340 eliminaría el 40,87% de su altura: por ejemplo, el círculo azul inferior de «Membrana rosa» y extremos del arco de «Umbral lavanda». Por eso se usa `contain`: la obra mide 272 × 340 dentro del marco de referencia, con 94 px de margen Black a cada lado. Los archivos originales y el contrato `ExhibitionArtwork` permanecen intactos.

Archivos de producto modificados: `components/CardSwap.tsx`, `components/exhibition-card-swap.tsx`, `components/exhibition-artwork-card.tsx`, `styles/exhibition-card-swap.css`, `styles/exhibition.css` y `card-swap-provenance.json`, todos bajo `src/features/exhibitions/`. Se amplían tres tests de Exhibition y se actualiza `scripts/check-exhibition-card-swap.mjs` para la geometría, el encuadre y los filtros finales. No cambian las dependencias ni los estilos o fuentes globales.

Las rutas existentes se conservan: Home usa CardSwap en `/#exposiciones`; la vista aislada es `/exposiciones?preview=card-swap`; `/exposiciones` mantiene el slider funcional anterior. No se introduce navegación desde una tarjeta a otra página.

## UX y rendimiento

Se usa un único motor para móvil y escritorio. El fit reduce toda la geometría uniformemente, sin convertir tarjetas en retratos. `touch-action: pan-y pinch-zoom` y la cancelación del arrastre vertical táctil conservan el scroll del documento. Los controles Anterior, Siguiente y Ver ficha mantienen sus targets mínimos de 48 px. La ficha compensa la escala para mantener título de al menos 16 px y descripción de al menos 12 px renderizados; permite scroll interno si el contenido supera la altura disponible. Estas medidas están implementadas, pero la legibilidad y los gestos físicos requieren revisión en navegador/dispositivo.

Predicciones matemáticas para la vista aislada; **no son mediciones de navegador**, no incluyen el incremento de alto por skew y Home tiene otro margen interior:

| Viewport | Escala | Tarjeta frontal antes de skew |
| --- | --- | --- |
| 320 px | 0,4601 | 211,6 × 156,4 px |
| 375 px | 0,5479 | 252,0 × 186,3 px |
| 390 px | 0,5719 | 263,1 × 194,4 px |
| 430 px | 0,6358 | 292,5 × 216,2 px |
| 768 px | 1 | 460 × 340 px |
| 1024 px | 1 | 460 × 340 px |
| 1440 px | 1 | 460 × 340 px |

No se añade GSAP ni Three.js. La transición escribe transformaciones en el DOM sin renderizar React en cada frame. Las pruebas comprueban que muelles, parallax y apertura al hover dejan de solicitar RAF al asentarse. No se crean intervalos ni temporizadores de avance con la configuración de Exhibition, incluida la selección posterior. Observers, media listeners, eventos y capturas de puntero se limpian al desmontar. Fuera del viewport no se programa autoplay; una transición manual ya iniciada puede terminar su asentamiento. Solo se filtran las imágenes; no hay blur o `backdrop-filter` sobre texto, controles o stage. El coste de GPU y los tiempos de frames no se han medido por falta de navegador.

## Evidencias y verificación

El prototipo de fidelidad está en `../verification/card-swap-geometry/`, fuera del repositorio de producto. `README.md` documenta su ejecución y `source-geometry-report.json` recoge la comparación matemática. El build independiente del harness A/B/C pasó con 31 módulos en 3,12 s. Sus cifras de bundle pertenecen al harness y no miden la aplicación.

| Variante | Contenido disponible |
| --- | --- |
| A · Oficial | Fuente oficial TS-TW sin cambios; cuatro obras locales; parámetros originales; sin Frosted Glass ni contenido editorial. |
| B · Antes | Reconstrucción desde `HEAD b1df852`, con motor, wrapper, controles, datos y CSS anteriores. Es una reconstrucción posterior, no una captura histórica. |
| C · Después | Motor adaptado final sin presentación editorial en el harness; presentación completa en las rutas Next.js indicadas arriba. |

**No se obtuvieron capturas A/B/C.** Chrome no llegó a estar disponible y la solicitud de lanzamiento terminó con `aborted by user after 352.3s`. No se reintentó la acción cancelada. Quedan pendientes la comparación visual a 390/1440 px, los gestos reales, ausencia de recortes, legibilidad, fuentes efectivamente renderizadas y el reposo real de 15 segundos en una página abierta. No se afirma coincidencia visual exacta ni conformidad WCAG certificada.

Resultados técnicos reales:

| Comando | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | PASS; el primer intento detectó imports relativos rotos en los tests de About trasladados previamente. Se corrigieron solo esas referencias y sus mocks a alias `@/features/about/…`. |
| `npm.cmd run lint` | PASS, sin errores ni warnings. |
| `npm.cmd run test:run -- --pool threads --maxWorkers 1` | PASS: 28 archivos, 268 tests, 199,31 s. |
| `npm.cmd run build` | PASS en Next.js 16.4.0: compilación 12,9 s, TypeScript 15,5 s, generación de páginas 2,4 s. Home estática y Exhibition dinámica. |
| `node --check scripts/check-exhibition-card-swap.mjs` | PASS; el script de navegador actualizado no pudo ejecutarse contra Chrome. |
| `git diff --check` | PASS. |

Vitest se ejecutó con pool `threads` y un worker para evitar el timeout de arranque del pool `forks` observado en este entorno; no se cambió `vitest.config.mts`. Los tres archivos focales de Exhibition pasan 35/35 tests, incluidos siete casos de SSR/hidratación con los nodos conservados y sin errores recuperables, además de Strict Mode, navegación, drag, cancelación, resize, cleanup, lista vacía y una o dos obras. Las pruebas de 15 segundos usan reloj simulado; no sustituyen la espera real solicitada. Los estados CSS de blur/hover y el movimiento 3D requieren la revisión visual pendiente.

## Git

Actualización posterior por indicación del usuario: las correcciones de Exhibition se incorporan mediante `commit --amend --no-edit --only` al commit local existente `exhibition carrusel`. Se incluyen únicamente los once archivos de esta corrección; se conservan fuera de la ampliación los traslados previos de tests About y los dos borrados de licencias. No se hace push. Los párrafos siguientes registran el estado al entregar inicialmente la implementación.

No se cambia de rama ni se realizan commits, push, merge, rebase o reset. Se conservan los cambios locales previos: tres tests de About eliminados de sus ubicaciones antiguas y sus copias sin seguimiento en `src/tests`, además de las eliminaciones de `REACT-BITS-LICENSE.md` en Exhibition y Laboratory.

El working tree queda con los cambios de Exhibition y este informe, más esos cambios previos. En `src/tests/about-integration.test.tsx` y `src/tests/about-section.test.tsx` solo se corrigen imports y referencias de mocks necesarios tras su traslado. `src/tests/about-content.test.ts` no se modifica. No hay cambios en staging. La actualización automática de `next-env.d.ts` durante el build se devuelve a su contenido inicial para no incluir ruido ajeno al encargo.

Mensaje propuesto, sin ejecutar:

`refactor(exhibitions): restore original CardSwap geometry and refine frosted glass`

## Aviso upstream conservado

La copia siguiente conserva el aviso de la implementación usada sin restaurar ni alterar los archivos de licencia eliminados previamente por el usuario.

MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

### Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

The same restriction covers the React Bits tools (Background Studio, Texture Lab, Shape Magic, Center Stage, Sound Lab and any tools added later) and the sounds in the sound library. **You may not sell, sublicense, or redistribute the tools or the sounds themselves, or offer the tools or a substantially similar copy of them as a hosted service-whether alone, in a bundle, or as a ported version.**

What you make with the tools is yours to use. You can use exported code, images, videos, and audio files in any personal or commercial application, website, or product, including paid ones. **You may not sell or redistribute the exports on their own, either individually or as the product itself, such as a sound, texture, background, or template pack.**

### No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
