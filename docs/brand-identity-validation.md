# CÈL·LULA — Integración de marca y validación

Fecha: 23 de octubre de 2026. Etapas B, C y D de la
[auditoría del brandbook](brandbook-audit.md).

El copy y la aplicación cromática de C, y después el diagnóstico y los tres
CTA de la normalización transversal, fueron aprobados por el usuario en la
conversación. El cierre actual se registra primero; las secciones B/C/D
conservan la evidencia de la integración anterior.

## Cierre actual — normalización transversal aprobada

El diagnóstico adicional encontró controles pequeños que todavía heredaban
Acid, dos descripciones de estados vacíos sin Basis, veladuras Cream duplicadas,
un foco Pink de contraste insuficiente sobre Slate y estados de presión poco
explícitos. También detectó dos enlaces con área táctil insuficiente y tres CTA
cuyo texto podía describir mejor el destino. Estos ajustes están implementados.

### Tipografía y color

Se mantienen `next/font/local`, `--font-acid` y `--font-basis-mono`, integrados
con los alias `font-sans` y `font-mono` de Tailwind v4. Acid conserva Regular
400, Medium 500 y Bold 700; Basis conserva Regular 400 y Medium 500, con sus
dos cursivas reales. Los archivos, nombres PostScript y huellas están detallados
en [el inventario de fuentes](../src/app/fonts/README.md). No se simulan pesos.

Acid mantiene los titulares, la navegación principal y las composiciones
editoriales. Basis estructura las descripciones, metadatos, etiquetas, footer y
controles pequeños. En este cierre se corrigen los controles de Exhibition y
Laboratory a Basis Medium, y sus dos descripciones vacías a Basis Regular. El
cierre expresivo de Contacto conserva Acid como decisión editorial previa.

| Token oficial | HEX | Aplicación principal |
| --- | --- | --- |
| `--color-cream` | `#EDE8E0` | Home, About, superficies y texto sobre fondos oscuros. |
| `--color-green` | `#7AB596` | Laboratory y gradiente de Home. |
| `--color-blue` | `#72A1B2` | Gradiente de Home y apoyo de Exhibition. |
| `--color-slate` | `#5B5E74` | Contacto y tinta secundaria. |
| `--color-black` | `#1D1D1D` | Exhibition y tinta de alto contraste. |
| `--color-green-electric` | `#07F364` | Acentos y estado pausado de Laboratory. |
| `--color-orange` | `#FF9940` | Acentos de Exhibition y Contacto. |
| `--color-pink` | `#FF66CC` | Gradiente de Home y acentos de About. |

La distribución por secciones es una adaptación web aprobada; los ocho colores
y la jerarquía estructural/activadora proceden del manual. Las mezclas no se
consideran colores oficiales adicionales. La veladura Cream al 95 % de
Exhibition y del detalle de Laboratory usa ahora `--surface-veil`; se eliminan
sus dos valores RGB duplicados. Las transparencias y el gradiente se conservan.

### Contenido aprobado

| Sección | Texto anterior | Texto aplicado | Motivo | Fuente |
| --- | --- | --- | --- | --- |
| Home → Exhibition | VER MÁS | EXPLORAR EXPOSICIONES | Identificar el destino `/exposiciones`. | Adaptación editorial aprobada. |
| Footer | ACTIVAR UNA CONEXIÓN | IR A CONTACTO | Describir el salto a `#contacto`. | Adaptación editorial aprobada. |
| Tarjetas de Laboratory | EXPLORAR | ABRIR ESTUDIO | Describir la apertura del detalle. | Adaptación editorial aprobada. |

El CTA de About «EXPLORAR EXPOSICIONES» conserva su destino `#exposiciones`.
Los textos se centralizan en `home-copy.ts` y `laboratory-copy.ts`, siguiendo
los patrones de sus features. El nombre accesible de cada tarjeta reutiliza
«ABRIR ESTUDIO» y añade su título, para coincidir con el CTA visible y facilitar
la activación por voz. Los titulares y descripciones narrativos ya
aprobados permanecen. La comparación editorial anterior está en
[la auditoría inicial](brandbook-audit.md). No queda copy nuevo pendiente de
aprobación; los datos reales de contacto y los originales visuales siguen
pendientes de suministro.

### UX y archivos

El foco del enlace de About cambia de Pink/Slate (≈ 2,43:1) a Cream/Slate
(≈ 5,22:1). Pink sigue como acento. Los controles habilitados de Home, About,
Exhibition, Laboratory, Contacto y navegación tienen respuesta de presión
explícita. Los enlaces deshabilitados y los paneles `inert` quedan excluidos
cuando corresponde. La pausa de Laboratory conserva un indicador Electric
mientras `aria-pressed="true"`; reanudar lo retira. En movimiento reducido,
el control deshabilitado no adquiere respuesta de presión.

El enlace inferior del hero y el CTA del footer tienen al menos 44 px de alto.
En los siete tamaños medidos, sus áreas son respectivamente 214,31 × 44 y
132,38 × 44 px. La separación entre el bloque editorial y el enlace del hero
es de 20 px en 1024 × 768 y de 44 px en los otros tamaños comprobados.

Archivos de este cierre, además de este informe:

- `src/app/globals.css`: token de veladura compartido.
- `src/features/home/data/home-copy.ts`, `styles/home.css` y
  `components/home-navigation.module.css`: CTA, áreas táctiles y estados.
- `src/features/about/styles/about.module.css` y
  `components/about-integration.test.tsx`: foco, presión y destinos de CTA.
- `src/features/exhibitions/components/exhibition-slider.tsx` y
  `styles/exhibition.css`: roles tipográficos, veladura y presión.
- `src/features/laboratory/data/laboratory-copy.ts`,
  `components/laboratory-card.tsx`, `components/laboratory-carousel.tsx`,
  `components/laboratory-carousel.test.tsx`, `styles/laboratory-carousel.css`
  y `styles/laboratory-detail.css`: CTA, tipografía, pausa y presión.
  Los componentes, estilos y pruebas del carrusel anterior de esta lista se
  retiraron el 23 de octubre de 2026 tras su sustitución por Circular Carousel;
  esta enumeración conserva el registro de la validación de marca original.
- `src/features/contact/styles/contact.module.css` y
  `components/contact-integration.test.tsx`: estados y CTA del footer.

No se añaden dependencias ni se cambia la arquitectura. Este cierre modifica
datos, clases y estilos de presentación, además de ajustar las comprobaciones
existentes de los CTA. No añade transformaciones a elementos animados por GSAP.

### Validación del estado final

| Comprobación | Resultado actual |
| --- | --- |
| TypeScript y ESLint | Correctos. |
| Vitest | **21 archivos y 185 pruebas aprobadas**, con dos workers. Tras el último ajuste del nombre accesible se repitieron los cuatro archivos de Laboratory: 32 pruebas aprobadas. |
| Build | Correcto; `/` y `/exposiciones` estáticas. |
| Layout en Chrome local con `next start` | 320, 375, 390, 430, 768, 1024 y 1440 px, sin overflow horizontal de página, titulares recortados fuera de los carruseles ni errores de consola/hidratación. |
| Fuentes y tokens en ese build local | Las siete caras reales identificadas, siete respuestas HTTP 200 locales, sin Google Fonts; los ocho HEX calculados coinciden. |
| Controles en los siete tamaños | Basis Medium, áreas de 44 px, foco Cream, presión diferenciada y exclusión de controles deshabilitados comprobados. |
| Pausa con movimiento normal | A 390 y 1440 px, el estado visual persiste después de soltar; reanudar restaura el estado normal. |
| Interacciones con movimiento normal y reducido | A 390 y 1440 px: About, teclado de Contacto y Exhibition, toque en móvil, pausa, fullscreen de Laboratory, restauración de `inert` y menú con Escape. Sin excepciones. |
| Nombre accesible final | El árbol de accesibilidad real de Chrome expone «ABRIR ESTUDIO: Membrana rosa», coincidente con el CTA y el título. Apertura, cierre y restauración de `inert` repetidos a 390 y 1440 px contra el último build. |
| Póster/canvas | Primer frame con error RGB medio 0,72/255 en móvil y 0,75/255 en escritorio; percentil 95 de 2/255. Movimiento reducido mantiene el póster. |

[Abrir la comparación final antes/después](../../verification/brand-normalization/review.html).
Incluye las siete vistas, a 390 y 1440 px, comparadas con la integración C/D.
Las capturas corresponden a un build de producción **ejecutado localmente**.
También se revisaron [el footer móvil](../../verification/brand-normalization/after-390-footer.png),
[el footer de escritorio](../../verification/brand-normalization/after-1440-footer.png),
[la pausa móvil](../../verification/brand-normalization/after-390-paused.png) y
[la pausa de escritorio](../../verification/brand-normalization/after-1440-paused.png).

Los resultados reproducibles están fuera del repositorio, en
`../verification/brand-normalization/`: `after-{width}.json`,
`after-font-faces.json`, `final-summary.json`, `controls.json` e
`interactions.json` y `accessibility.json`. Los scripts asociados son
`check-brand-normalization.mjs`, `check-brand-normalization-controls.mjs`,
`check-brand-normalization-interactions.mjs`,
`check-brand-normalization-accessibility.mjs` y
`build-brand-normalization-review.mjs`.

### Límite de verificación externa

El dominio facilitado es `https://cellulalaboratori.com`. La conexión no se
completó desde el entorno restringido y se denegó el permiso solicitado para
la comprobación externa. Por tanto, **queda pendiente verificar en ese despliegue
de Vercel la carga de las fuentes oficiales**. Los resultados HTTP 200 y
PostScript anteriores pertenecen exclusivamente al build local.

La consulta de GitHub identifica `main` en
[`cdd15ce` (tipografia 1)](https://github.com/Santiagon1996/cellula/blob/cdd15ce8e3122ac4dc9ce4f1fd43c2ae9232483c/src/app/fonts/fonts.ts),
donde el archivo de fuentes todavía carga las sustitutas. El estado Vercel
correcto de ese commit no acredita el despliegue de estos ajustes locales.
No se ha realizado commit, push ni despliegue durante este trabajo.

## Sistema global — etapa B

- Acid Grotesk se carga localmente en 400 Regular, 500 Medium y 700 Bold.
- Basis Grotesque Mono Pro se carga localmente en 400 y 500, normal y cursiva
  real. El navegador identifica las siete caras por su nombre PostScript.
- Los siete OTF necesarios están dentro del proyecto y permitidos expresamente
  por el `.gitignore` de fuentes. Sus SHA-256 coinciden con los originales
  auditados. Los otros archivos tipográficos siguen excluidos.
- Los ocho colores del brandbook están centralizados en `@theme static`, con
  los alias semánticos de superficie y texto y los alias tipográficos existentes.
- Se retiró el límite de `15ch` del cierre de Contacto en escritorio: con Acid
  dejaba «FORMA.» en una tercera línea. El salto explícito después de
  «LO QUE VIENE» vuelve a producir dos líneas a 1024 y 1440 px.
- El README general y las cabeceras de las auditorías históricas enlazan ahora
  con la configuración activa de fuentes.

Esta primera validación corresponde a fuentes, tokens y el ajuste de composición
necesario tras la sustitución tipográfica. Las propuestas de C se documentan
en la auditoría original y su aplicación aprobada se registra más abajo.

## Validación anterior de B

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto. |
| `npm run lint` | Correcto. |
| `npm run test:run -- --maxWorkers=2` | 21 archivos y 184 pruebas aprobados. |
| `npm run build` | Correcto; genera `/` y `/exposiciones` como páginas estáticas. |
| Fuentes en Chrome | Siete respuestas HTTP 200 desde el propio origen; las siete caras reales verificadas, incluidas las dos cursivas. Sin peticiones a Google Fonts. |
| Tokens en Chrome | Los ocho HEX calculados coinciden con la paleta configurada. |
| Responsive con movimiento reducido | Home, menú, tres modos de Contacto y `/exposiciones`, a 320, 375, 390, 430, 768, 1024 y 1440 px. Sin desbordamiento horizontal de página ni errores de consola/hidratación. |
| Comparación de titulares | Sin aumentos de desbordamiento horizontal ni recorte respecto a las medidas previas. Los saltos naturales pueden variar con las métricas de Acid. |
| Movimiento normal | A 390 y 1440 px: cambio de modo de Contacto con flecha del teclado y apertura/cierre del menú mediante Escape; sin excepciones de ejecución. |

La comprobación responsive se ejecutó con el servidor de desarrollo local y
Chrome sin ventana. El build se comprueba por separado. Las pruebas jsdom no
se utilizan como evidencia de layout o de carga real de fuentes.

Las herramientas y capturas están fuera del repositorio, en
`../verification/` respecto a su raíz:

- `check-brand-stage-b.mjs` y `brand-stage-b/after-*.json`: medidas actuales,
  consola, tokens y carga de fuentes.
- `check-brand-final-contact.mjs` y `brand-stage-b/final-contact.json`: líneas
  del cierre de Contacto e interacción con teclado en movimiento normal.
- `brand-stage-b/after-{390,1440}-*.png`: capturas actuales de las secciones,
  modos de Contacto, navegación y página de exposiciones.
- `brand-stage-b/final-{390,1440}-contact-finale.png`: revisión visual del cierre.
- `brand-stage-b/comparison.json`: comparación de medidas con la referencia
  anterior del 20 de octubre.

En 320 px el cierre de Contacto conserva tres líneas, sin recorte ni
desbordamiento. Desde 375 px ocupa dos líneas en los tamaños comprobados.

## Aplicación editorial y visual — etapa C

| Área | Implementación final |
| --- | --- |
| Identidad textual | CÈL·LULA en metadata, configuración, navegación, textos y nombres accesibles editados. `HomeIdentity` conserva íntegramente su fuente y el alt histórico de su imagen original. |
| Home | «LABORATORIO CULTURAL», «ARTE · PROCESO · COMUNIDAD» y la descripción aprobada sobre Barcelona. Los textos ocupan zonas separadas del wordmark. |
| About | Introducción del laboratorio cultural y seis valores como lista editorial secundaria. Se conserva «NO SOMOS UNA SOLA COSA.», los tres actos y Crear / Explorar / Conectar. Retirado el aviso de copy pendiente. |
| Exhibition | «ARTE EN PROCESO.» y descripción aprobada en Home y página propia, con identificación de demostración. Black/Cream, Blue secundario y Orange puntual. |
| Laboratory | Titular «LUGAR DE PRUEBA, DESARROLLO Y CRUCE.» y descripción aprobada. Green/Black con Electric puntual. Permanecen «MUESTRAS TEMPORALES» y «ESTUDIO TEMPORAL». |
| Contact | Titular conservado y narrativa aprobada con «Comparte». Slate/Cream con Orange; los tres modos y los canales pendientes permanecen. |
| Tipografía | Acid en titulares; Basis Regular en descripciones y apoyo, Medium en controles. Ajustados anchos, interlineados y escalas para los nuevos textos. |
| Navegación | Alias cromáticos conectados con los tokens globales y textos oficiales. Geometría, destinos, foco, inert, Escape y animación preservados. |
| Recursos originales | PNG de marca y SVG de las demostraciones intactos. El filtro CSS da tinta Black a la marca; un respaldo Cream al símbolo mantiene su contraste sobre las secciones oscuras sin cambiar su caja ni la transformación. |

Copy nuevo centralizado en:

- `src/features/home/data/home-copy.ts`, apoyado en `src/shared/config/site.ts`.
- `src/features/exhibitions/data/exhibition-copy.ts`, compartido por Home y la página propia.
- `src/features/laboratory/data/laboratory-copy.ts`.

Se actualizan los datos existentes de About y Contact. Los cambios de
componentes y estilos permanecen dentro de sus features; no se añaden
dependencias. `HomeIdentity`, los hooks de interacción, el slider y los shaders
conservan su lógica. En el slider solo cambian el peso tipográfico de los
controles y la prioridad de carga de la primera imagen.

## Póster y canvas

El generador obtiene `#FF66CC`, `#72A1B2`, `#EDE8E0` y `#7AB596` desde
`globals.css`. Se regeneraron juntos los dos WebP, el JSON, el módulo de
metadata y sus placeholders. La paleta por defecto del componente procede
del módulo generado, de modo que póster y canvas usan las mismas bases.

| Recurso | Bytes |
| --- | ---: |
| Portrait 384 × 1536 | 20892 |
| Landscape 2048 × 512 | 28262 |
| Placeholder portrait | 1322 |
| Placeholder landscape | 1324 |

El shader mantiene SHA-256
`ec1dbc283fe0e6b71adc3288fbf896445a0f999765f183d9f2e3a7535d8f59b3`.
No se modifica el ciclo de vida de Three.js, el límite de DPR, las pausas al
salir del viewport, el fallback ni la respuesta a movimiento reducido.

La comparación en Chrome muestrea 144 puntos del primer frame real del canvas
contra el póster con su recorte `cover`. El error RGB medio es 0,72/255 en
390 px y 0,75/255 en 1440 px; el percentil 95 es 2/255 en ambos. El póster está
presente y la opacidad del canvas es cero antes de ese primer dibujo. En
movimiento reducido se conserva el póster con canvas oculto.

## Comprobaciones finales — etapa D

| Comprobación | Resultado |
| --- | --- |
| TypeScript | `npm run typecheck`, correcto. |
| Lint | `npm run lint`, correcto. |
| Pruebas | 21 archivos, **185 pruebas aprobadas**; ejecución de Vitest con dos workers. |
| Producción | `next build`, correcto; `/` y `/exposiciones` estáticas. |
| Navegador de producción | Chrome local contra `next start`; Home, menú, tres modos de Contacto y `/exposiciones` a 320, 375, 390, 430, 768, 1024 y 1440 px. Sin overflow horizontal de página ni errores de consola/hidratación. |
| Fuentes | Las siete caras PostScript verificadas como fuentes reales; siete HTTP 200 desde el sitio y ninguna petición a Google Fonts. |
| Movimiento normal y reducido | A 390 y 1440 px: About, teclado de Contacto, pestañas táctiles en móvil, teclado de Exhibition, pausa del carrusel, apertura/cierre fullscreen de Laboratory y menú con Escape. Sin excepciones. |
| Fondo y foco | El detalle de Laboratory aplica y restaura `inert` al abrir/cerrar. El menú y las pruebas existentes conservan su cobertura de foco. |
| Marca | Separación del nuevo texto respecto al wordmark medida con la altura de la «a» del PNG original. Se corrigió el espacio inferior en 1024 × 768. |

Se inspeccionaron las capturas de Home, About, Exhibition, Laboratory y Contact
a 390 y 1440 px. Los cambios naturales de salto de línea se permiten cuando
mantienen legibilidad y no producen recorte. La comparación de contrastes base
de la auditoría sigue siendo aplicable: Cream/Slate ≈ 5,22:1, Black/Cream ≈
13,82:1, Black/Green ≈ 7,13:1, Black/Orange ≈ 7,93:1 y Black/Electric ≈ 11,25:1.
Los activadores se usan en decoración o con tinta apropiada; no se usa texto
Cream pequeño sobre Pink.

Hubo timeouts de arranque de workers y de captura en las primeras ejecuciones
simultáneas. Se completó después la suite coordinada y la revisión contra el
servidor de producción, activando cada pestaña antes de capturar. Los resultados
anteriores incompletos no se cuentan como validaciones aprobadas.

## Capturas y evidencia de C/D

Las herramientas permanecen fuera del repositorio, en `../verification/`
respecto a su raíz. En `brand-stage-cd/` se conservan las capturas anteriores
de B como `before-*` y las actuales como `after-*`.

[Abrir el comparador de capturas](../../verification/brand-stage-cd/review.html).
Permite alternar 390/1440 px y abrir los PNG completos. Las capturas anteriores
conservan su encuadre original; las actuales muestran el inicio de cada sección.

| Sección | Móvil 390 px | Escritorio 1440 px |
| --- | --- | --- |
| Home | [Captura](../../verification/brand-stage-cd/after-390-home.png) | [Captura](../../verification/brand-stage-cd/after-1440-home.png) |
| About | [Captura](../../verification/brand-stage-cd/after-390-about.png) | [Captura](../../verification/brand-stage-cd/after-1440-about.png) |
| Exhibition | [Captura](../../verification/brand-stage-cd/after-390-exhibition.png) | [Captura](../../verification/brand-stage-cd/after-1440-exhibition.png) |
| Laboratory | [Captura](../../verification/brand-stage-cd/after-390-laboratory.png) | [Captura](../../verification/brand-stage-cd/after-1440-laboratory.png) |
| Contact | [Captura](../../verification/brand-stage-cd/after-390-contact.png) | [Captura](../../verification/brand-stage-cd/after-1440-contact.png) |

Evidencia adicional: `after-{width}.json`, `after-font-faces.json`,
`interactions.json` y `hero-protection.json`. Las verificaciones de píxeles y
layout pertenecen al navegador, no a jsdom.

## Git y recursos pendientes

Rama: `feature/brand-identity`. Base:
`cdd15ce8e3122ac4dc9ce4f1fd43c2ae9232483c` (`tipografia 1`). Tras el fetch del
23 de octubre, `main` y `origin/main` siguen coincidiendo con esa base; no se
modifica `main`. Se conservan los cambios locales aprobados, los OTF autorizados,
el PDF y el estado preparado de `next-env.d.ts`. No se ha realizado commit,
merge ni push.

La fotografía oficial y la trama siguen sin originales locales. Sus ubicaciones
futuras y fuentes están identificadas en la auditoría inicial, dentro de
`public/brand/photography/{bodies,matter}/`, `public/brand/imagery/` y
`public/brand/patterns/`. No se sustituyen con imágenes genéricas ni se
reconstruye el isotipo. Los canales de contacto continúan vacíos hasta disponer
de datos confirmados.

Próximo commit propuesto, pendiente de autorización:

```text
feat(brand): standardize typography colors and copy across site
```
