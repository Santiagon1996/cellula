# About 2.0 — CÈL·LULA, sistema vivo

Informe de implementación del 24 de octubre de 2026. El estado visual y los resultados técnicos se completan al cerrar la validación; las cifras históricas del README de la feature no se atribuyen a esta versión.

## Git

El usuario pidió añadir la corrección de Exhibition a su commit existente. Se amplió `b1df852` mediante `git commit --amend --no-edit --only` con once archivos explícitos: nuevo SHA **`e897155425d96de16d3d145fda8b8c5624e63fde`**, mensaje conservado `exhibition carrusel`. No se publicó ni se incorporaron a la ampliación los traslados previos de tests de About o los dos borrados previos de licencias. Se comprobó que el diff staged de esos cambios era idéntico antes y después.

Por elección expresa del usuario, se reutiliza **`feature/about`**, que estaba 44 commits por detrás y no tenía commits propios. Se actualizó por avance rápido a `e897155`, sin merge commit, rebase, reset ni rama nueva. Esa es la base de About 2.0. El staging previo se conservó al cambiar de rama; los nuevos cambios de About quedan sin commit y sin push.

## Brandbook y contenido

Se revisó el PDF completo `CEL-LULA_Brandbook.pdf`: 43 páginas, 186.609.618 bytes, SHA-256 `89eb5d4be33c63e2ce03adb860e01076b8b46b8bb9cc4783021f5fced51ee7e0`. La extracción de texto, fuentes, enlaces y spans, junto con la revisión de láminas del mismo documento, está en `../verification/about-brand-warp/brandbook-audit.{md,json}`. No se han usado las fotografías de esas láminas como imágenes de producción.

| Evidencia oficial | Aplicación |
| --- | --- |
| Página 6: laboratorio cultural, producción artística, experimentación, curaduría y comunidad | Introducción web adaptada; no se presenta como cita literal. |
| Página 7: Experimentación, Transparencia, Evolución, Comunidad, Curaduría y Autenticidad | Los seis valores completos y los valores relacionados con la selección del ecosistema. |
| Página 8: «SISTEMA VIVO» | Dirección narrativa de los tres actos. «UN SISTEMA VIVO.» es el titular editorial solicitado. |
| Página 9: voz cercana, reflexiva, auténtica y clara | Se conserva la voz existente y se incorpora el apoyo solicitado con estado pendiente. |
| Páginas 20–21 | No se deforman ni sustituyen logotipo e isotipo oficiales de Home; las formas About son expresivas, no nuevos identificadores. |
| Páginas 23–26 | Ocho tokens existentes, bases estructurales predominantes y activadores puntuales, con mezclas derivadas sin nuevos colores oficiales. |
| Página 28 | Acid Grotesk principal; Basis Grotesque Mono Pro para lectura e información auxiliar. |
| Páginas 30–34 y 36–42 | Cuerpos, gestos, materia, organismos, transparencias y proceso como dirección material. Se prepara la composición sin sustituir los originales ausentes. |

Las cabeceras HEX y el brief coinciden: Cream `#EDE8E0`, Green `#7AB596`, Blue `#72A1B2`, Slate `#5B5E74`, Black `#1D1D1D`, Electric Green `#07F364`, Orange `#FF9940` y Pink `#FF66CC`. El PDF presenta inconsistencias entre algunas etiquetas RGB/HEX de la página 25; se usan esas ocho cabeceras confirmadas, sin muestrear capturas ni añadir tonalidades como colores oficiales.

Acto I usa Cream/Black y Pink; acto II Blue/Green y Pink puntual; acto III Slate/Cream y Orange. El 70/30 del manual es una orientación compositiva, no una proporción de píxeles medida ni una regla de CSS.

La agrupación Crear → Experimentación/Autenticidad, Explorar → Transparencia/Evolución y Conectar → Comunidad/Curaduría es una **propuesta editorial web**, no una agrupación literal del manual. `aboutContentProvenance` conserva esa distinción y el estado pendiente de validación, igual que el nuevo apoyo del cierre. No se inventan proyectos, servicios ni personas.

## Fuentes y originales fotográficos

Los once OTF del repositorio coinciden byte a byte con los originales homónimos de `C:/Users/Usuario/Downloads/celulaFonts`. Se verificaron nombres internos, contornos y pesos OpenType. Las siete variantes ya integradas mediante `next/font/local` son Acid Regular 400, Medium 500 y Bold 700; Basis Regular/Italic 400 y Medium/Italic 500. No se copian ni convierten fuentes nuevas.

Warp Text usa Acid Bold **700**, un peso real disponible, en vez del 800 predeterminado del componente. Antes de importar el renderer se resuelve la primera familia real de `--font-acid`, se espera `document.fonts.load` y `document.fonts.ready`, y se comprueba su disponibilidad. No basta con leer el nombre de la variable CSS. La capa HTML sigue visible hasta que se dibuja correctamente el primer frame.

No hay fotografías originales aprobadas en el proyecto ni en las carpetas fuente revisadas. El manual enlaza una [carpeta de originales](https://drive.google.com/drive/folders/1O35VPUPoct2djKPe32RDthPSTHSllnhd?usp=drive_link), que no pudo leerse con la herramienta web disponible. No se descargan fotografías genéricas ni se extraen mockups del PDF para sustituirlas.

`aboutMaterial.images` reserva tres roles: cuerpo/gestualidad, materia/organismo y proceso. Cada recurso espera archivo original, dimensiones reales, alt descriptivo, pie/crédito y encuadre aprobado. `AboutMaterial` solo pinta recursos con `src`; los slots pendientes no generan imágenes rotas ni placeholders visibles. Hasta recibirlos, el tercer acto conserva las formas existentes.

## Warp Text oficial

Fuente fijada: [React Bits TS-TW, commit `14330e6`](https://github.com/DavidHDev/react-bits/blob/14330e6963f6c5ddd773ee2af844d0630c22b958/src/ts-tailwind/TextAnimations/WarpText/WarpText.tsx). Blob `435f7b1178c380d998e3f89a452152a21f452b8e`; SHA-256 de contenido `c474d827f2ea189335f6e9bf3a41f8bfd1976b76adfb50b21bd9290584de5d1f`.

Se consultaron la documentación, el registro y el código de GitHub. El registro y la fuente fijada coinciden; se conservan en `warp-text-registry.json` y `warp-text-upstream.json`. La consulta inicial devolvió una versión anterior de la API; se corrigió contrastando la fuente actual antes de implementar. No se presenta una imitación como componente oficial.

Se incorpora el código mediante copia verificada, una vía admitida por React Bits, y se instala **OGL 1.0.11** con su rango oficial `^1.0.11`. No se ejecuta shadcn sobre una integración ya configurada: `components.json` ya declara `@react-bits`, TypeScript y Tailwind v4. El motor usa OGL/WebGL, no Three.js. Se conserva el aviso MIT + Commons Clause en `REACT-BITS-WARP-TEXT-NOTICE.md`; OGL declara Unlicense. No se añade otro efecto React Bits a About.

| Propiedad | Configuración About |
| --- | --- |
| text | `¿QUÉ ES CÈL·LULA?`, composición gráfica en dos líneas |
| warpStrength / warpScale / speed | `0.055` / `1.5` / `0.45` |
| lens | `bulge` |
| pointerInfluence / pointerStrength | `0.4` / `0.3` |
| refraction / chromatic | `0.012` / `0.15` |
| idleDrift | `0` |
| ripple / clickRipple | `true` / `true` |
| intro | `false` |
| fontFamily / fontWeight | Acid real comprobada / `700` |
| letterSpacing / lineHeight | `-0.06em` / `0.9` |

Todas esas propiedades existen en la fuente fijada. Los shaders y el rasterizador oficial permanecen iguales. Las adaptaciones añaden callbacks de primer frame/error, HTML válido dentro del `h2`, carga diferida, suspensión y limpieza. La fuente y las diferencias quedan identificadas en `warp-text-provenance.json`.

## Arquitectura y movimiento

Se conservan `AboutSection`, `AboutIntro`, `AboutEcosystem`, `AboutEcosystemNode`, `AboutFinale`, `useAboutScroll`, `useEcosystemMotion` y su integración entre Hero y Exhibition. No se desactiva SSR de la sección.

Se añaden `components/warp-text/AboutWarpTitle` y su motor oficial adaptado, CSS local, pruebas y procedencia; `AboutMaterial` prepara las fotografías. Los textos permanecen en `data/about-content.ts` y sus contratos en `types.ts`.

Se retiran exclusivamente la dispersión GSAP de `[data-about-fragment]` y el seguimiento del cursor de `[data-about-question]`. Warp Text controla su superficie. GSAP mantiene la transición cromática del primer acto, revelación de la declaración, selección y conexiones del ecosistema, convergencia del cierre y una secuencia de fotografías condicionada a originales disponibles. En móvil el título HTML admite una revelación pequeña, sin deformación compleja ni captura de gestos.

Crear/Explorar/Conectar siguen siendo botones nativos, con `aria-pressed`, foco visible y panel estable. Los valores asociados cambian junto con su descripción. El cierre conduce a `#exposiciones` dentro del scroll continuo; no se añade navegación a otra página.

## Rendimiento y accesibilidad

El HTML inicial conserva el encabezado legible. El motor gráfico se importa únicamente cuando el título entra en pantalla, con viewport de al menos 768 px, puntero fino, pestaña visible y sin reduced motion. No se importa OGL para móvil/coarse o reduced motion. Al salir de vista, ocultar la pestaña o cambiar la preferencia se desmonta y libera el renderer. No hay RAF de Warp en esos estados.

El shader oficial conserva su bucle mientras está visible. La textura se crea al cambiar fuente, texto, tamaño o color, nunca en cada frame. DPR está limitado a 2. El ecosistema y el acto material usan DOM/SVG/GSAP, sin contextos WebGL nuevos. La implementación de Hero permanece intacta.

La revisión encontró un caso límite en la ruta de rasterización oficial: si Canvas2D devolvía `null`, podía producirse una textura transparente y ocultarse el HTML al declarar el frame listo. La adaptación detecta ese caso antes de `onReady`, cancela el motor y conserva el título HTML. Se añade una regresión específica; los shaders y el cuerpo del rasterizador oficial permanecen iguales.

El `h2` semántico y su nombre permanecen; la representación gráfica está bajo `aria-hidden`, sin duplicar anuncios. Sin WebGL o ante fallo queda HTML. Reduced motion conserva contenidos y selección con cambios inmediatos. Los listeners, observers, RAF, texturas, geometría, programas y contexto se limpian, también bajo Strict Mode. La calidad visual y el rendimiento efectivo se documentan únicamente con la evidencia de navegador obtenida, no con pruebas DOM.

## Validación

Prototipo aislado: `../verification/about-brand-warp/`, con Acid Bold original, modo oficial y modo adaptado. **12/12 comprobaciones reales de navegador pasan**, incluida fuente efectiva, cursor/click, móvil HTML, reduced motion, desmontaje, pestaña oculta y salida de viewport. La integración del título se realizó después de esa validación.

Capturas previas: `before-390-{intro,ecosystem,finale}.png` y `before-1440-{intro,ecosystem,finale}.png`, tomadas del build de producción anterior. Las posteriores siguen el patrón `after-{ancho}-{acto}.png`. La [galería de comparación](../../verification/about-brand-warp/comparison.html) permite alternar móvil/escritorio y los tres actos. Las capturas completas de un acto reflejan la fase de sus revelaciones por scroll; las tomas focales muestran pregunta, declaración revelada y cierre.

La matriz de producción pasa **136/136 comprobaciones**, en 320, 375, 390, 430, 768, 1024 y 1440 px, además de reduced motion en 390/1440. Se verifican fuentes, título accesible, geometría, ausencia de overflow horizontal, targets, selección mediante puntero y toque, Enter/foco, valores, scroll táctil y estado reducido. No hay errores de ejecución, consola o hidratación. El primer intento detectó fallos en el propio script de automatización al actuar después de capturas de página completa; se corrigió centrando y comprobando el objetivo antes de cada input. No requirió cambiar la interacción del producto.

Mediciones de esa matriz en Chrome 155 headless con **SwiftShader**, antes del guard final de Canvas2D (que solo altera la ruta de fallo):

| Medición | Resultado observado |
| --- | --- |
| JavaScript codificado inicial, antes / después | 360.472 / 361.909 bytes; diferencia de 1.437 bytes. Es una observación de esa carga, no un benchmark de todos los dispositivos. |
| Chunk del renderer Warp | 19.050 bytes codificados; no se solicita en el primer viewport, solo al entrar en About en un escritorio elegible. |
| Entrada → primer frame listo | 673–966 ms en los escritorios medidos con renderizado por software. |
| Contextos WebGL simultáneos | 1 de Hero en móvil; máximo 2 con Warp visible en escritorio. |
| Fuera de vista | Canvas Warp retirado/contexto perdido; cero dibujos posteriores del motor. |
| GPU física y memoria GPU | No medidas. No se atribuyen FPS de hardware ni equivalencia con iOS/Android físicos. |

Las métricas y entradas de recursos están en `after-report.json`. El prototipo usa `prototype-report.json`; la revisión visual incluyó capturas reales de móvil y escritorio, no únicamente assertions DOM.

Sobre el **último build**, con la protección de Canvas2D incluida, la revisión focal pasa **22/22 comprobaciones** (`focused-final-report.json`): móvil 390, escritorio 1440, 768 con puntero coarse, negación real de Canvas2D y de WebGL, declaración revelada, foco/teclado, ausencia de rasterización por frame y entrada por touch a Exhibition. Se confirma CardSwap visible y cero dibujos de Warp tras salir de About. Las dos rutas de fallo conservan el HTML y retiran el canvas. La negación deliberada de WebGL emite el diagnóstico esperado de OGL; no es un error espontáneo de los escenarios normales, donde no hubo errores de consola/hidratación. El nuevo chunk del guard final se registra en ese informe; la matriz anterior conserva las métricas y el nombre de su propio build.

| Comando / prueba | Resultado real |
| --- | --- |
| `npm.cmd run typecheck` | PASS. |
| `npm.cmd run lint` | PASS; comprobación final repetida tras las correcciones. |
| `npm.cmd run test:run -- --pool threads --maxWorkers 2` | **35 archivos, 299 tests PASS**, 209,13 s. No se modifica la configuración global de Vitest. |
| `npm.cmd run build` | PASS en Next.js 16.4.0: compilación 11,2 s; TypeScript 25,5 s; generación 1,774 s. Home estática; Exhibition dinámica. |
| Warp específico | 17 tests PASS: procedencia, fuente, HTML/fallback, pausa, ondas, error gráfico, Canvas2D, Strict Mode y cleanup. |
| Hidratación de About | Cinco escenarios de ancho/preferencia con `renderToString`, `hydrateRoot` y `onRecoverableError`; nodos e IDs conservados. |
| `git diff --check` | PASS. |

El primer run general encontró una expectativa histórica que comparaba literalmente el título sin contemplar su salto de línea. Se normaliza únicamente el espacio en esa comparación de texto del SSR; la accesibilidad, el contenido y las comprobaciones de nodos se mantienen. El segundo run completo pasa los 299 tests.

Al terminar se detuvieron los dos servidores de QA y Chrome headless propios, conservando capturas, informes y scripts. `next-env.d.ts` se devolvió a su contenido inicial tras la regeneración del build. Los borrados previos de licencias y el staging de los traslados About permanecen fuera de cualquier nuevo commit; no se añadieron cambios nuevos al índice.

No se ejecutará el commit de About ni se hará push sin aprobación. Mensaje propuesto tras revisión:

`feat(about): integrate Warp Text and official brand identity`
