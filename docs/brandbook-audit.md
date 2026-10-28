# CÈL·LULA — Auditoría del Brandbook y la web

Fecha: 20 de octubre de 2026. **Etapa A: auditoría; sin implementación visual ni editorial.**

Actualización del 23 de octubre de 2026: las etapas B y C están implementadas,
con el copy y la aplicación cromática aprobados por el usuario. La validación
de la etapa D, los ajustes responsive y las capturas figuran en el
[informe de cierre y validación](brand-identity-validation.md). El contenido
siguiente conserva el estado y las propuestas de la auditoría inicial.

Fuente de verdad: [CEL-LULA_Brandbook.pdf](../CEL-LULA_Brandbook.pdf), edición 2026, 43 páginas. Se ha leído el texto completo, renderizado las 43 páginas y revisado sus composiciones, con ampliación de las páginas de protección, contraste, color, tipografía, gradientes y trama. Los números de página de este informe corresponden a la página física del PDF, coincidente con su numeración principal.

SHA-256 del PDF inspeccionado: `89eb5d4be33c63e2ce03adb860e01076b8b46b8bb9cc4783021f5fced51ee7e0`.

La inspección de la web corresponde al código real de esta rama, no a las auditorías históricas ni a una validación en navegador. Las capturas generadas durante esta etapa son del manual; no son capturas de la web.

**Git y alcance autorizado**

- Repositorio: `Santiagon1996/cellula`; directorio real: `cellula/` dentro del workspace.
- Se ejecutaron `git status`, consulta de rama, `git fetch origin` y comprobación de referencias y divergencia.
- Tras el fetch, `HEAD`, `main` y `origin/main` coincidían en `cdd15ce8e3122ac4dc9ce4f1fd43c2ae9232483c` (`tipografia 1`). Divergencia `main...origin/main`: `0 / 0`; no fue necesaria ninguna actualización de main.
- `feature/brand-identity` no existía ni localmente ni en las referencias remotas actualizadas. Se creó mediante `git switch -c feature/brand-identity main`.
- El usuario autorizó expresamente conservar `next-env.d.ts` preparado para commit y el PDF sin seguimiento. Ambos permanecen en ese estado y no forman parte de una implementación de marca.
- No se modificó `main`; no se hicieron commits, merges, push ni cambios de estilos, fuentes, copy, imágenes o lógica.
- Único archivo nuevo dentro del repositorio en esta etapa: este informe. La extracción del PDF, sus láminas y la herramienta de lectura están fuera del repositorio, en `../verification/` respecto a su raíz.

**Cómo leer las conclusiones**

- **Regla oficial:** aparece expresamente en el manual. Una recomendación del manual se identifica como recomendación, sin convertirla en una medida rígida.
- **Interpretación web:** adaptación propuesta al proyecto o instrucción específica del encargo; no se atribuye al manual.
- **Pendiente de validación:** la evidencia disponible no permite confirmar el dato o existe una discrepancia documental.

**Tabla de diferencias**

| Propiedad | Valor o regla y clasificación | Página del manual | Uso actual del proyecto | Modificación propuesta |
| --- | --- | --- | --- | --- |
| Nombre | **Regla oficial:** CÈL·LULA. | 4–9 | Metadata, footer, navegación, datos y ARIA alternan CÉLULA, Célula y Cél·ula. | Unificar la grafía en los textos y nombres accesibles aprobados. Preservar el wordmark original como imagen. |
| Qué es | **Regla oficial:** laboratorio cultural híbrido de producción artística, experimentación, curaduría y comunidad; los procesos forman parte de la experiencia. | 6 | About y metadata describen un espacio creativo genérico. Home carece de esa explicación en el primer viewport. | Presentar la síntesis editorial propuesta más abajo, sin añadir actividades, servicios o proyectos reales. |
| Concepto | **Regla oficial:** sistema vivo; identidad que cambia, incorpora capas y se construye mediante procesos. | 8, 23 | Liquid Gradient, actos de About, carrusel y Contact ya aportan transformación. | Mantener estos mecanismos y alinear sus superficies y mensajes; no añadir nuevas animaciones por defecto. |
| Valores | **Regla oficial:** Experimentación, Transparencia, Evolución, Comunidad, Curaduría y Autenticidad. | 7 | About muestra Crear / Explorar / Conectar, con textos propios y aviso de aprobación pendiente. | Conservar los tres controles. **Interpretación web:** integrar los seis valores como contenido editorial secundario, sin convertirlos en seis interacciones. |
| Voz | **Regla oficial:** cercana, reflexiva, auténtica, clara, artística, honesta, curiosa y abierta al diálogo. | 9 | Tono generalmente cercano; conviven textos genéricos y contenidos provisionales. | Mantener frases concretas centradas en hacer, procesos y encuentro. **Interpretación web:** usar tuteo coherente con «Comparte», «Elige» y «Escríbenos» existentes. El manual no prescribe tuteo ni voseo. |
| Estructurales | **Regla oficial:** Cream, Green, Blue, Slate y Black; proporción recomendada aproximada del 70%. | 24 | Solo Cream, Blue y Slate están centralizados; faltan Green y Black. | Centralizar las cinco bases exactas, además de los tres activadores. No medir el 70% como una cuota rígida de píxeles ni afirmar una proporción actual sin revisar composiciones. |
| Activadores | **Regla oficial:** se muestran Green Electric, Orange y Pink; presencia puntual sobre una base estructural y recomendación aproximada del 30%. | 25 | Pink es el único activador central. Orange y Electric no tienen token global. | Añadir los valores exactos solicitados; conservar #E55EAE como variación mostrada, sin elevarla a noveno token base. Registrar las discrepancias de la lámina 25. |
| Comportamiento del color | **Regla oficial:** uno o dos estructurales predominantes, máximo dos activadores, mezclas/superposiciones/transparencias; equilibrar transiciones y colores sólidos; no declarar derivados como nuevos colores de marca. | 23, 26 | Hay duplicados locales y tonos derivados escritos en estilos, navegación y gradiente. | Mantener ocho bases y roles semánticos. Derivar variaciones contextuales desde esas bases cuando corresponda, revisando cada sección y los colores del contenido por separado. |
| Tipografía principal | **Regla oficial:** Acid Grotesk para títulos, cuerpos y composiciones de gran escala; se permite toda la familia. | 28 | `fonts.ts` carga Space Grotesk de Google bajo la variable `--font-acid`. | Sustituir el loader por `next/font/local`, con pesos reales y `display: swap`. Los roles y pesos por nivel son decisiones web, no restricciones absolutas del manual. |
| Tipografía de apoyo | **Regla oficial:** Basis Grotesque Mono Pro para subtítulos, cuerpos, información técnica y elementos secundarios; se permite toda la familia. | 28 | DM Mono de Google usa el alias `--font-basis-mono`. Las descripciones suelen heredar la proporcional. | Cargar Basis local. **Interpretación web:** usar Regular en descripciones, etiquetas y metadatos y Medium en controles pequeños, tras revisar legibilidad. |
| Interletrado | **Regla oficial:** interletrado recomendado −50 para ambas familias. El texto no expresa la unidad; los operadores de las muestras permiten inferir −.05em. | 28 | Existen trackings específicos, por ejemplo −.08em en el titular de Exhibition de Home y .08em en etiquetas. | **Interpretación web sustentada:** usar −.05em como referencia de las muestras, con revisión por rol y tamaño. No convertir a −50px ni imponerlo globalmente a controles y párrafos sin revisar legibilidad. |
| Logotipo e isotipo | **Regla oficial:** se documentan logo, iso, full logo, logo secundario, sellos y firmas. | 12–19 | Home usa los PNG originales de wordmark e isotipo y una transformación GSAP persistente. El wordmark local no incorpora la línea «Laboratori cultural» de algunas aplicaciones. | Conservar los PNG y `HomeIdentity`; no reconstruir, retipografiar ni añadir una bajada dentro del recurso original. Las variantes del manual no obligan a sustituir el recurso actual en esta etapa. |
| Área de protección | **Regla oficial:** margen mínimo definido por la altura de la letra «a» del logotipo. | 20 | El recurso se escala con límites responsive; no existe una unidad de protección explícita. | Comprobar espacio libre real alrededor de la marca en 390/1440 y el resto de tamaños; ubicar cualquier nuevo texto fuera de esa área sin cambiar la animación. No inventar una cifra en px. |
| Contraste de marca | **Regla oficial:** priorizar legibilidad del logo sobre fondos y mezclas complejas. | 21 | Wordmark e iso aplican un filtro cromático CSS sobre el gradiente. No se ha medido su contraste durante toda la transición. | Revisar el resultado compuesto, tanto el póster como el canvas y los estados al hacer scroll; no tomar una muestra del PDF como token sRGB. |
| Cuerpos | **Regla oficial:** movimiento y gestualidad, siluetas, desenfoques, transparencias, encuadres cerrados y carga emocional. | 30 | No hay una colección local de fotografía oficial de cuerpos en `public/`. | Reservar la integración para originales autorizados. El manual enlaza su carpeta de fotos; no sustituir con fotografía genérica. |
| Materia y organismos | **Regla oficial:** estructuras microscópicas, patrones orgánicos, materiales translúcidos, texturas naturales, formas celulares y fluidas. | 31 | Laboratory reutiliza tres SVG de demostración de Exhibition. | Mantener el carácter temporal hasta disponer de originales. La propuesta de usar fotografía de materia en Laboratory es una aplicación web, no evidencia de proyectos existentes. |
| Tratamiento de imagen | **Regla oficial:** superposiciones, transparencias, modos de fusión, grano, desenfoques y variaciones cromáticas; conservar la esencia del original. | 32 | Los SVG demo tienen su propio tratamiento. No hay archivos fotográficos/PSD oficiales locales. | No recolorear obras para uniformarlas con la UI. Registrar ubicaciones y enlaces de los originales antes de integrar material de marca. |
| Gradientes | **Regla oficial:** transiciones suaves, bordes difusos, mezclas, luminosidad y comportamiento orgánico. | 33 | Liquid Gradient ya cumple el enfoque fluido, pero usa cuatro anclas pastel ajenas a los ocho tokens; póster inicial generado desde el shader. | Conservar renderer y ciclo de vida. **Interpretación web:** explorar Cream/Blue predominantes, Green secundario y Pink como activador; verificar el equilibrio visual. Regenerar los recursos iniciales si cambia la paleta. |
| Trama | **Regla oficial:** expansión del isotipo como apoyo; baja opacidad con texto; no saturar, protagonizar ni distorsionar. | 34 | No se ha localizado el archivo original de la trama en `public/`. | Dejar identificada la ubicación de integración futura; no recrearla mediante SVG/CSS ni insertarla por obligación en todas las secciones. |
| Aplicaciones | **Regla oficial:** las láminas muestran convivencia de fondos sólidos, fotografía, trama, tipografía y mezclas; Barcelona, experimentación y Arte · Proceso · Comunidad aparecen como mensajes. | 11, 36–42 | La web no comunica varios de estos conceptos y se apoya en demostraciones vectoriales. | Tomar jerarquía y vocabulario como referencia sin copiar una maqueta impresa como layout web ni publicar sus datos de ejemplo como canales confirmados. |

**Paleta: ocho bases a centralizar**

| Rol | Nombre | HEX oficial solicitado | Estado actual |
| --- | --- | --- | --- |
| Estructural | Cream | `#EDE8E0` | Token global; repetido en estilos locales. |
| Estructural | Green | `#7AB596` | Falta token global. |
| Estructural | Blue | `#72A1B2` | Token global; repetido en navegación. |
| Estructural | Slate | `#5B5E74` | Token global; repetido en varias features. |
| Estructural | Black | `#1D1D1D` | Falta token global. |
| Activador | Green Electric | `#07F364` | Falta token global. |
| Activador | Orange | `#FF9940` | Falta token global. |
| Activador | Pink | `#FF66CC` | Token global. |

Evidencia: [globals.css](../src/app/globals.css), [About](../src/features/about/styles/about.module.css), [Exhibition](../src/features/exhibitions/styles/exhibition.css), [Laboratory](../src/features/laboratory/styles/laboratory.css), [Contact](../src/features/contact/styles/contact.module.css) y [Navigation](../src/features/home/components/home-navigation.module.css).

La página 25 presenta una muestra verde inferior etiquetada `#EDE8E0` y una muestra Pink `#FF66CC` cuyo texto RGB indica G:202 en vez de 102. También incluye `#E55EAE`. Son discrepancias de la lámina que no autorizan a cambiar los ocho HEX expresamente fijados en el encargo. Para CSS se proponen esos HEX; no un muestreo de la previsualización CMYK del PDF. No se corrige ni modifica el manual.

La regla de equilibrar mezclas y colores sólidos de p. 26 permite superficies sólidas: no exige un gradiente en cada sección. Los ejemplos de «contraste adecuado» de p. 21 se refieren al logotipo; no constituyen una garantía de legibilidad para textos pequeños o controles con las mismas parejas de colores.

Contrastes calculados con luminancia relativa sRGB a partir de colores opacos; no equivalen a una comprobación del render con imagen, alpha, filtro o gradiente:

| Combinación | Ratio aproximado | Implicación |
| --- | --- | --- |
| Slate / Cream | 5,22:1 | Base actual útil para lectura. |
| Black / Cream | 13,82:1 | Base editorial propuesta. |
| Cream / Pink | 2,15:1 | Revisar `.home-link`: texto pequeño Cream sobre Pink. |
| Cream / Blue | 2,31:1 | Revisar fondo de respaldo y estados de tarjetas; la imagen y caption pueden cambiar el resultado real. |
| Black / Green | 7,13:1 | Combinación candidata para Laboratory. |
| Black / Electric | 11,25:1 | Candidata para controles activos. |
| Black / Orange | 7,93:1 | Candidata para acciones y acentos de Contact. |
| Black / Pink | 6,44:1 | Candidata para texto sobre activador. |

**Fuentes: archivos y pesos verificados**

La ruta `C:\Users\Usuario\Downloads\celulaFonts` existe. Se han leído metadatos OpenType y contrastado los originales con las copias locales; los diez archivos presentes en `src/app/fonts` coinciden byte a byte con sus originales. Se mantiene la autorización de uso web confirmada por el usuario.

| Familia / archivos reales | Peso OpenType | Estilo | Observación |
| --- | --- | --- | --- |
| Acid `thin`, `extralight`, `light` | 100, 200, 300 | normal | OTF estáticos; no son fuentes variables. |
| Acid `normal` | 400 | normal | Copia local existente de 51.479 bytes. |
| Acid `regular` | 400 | normal | Original de 125.012 bytes; alternativa con contornos y métricas distintos, no un segundo peso. No está entre las diez copias locales. |
| Acid `medium`, `bold` | 500, 700 | normal | No hay archivos 600 ni 800 en el material entregado. |
| Basis `Regular`, `Medium` | 400, 500 | normal | Copias locales existentes. |
| Basis `Regular Italic`, `Medium Italic` | 400, 500 | italic real | Copias locales existentes; ángulo interno −11°. |

Todos los OTF tienen 1000 unidades/em, contornos CFF y cobertura de È, ·, Ñ, ñ y las flechas utilizadas. Acid Normal y Regular tienen 189 avances diferentes entre sus 262 caracteres Unicode comunes; no deben registrarse simultáneamente como la misma cara `400 normal`.

El PDF permite recomendar **Acid Regular como el 400 de referencia**, en lugar de adoptar Normal por continuidad histórica. Su fuente 400 embebida es `AcidGrotesk-Regular`, usada en dos separadores `|` de p. 28: ancho 201/1000 y bounding box `[-44 -309 2028 923]`, ambos idénticos al archivo Regular original. Normal tiene ancho 189 y bounding box `[-50 -306 2016 920]`. Evidencia verificable en los objetos PDF 20 y 304. La muestra principal de Acid es Bold: esta comprobación identifica el archivo 400 incorporado, pero no certifica visualmente todos los párrafos web. En B habrá que incorporar el Regular original de Downloads, que todavía no está entre las copias locales.

Para el interletrado se inspeccionaron los operadores de texto de p. 28: las muestras de Acid Bold y Basis Regular usan tamaño de fuente `1 Tf`, espaciado `-0.05 Tc` y una matriz que escala el texto. Por ello el ajuste adicional equivale a −.05em en esas muestras; los arrays `TJ` conservan además ajustes de kerning por pareja. Es una inferencia técnica del PDF, no una unidad impresa junto a «−50», ni una obligación de aplicar el mismo tracking a toda la UI.

`src/app/fonts/.gitignore` excluye `*.otf`, `*.woff`, `*.woff2` y `*.ttf`. Actualmente los binarios locales están ignorados y el loader Google no los usa. La etapa B debe revisar esa exclusión para que los recursos autorizados necesarios estén disponibles en un checkout/build reproducible, conforme al encargo.

La integración propuesta mantiene `--font-acid` y `--font-basis-mono`, los alias Tailwind v4 ya existentes en `@theme inline`, `display: swap` y fallback monoespaciado para Basis. No exige una dependencia tipográfica nueva: ambas sustitutas se importan desde `next/font/google`, dentro de Next.js. Deben retirarse esos loaders e importaciones cuando la carga local funcione.

**Copy para aprobación editorial; todavía sin incorporar**

| Sección | Copy actual | Propuesta exacta | Procedencia |
| --- | --- | --- | --- |
| Home | Hero: wordmark y «DESLIZA PARA DESCUBRIR». Metadata: «CÉLULA — Espacio creativo». | «LABORATORIO CULTURAL» / «ARTE · PROCESO · COMUNIDAD» / «Un espacio de experimentación creativa en Barcelona». Metadata propuesta: «CÈL·LULA — Laboratorio cultural». | Laboratorio cultural: p. 6; Arte · Proceso · Comunidad y experimentación/Barcelona: p. 37. La descripción y su disposición web son una adaptación, no una cita literal única. |
| About | «NO SOMOS UNA SOLA COSA.»; «Un espacio para la creación, el arte y la experimentación.» | Conservar «NO SOMOS UNA SOLA COSA.». Introducción: «Somos un laboratorio cultural donde conviven la producción artística, la experimentación, la curaduría y la comunidad». Valores: «Experimentación · Transparencia · Evolución · Comunidad · Curaduría · Autenticidad». | Declaración creativa existente, no frase oficial. Introducción adaptada de p. 6; valores de p. 7. Distribución en el acto editorial pendiente de revisión responsive. |
| Exhibition | Home: «DESTACADO DEL MES»; página propia: «Una pausa para mirar.» y descripción genérica. | «ARTE EN PROCESO.» / «Propuestas seleccionadas con intención, donde cada obra forma parte de una investigación, una práctica y una identidad propia». Mientras sigan los SVG actuales: «Selección de demostración». | Titular y descripción propuestos por el encargo; interpretación editorial coherente con pp. 6–7, no texto literal oficial. Aviso demo propuesto para evitar atribuir una selección mensual real a las muestras. |
| Laboratory | «Laboratorio»; «Forma, materia y nuevas maneras de crear.»; «Procesos abiertos. Ideas en movimiento.». | «LUGAR DE PRUEBA, DESARROLLO Y CRUCE.» / «Un espacio abierto a distintas prácticas creativas, donde experimentar también significa descubrir nuevas maneras de hacer». Mantener «MUESTRAS TEMPORALES» y «ESTUDIO TEMPORAL». | Frase presente en aplicaciones de pp. 11, 39 y 41; su uso como titular de la sección es una adaptación. Descripción propuesta por el encargo, no cita oficial. |
| Contact | «¿HACEMOS ALGO JUNTOS?»; «TODA IDEA COMIENZA CON UN CONTACTO.». | Conservar «¿HACEMOS ALGO JUNTOS?». Texto: «Las ideas crecen cuando se encuentran. Comparte tu propuesta, abramos una conversación y descubramos qué podemos crear». | Propuesta editorial del encargo con «Comparte» para mantener el tuteo actual. Ninguna de las dos frases es una regla literal del manual. |

Los datos de About y Contact ya están centralizados; Home, Exhibition y Laboratory contienen parte del copy inline. Conviene centralizarlo por feature al aplicar el texto aprobado, conservando IDs, enlaces, orden y estructura accesible. About también tiene frases divididas en JSX: habrá que mantener coherencia entre la versión visual y la accesible.

`HomeIntro` es un componente legado fuera del árbol de `HomeLanding`; cambiarlo no actualizaría el hero real. Del mismo modo, `shared/config/site.ts` y `navigation.ts` no son actualmente las fuentes que alimentan toda la interfaz.

Los cinco SVG de Exhibition y los tres estudios de Laboratory son demostraciones. En `/exposiciones` se identifican como tales; en el bloque de Home falta un aviso equivalente. No se proponen artistas, exposiciones, fechas ni proyectos reales. `contactChannels` mantiene `email: null` y `socials: []`; los canales pendientes deben seguir sin convertirse en enlaces.

**Aplicación cromática propuesta por sección**

Esta asignación procede del encargo y es **interpretación web**, no una plantilla de secciones obligatoria del manual.

| Sección | Superficie actual | Propuesta sin rediseño | Elementos que se preservan |
| --- | --- | --- | --- |
| Home | Hero con póster/canvas pastel; otras superficies con derivados lavanda/azul sobre Slate. | Una o dos bases predominantes entre Cream/Blue, Green secundario en la mezcla y Pink puntual; continuidad luminosa. Comprobar la paleta concreta visualmente antes de fijarla. | `HomeIdentity`, wordmark, isotipo, transformación, Three.js y comportamiento del Liquid Gradient. |
| About | Cream/Slate; Pink/Blue en nodos/final y derivados claros al entrar. | Cream/Black para narrativa, Slate para un acto contrastado y Pink como activador. | Descomponer → Conectar → Transformar y Crear / Explorar / Conectar; GSAP y ScrollTrigger. |
| Exhibition | Home con radiales y Slate; página propia Cream/Slate con acentos lavanda. | Black/Cream para inmersión y lectura; Blue estructural y Orange puntual en UI. | Slider, interacción, imágenes y colores propios de las obras. |
| Laboratory | Cream/Slate con marca Pink y tarjetas Blue/Cream. | Green estructural con Black o Cream según contraste; Electric como activador. | Carrusel, estados temporales, autoplay/pausas, foco, fullscreen y Flip. |
| Contact | Slate/Cream con acentos Pink y Blue. | Conservar bases y emplear Orange en acciones/acento, con tinta que mantenga legibilidad. | Tres modos, tabulación, canales validados y transiciones del módulo central. |
| Navigation | Tokens globales duplicados localmente y mezcla Lavender/Cream en hover/foco. | Referenciar el sistema global y mantener derivaciones justificadas. | Geometría, enlaces, scroll lock, inert, foco y animación. |

El póster es una dependencia técnica del cambio cromático de Home. La paleta actual es `#F7B3D4`, `#A1D6E4`, `#FFF1D7`, `#C8B4E5`. Se declara en los recursos generados y en `scripts/generate-liquid-poster.mjs`; el componente comprueba la correspondencia antes de usar la imagen inicial. Si cambia, hay que regenerar conjuntamente `liquid-initial-portrait.webp`, `liquid-initial-landscape.webp`, `liquid-initial.json` y `liquid-gradient-poster.ts`, incluidos placeholders y metadata. La prueba existente del póster verifica hash del shader, paleta, dimensiones y tamaños. Cambiar solo un prop cromático no mantiene ese contrato.

**Recursos originales y ubicaciones pendientes**

El PDF incluye enlaces de descarga para logos (p. 20), fuentes (p. 28), fotos (pp. 30–31), edits/PSD (p. 32), gradientes/PSD (p. 33) y trama (p. 34). Se han identificado esos enlaces en el documento, sin descargar carpetas ni sustituir material. Los originales fotográficos y la trama no aparecen en los recursos locales inspeccionados.

| Recurso | Punto de integración previsto, todavía no creado | Fuente |
| --- | --- | --- |
| Cuerpos y gestualidad | `public/brand/photography/bodies/`; usar solo donde apoye la narrativa, sin añadir un fondo fotográfico obligatorio al hero. | [Fotos enlazadas por el manual](https://drive.google.com/drive/folders/1O35VPUPoct2djKPe32RDthPSTHSllnhd?usp=drive_link), pp. 30–31. |
| Materia y organismos | `public/brand/photography/matter/`; futuras imágenes de datos de Laboratory, preservando los avisos temporales hasta contar con contenido confirmado. | Misma carpeta de fotos, pp. 30–31. |
| Tratamientos autorizados | `public/brand/imagery/`; revisar la composición del recurso original antes de reemplazar imágenes demo. | [Edits](https://drive.google.com/drive/folders/1ctBj4eVTdFbum5oHQkUO2P18Pss7TkpD?usp=drive_link), p. 32. |
| Trama original | `public/brand/patterns/`; apoyo de baja opacidad, sin reconstrucción. | [Trama enlazada](https://drive.google.com/drive/folders/1eVltRdWZM8lrg06cUGGlLtjv2UJRftuT?usp=drive_link), p. 34. |

Las carpetas indicadas son propuestas técnicas, no estructura oficial de marca. Los mockups de pp. 11 y 39 muestran, entre otros datos, `CARRER DE BLABLA,334`, un correo, una web y una cuenta social. Esa presencia en una aplicación gráfica no confirma que sean canales operativos: no se trasladarán al sitio sin confirmación factual.

**Pruebas y validación: estado real de la etapa A**

Se han inspeccionado las pruebas existentes. `vitest.config.mts` utiliza jsdom y `css: false`: sus resultados no prueban layout, carga real de fuentes, contraste, hidratación en navegador ni continuidad visual del gradiente. No se encontró una suite Playwright en el proyecto; existen herramientas y capturas de verificaciones históricas fuera del repositorio que no acreditan esta rama.

| Área | Cobertura existente revisada | Verificación pendiente tras implementar |
| --- | --- | --- |
| Home y Navigation | Apertura/cierre, foco, inert, Escape, scroll lock, enlaces, reduced motion y renderer decorativo. | Primer viewport real, carga local, logo/área de protección, póster → canvas y consola/hidratación. |
| About | Actos, datos, paneles, orden SSR/Home, GSAP, touch/teclado, selección rápida y reduced motion. | Saltos y máscaras con Acid/Basis; integrar valores sin sobrecarga. |
| Exhibition | Botones, teclado, drag/touch, centrado, anuncio y revelado de detalles, interrupción de scroll y estado vacío. | Contraste de overlay y nuevos titulares sin alterar las obras. |
| Laboratory | Geometría del loop, autoplay/pausa, visibilidad, teclado/touch, foco, fullscreen, Flip y resize. | Nuevo encabezado largo, caption móvil, fondos y continuidad del detalle. |
| Contact | Tres modos, tabs, estado SSR, selección rápida, canales pendientes/seguros y reduced motion. | Texto/máscaras con nuevas métricas, claridad de acciones y acento Orange. |
| Liquid Gradient | Póster SSR, inicialización prioritaria/diferida, resize/DPR, offscreen, WebGL/contexto, cleanup y reduced motion. | Nueva paleta y recursos sincronizados, ausencia de flashes en ambos tamaños prioritarios. |

About y Contact ya ejecutan `ScrollTrigger.refresh()` después de `document.fonts.ready`; se preservará esa lógica y se comprobará con fuentes reales. `HomeIdentity` lee la preferencia de movimiento al montar; la respuesta a cambios de preferencia durante la sesión es una limitación existente que se registra sin alterar ese componente.

Se detectaron riesgos tipográficos en textos pequeños de .5–.7rem, titulares con interlineado cercano a .88 y máscaras con clipping. La nueva métrica de Basis puede ampliar párrafos y la de Acid puede cambiar títulos fragmentados; los ajustes posteriores deben centrarse en layout, no en reescribir las animaciones.

**No ejecutado en esta etapa:** `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build`, navegador sobre la web, capturas actuales del sitio o pruebas responsive. No se declara ninguno de ellos aprobado. Se ejecutarán en las etapas autorizadas con comprobaciones intermedias; las expectativas existentes que fijan el copy actual se actualizarán junto al copy aprobado.

La validación posterior debe cubrir 320, 375, 390, 430, 768, 1024 y 1440 px, movimiento normal/reducido, teclado/touch, overflow, legibilidad, foco, carga de fuentes y consola. Capturas antes/después prioritarias: Home, About, Exhibition, Laboratory y Contact a 390 y 1440 px. Las láminas del manual generadas durante la auditoría no sustituyen esas capturas.

**Decisiones para las siguientes etapas**

1. **B, una vez autorizada:** integrar fuentes locales, revisar su inclusión en el repositorio, completar los ocho tokens y comprobar build/recursos sin aplicar aún copy o fondos por sección.
2. **C, una vez aprobado el copy:** aplicar el texto de esta propuesta, jerarquía y superficies por sección, con revisión intermedia. Si cambia la paleta del shader, regenerar y comparar los recursos iniciales en esa misma modificación.
3. **D:** ejecutar los cuatro comandos solicitados y las verificaciones reales de navegador, tamaños, reduced motion, interacción y capturas; documentar regresiones y pendientes.

No se requiere cambiar lógica de interacción para la propuesta actual. Si la verificación revela un problema que exija hacerlo, se documentará su justificación antes de intervenir.

Próximo commit propuesto, cuando la implementación y su validación estén autorizadas y realizadas: `feat(brand): align typography, colors and editorial content with brandbook`. No se ha ejecutado.
