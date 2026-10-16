# CELULA: auditoria del sistema de diseno y tipografia

> Registro histórico de la integración de Acid Grotesk y Basis Grotesque Mono.
> Desde el 2026-10-16 la configuración activa usa Space Grotesk y DM Mono; las
> comprobaciones tipográficas de este documento corresponden a la versión
> anterior. Consulte el [README de fuentes](../src/app/fonts/README.md).

Fecha: 2026-10-12. Rama de trabajo: `test/integration`.

## Alcance y evidencia

Esta auditoria conserva el inventario previo a la integracion y registra la
jerarquia solicitada por el usuario. Los valores existentes tienen procedencia
**Codigo**; los roles
propuestos tienen procedencia **Solicitud del usuario**. No se consideran
validados contra Figma.

Referencia recibida:
[CEL-LULA WEB](https://www.figma.com/design/V3UGthHJsw1LG4rQKLLrO2/CEL-LULA-WEB--Copia-?node-id=0-1).
Las llamadas de contexto y captura del conector fueron rechazadas por el limite
de llamadas MCP del plan Starter. El acceso web tampoco permitio leer el archivo.
No se inspeccionaron los nodos, estilos, variables ni medidas de Figma. Esta
limitacion impide afirmar fidelidad o definir cambios basados en ese documento.

## A: auditoria cromatica

El inventario cromatico se entrega por separado en
[design-system-color-audit.md](./design-system-color-audit.md). Incluye colores
solidos, transparencias, gradientes, mezclas, recursos y obras de demostracion,
con su procedencia y usos actuales. Ningun valor de esa lista se declara color
oficial de marca sin cotejarlo con Figma.

El usuario aporto despues los once OTF de `Downloads/celulaFonts` y confirmo
permiso de uso/alojamiento web de ambas familias. Esa confirmacion, recibida el
2026-10-12, autoriza avanzar con la integracion. Se mantiene el codigo existente
como referencia temporal de tamanos y geometria mientras Figma siga inaccesible.

## Arquitectura antes de la integracion

- Next.js App Router en `src/app`; `layout.tsx` importa `globals.css` y no carga
  fuentes mediante `next/font`.
- `globals.css` importa Tailwind CSS v4 con `@import 'tailwindcss'`. El plugin
  PostCSS es `@tailwindcss/postcss`; no hay `@theme` personalizado, tokens
  tipograficos propios ni utilidades semanticas compartidas.
- Tailwind Preflight aporta la familia sans del sistema y un interlineado base
  de `1.5`. Reinicia los encabezados para heredar tamano y peso; las diferencias
  observadas provienen de los estilos de cada feature o utilidades locales.
- La ruta `/` compone `HomeLanding`, `HomeNavigation`, `HomeIdentity` y
  `HomeAtmosphere`. Importa `home.css` y `home-motion.css`.
- `HomeNavigation` usa un CSS Module independiente. Las familias se repiten en
  selectores internos; su animacion y manejo de foco viven en componentes/hooks.
- `/exposiciones` y Home comparten `ExhibitionSlider` y `exhibition.css`.
  `.exhibition-page` y `.exhibition-slider` fuerzan Arial; los titulos del detalle
  fuerzan Georgia. Estas reglas anulan una futura familia global si no se migran.
- `HomeIdentity` muestra los PNG originales del wordmark y simbolo. Su `h1`
  contiene una imagen, no letras que deban convertirse a otra tipografia.
- `HomeIntro` usa utilidades Tailwind, pero no forma parte de la composicion
  actual de Home; solo aparece en su componente y pruebas.

Referencias: [layout](../src/app/layout.tsx),
[estilos globales](../src/app/globals.css),
[HomeLanding](../src/features/home/components/home-landing.tsx),
[navegacion](../src/features/home/components/home-navigation.module.css),
[exposiciones](../src/features/exhibitions/styles/exhibition.css).

## Inventario tipografico previo a la integracion

Estas tablas preservan la lectura inicial como baseline; no describen las nuevas
familias del sistema integrado. Todos los valores siguientes proceden del codigo
anterior a los cambios. `Sans base` significa la
familia sans del sistema heredada de Tailwind; `Mono nav` equivale a
`ui-monospace, SFMono-Regular, Consolas, monospace`. Un valor `heredado` no es un
token oficial. Salvo declaraciones indicadas, el peso base es 400, el estilo es
normal, el interlineado es 1.5 y el tracking CSS es `normal`.

Los `clamp(...vw...)` y trackings negativos se inventarian tal como existen; no
se crean durante la integracion. Los numeros de peso 600 y 800 iniciales no
tienen archivo equivalente entre las variantes oficiales entregadas.

### Home

Fuente: [home.css](../src/features/home/styles/home.css) y
[home-motion.css](../src/features/home/styles/home-motion.css).

| Selector / funcion | Familia actual | Peso | Tamano | Interlineado | Tracking |
| --- | --- | --- | --- | --- | --- |
| `.home-identity__heading` / wordmark PNG | No aplica a la imagen | Heredado | Heredado | 0 | Heredado |
| `.home-hero__scroll` | `monospace` | Heredado 400 | `.72rem` | Heredado 1.5 | `.08em` |
| `.home-about__kicker` | `monospace` | Heredado 400 | `.72rem` | Heredado 1.5 | `.08em` |
| `.home-featured__eyebrow` | `monospace` | Heredado 400 | `.72rem` | Heredado 1.5 | `.08em` |
| `.home-about__statement` | Sans base | 700 | `clamp(2.6rem, 7vw, 8rem)` | `.9` | `-.075em` |
| `.home-about h2` | Sans base | 800 | `clamp(3.6rem, 11vw, 8rem)` | `.93` | `-.075em` |
| `.home-about h2 em` | Heredada del h2; estilo normal explicito | Heredado 800 | Heredado | Heredado | Heredado |
| `.home-about__content > p:not(.home-about__kicker)` | `monospace` | Heredado 400 | `.85rem` | `1.55` | Heredado normal |
| `.home-link` / CTA | `monospace` | Heredado 400 | `.95rem` | Heredado 1.5 | Heredado normal |
| `.home-featured > h2` | Sans base | 800 | `clamp(4rem, 12vw, 10rem)` | `.9` | `-.08em` |
| `.home-footer` | `monospace` | Heredado 400 | `.75rem` | Heredado 1.5 | Heredado normal |

Responsive inicial: a `max-width: 700px`, `.home-featured > h2` mide `3rem`.
A `min-width: 768px` cambian paddings de About/Footer, sin redefinir su tipo.
A `max-width: 640px` cambia el ancho del wordmark imagen; se conserva el recurso.
El slider de Home usa exactamente los estilos tipograficos compartidos de
Exposiciones, con overrides de color, no de familia o tamano.

### Navegacion fullscreen

Fuente: [home-navigation.module.css](../src/features/home/components/home-navigation.module.css).

| Selector | Familia actual | Peso | Tamano | Interlineado | Tracking |
| --- | --- | --- | --- | --- | --- |
| `.toggle` / MENU-CERRAR | Mono nav | 600 | `.75rem` | `1` | `.03em` |
| `.toggleLabel` / caja de textos | Heredada | Heredado 600 | Heredado | `1.15` | Heredado `.03em` |
| `.kicker` | Mono nav | 400 | `.7rem` | `1.4` | `.1em` |
| `.note` | Mono nav | 400 | `.8rem` | `1.65` | Heredado normal |
| `.number` | Mono nav | 400 | `.66rem` | `1.3` | `.03em` |
| `.label` / enlaces principales | `Arial, Helvetica, sans-serif` | 700 | `clamp(2rem, 3.8vw, 5.6rem)` | `.99` | `-.075em` |
| `.arrow` / caracter de flecha | `Arial, Helvetica, sans-serif` | Heredado 400 | `clamp(1.4rem, 2.1vw, 2.6rem)` | `1` | Heredado normal |
| `.pending` / estado proximo | Mono nav | 400 | `.56rem` | `1.5` | `.075em` |
| `.footer` | Mono nav | 400 | `.64rem` | `1.5` | `.055em` |

| Condicion responsive | Cambios tipograficos |
| --- | --- |
| `max-width: 800px` | Kicker `.61rem`; note `.66rem`/`1.4`; label `clamp(1.65rem, 8.1vw, 3.75rem)`; number `.56rem`; arrow `1.5rem`; pending `.5rem`; footer `.54rem`. |
| `max-height: 640px` y `max-width: 800px` | Kicker `.56rem`; note `.6rem`; label `clamp(1.5rem, 7.9vw, 2.75rem)`. |

La geometria, las transiciones y el movimiento de filas y labels se mantienen.
La futura familia debe comprobarse con enlaces largos, safe areas, foco, scroll
del panel y pantallas bajas en estas dos condiciones.

### Exposiciones y slider compartido

Fuente: [exhibition.css](../src/features/exhibitions/styles/exhibition.css).
`Arial` y `Georgia` en la tabla representan las pilas completas declaradas:
`Arial, Helvetica, sans-serif` y `Georgia, 'Times New Roman', serif`.

| Selector | Familia actual | Peso | Tamano | Interlineado | Tracking |
| --- | --- | --- | --- | --- | --- |
| `.exhibition-page` / base | Arial | Heredado 400 | Heredado `1rem` | Heredado 1.5 | Heredado normal |
| `.exhibition-brand` / texto de marca | Georgia | Heredado 400 | `2.75rem` | `1` | `-.075em` |
| `.exhibition-header__navigation` | Arial heredada | Heredado 400 | `.75rem` | Heredado 1.5 | Heredado normal |
| `.exhibition-eyebrow` | Arial heredada | 500 | `.625rem` | Heredado 1.5 | `.17em` |
| `.exhibition-intro h1` | Georgia | 400 | `clamp(2.4rem, 4.9vw, 4.8rem)` | `1.05` | `-.055em` |
| `.exhibition-intro h1 em` | Georgia heredada, italic | 400 | Heredado | Heredado | Heredado |
| `.exhibition-intro__description` | Arial heredada | Heredado 400 | `.75rem` | `1.8` | Heredado normal |
| `.exhibition-slider` / base compartida | Arial | Heredado 400 | Heredado | Heredado 1.5 | Heredado normal |
| `.exhibition-slider__detail h2` | Georgia | 400 | `clamp(2rem, 3.3vw, 2.75rem)` | `1.08` | `-.045em` |
| `.exhibition-slider__detail p` / descripcion | Arial heredada | Heredado 400 | `.8rem` | `1.65` | Heredado normal |
| `.exhibition-slider__detail p:first-of-type` / tecnica | Arial heredada | Heredado 400 | `.625rem` | `1.5` | `.1em` |
| `.exhibition-slider__counter` | Arial heredada | Heredado 400 | `.7rem` | Heredado 1.5 | `.16em` |
| `.exhibition-slider__hint` | Arial heredada | Heredado 400 | `.7rem` | `1.5` | Heredado normal |
| `.exhibition-slider__navigation button` / flechas | Arial heredada | Heredado 400 | `1.15rem` | `1` | Heredado normal |
| `.exhibition-footer` | Arial heredada | Heredado 400 | `.625rem` | `1.5` | Normal; primer span `.08em` |

El contador activa `font-variant-numeric: tabular-nums`. El estado accesible del
slider esta oculto visualmente y hereda la familia de su contenedor.

Responsive a `max-width: 700px`: brand `2.2rem`, navegacion `.65rem`, h1
`clamp(2.5rem, 10vw, 4rem)` con ancho maximo `21rem`, descripcion `.7rem`, h2
del detalle `2.1rem` e hint `.65rem`. Tambien cambian el ancho de las obras a
`min(80vw, 25rem)`, paddings y distribucion del footer/controles. Una futura
fuente debe caber dentro de la obra de relacion `4 / 5`, incluyendo titulo,
tecnica y descripcion al revelarse.

La marca textual `.exhibition-brand` no es el PNG original de Home. Su tratamiento
queda pendiente de Figma y de la prohibicion de alterar el wordmark original.
La lista Acid no contiene una variante italic real. La integracion conserva el
`em` semantico del h1, pero usa `font-style: normal` para no pedir una italic
inexistente; el tratamiento definitivo queda pendiente de cotejo con Figma.

## Jerarquia propuesta, pendiente de Figma

Esta tabla reproduce la solicitud del usuario. No valida que esos roles,
tamanos, pesos o estilos coincidan con el archivo de Figma inaccesible.

| Rol | Familia solicitada | Peso / estilo | Diferencia inicial o cotejo pendiente |
| --- | --- | --- | --- |
| H1 / H2 de texto | Acid Grotesk | 700 normal | Home usaba 800; Exposiciones, Georgia 400. El h1 de imagen no se modifica. |
| H3 / H4 | Acid Grotesk | 500 normal | Centralizar rol para las futuras paginas. |
| Navegacion fullscreen | Acid Grotesk | 500 normal | `.label` usaba Arial 700; 500 sigue la solicitud y queda pendiente de Figma. |
| Parrafos descriptivos | Acid Grotesk | 400 normal | Home usaba mono; distinguir las etiquetas implementadas con `p`. |
| MENU / CERRAR | Basis Grotesque Mono Pro | 500 normal | `.toggle` usaba mono 600; no existe archivo oficial 600 entre los originales. |
| Etiquetas / categorias | Basis Grotesque Mono Pro | 400 normal | Incluye kickers, eyebrows, tecnica y estados, segun su funcion. |
| Fechas / numeraciones | Basis Grotesque Mono Pro | 400 normal | Mantener comportamiento del contador y verificar cifras tabulares. |
| Footer | Basis Grotesque Mono Pro | 400 normal | Confirmar variantes frente a Figma en Home, menu y Exposiciones. |
| Italicas secundarias | Basis Grotesque Mono Pro | 400 / 500 italic | Usar cada archivo italic real; Acid no dispone de italic en el juego entregado. |

La integracion centraliza familias/pesos de encabezados y parrafos en la capa
base y roles auxiliares en utilidades compartidas. Los tamanos, interlineados y
geometria existentes por seccion se conservan como referencia temporal; no se
atribuyen a Figma. No crear un `@font-face` adicional por componente ni mantener
familias genericas que anulen el rol global.

### Aplicacion de familias y pesos

| Consumidor / rol | Antes | Integracion solicitada |
| --- | --- | --- |
| Base y parrafos descriptivos | Sans del sistema / Arial 400; descripcion Home mono 400 | Acid 400 normal |
| H1 / H2 y statement de Home | Sans 700/800 o Georgia 400 | Acid 700 normal |
| H3 / H4 | Herencia sin rol propio | Acid 500 normal |
| Enlaces principales fullscreen `.label` | Arial 700 | Acid 500 normal |
| MENU / CERRAR `.toggle` | Mono generica 600 | Basis 500 normal |
| Kickers / eyebrows / tecnica / estados | Mono generica 400 o Arial 400/500 | Basis 400 normal |
| Numeros y contador | Mono generica o Arial 400 | Basis 400 normal; comportamiento y cifras tabulares conservados |
| Footer de Home/menu/Exposiciones | Mono generica o Arial 400 | Basis 400 normal |
| `.exhibition-intro h1 em` | Georgia 400 italic | Acid 700 normal con `em` semantico preservado |
| Wordmark y simbolo de Home | Imagenes PNG originales | Mismos recursos; no se sustituyen por texto |

Estas sustituciones siguen el sistema requerido por el usuario. Los tamanos,
interlineados, tracking, breakpoints, estructura y animaciones iniciales se
conservan; la coincidencia con Figma no se ha validado. Las italic Basis reales
se registran para consumidores secundarios actuales o futuros que pidan 400/500
italic sin simular el estilo.

## B: sistema tipografico

Se localizaron y auditaron los once originales del directorio autorizado
`C:/Users/Usuario/Downloads/celulaFonts/`. `GlyphTypeface` de Windows y fontkit
incluido en Next.js confirman Acid 100, 200, 300, 400, 500 y 700 normales, y
Basis 400/500 normales e italicas. Todos son OpenType OTF con contornos CFF.
No faltan variantes requeridas para el sistema solicitado.

Acid trae Normal y Regular, ambos 400 normal, pero sus hashes, contornos y
metricas difieren. Se selecciona `acid-grotesk-normal.otf` como unico 400 normal,
por coherencia de compilacion con las otras cinco variantes Acid; no se renombra
ni se registra un segundo 400 equivalente. Regular queda documentado como
alternativa real sin duplicarlo en el loader. Figma no permitio cotejar esta
eleccion.

El inventario real, los hashes, cobertura, derechos internos, diferencias de
Normal/Regular y metadatos se documentan en
[font-file-audit.md](./font-file-audit.md). Acid declara copyright Folch Studio
2019 y embedding Editable; Basis, Colophon Foundry 2015 y embedding Installable.
Esos indicadores se registran como informacion tecnica. El permiso de uso y
alojamiento web proviene de la confirmacion expresa del usuario del 2026-10-12.
No se presupone permiso de redistribucion en Git: los OTF permanecen ignorados.

El detalle de nombres originales, rutas de destino, metadatos y pasos de
integracion esta en [src/app/fonts/README.md](../src/app/fonts/README.md).
Si se aportan WOFF2 autorizados, se priorizaran tras verificar sus metadatos y
licencia. No se descargaron fuentes alternativas ni se generaron archivos de
fuente o conversiones.

## C: cambios realizados

Se conserva la auditoria inicial y se implementa el sistema mediante loaders
locales y variables compartidas. La lista final se completa con los archivos
de integracion:

- [README de fuentes](../src/app/fonts/README.md): ubicaciones exactas,
  correspondencia de originales y pesos, permiso de web confirmado y carga.
- `src/app/fonts/fonts.ts`: una instancia
  `next/font/local` por familia, seis fuentes Acid y cuatro Basis, con estilos
  explicitos, `display: 'swap'`, `--font-acid` y `--font-basis-mono`.
- `src/app/fonts/.gitignore`: excluye OTF, WOFF, WOFF2 y TTF, tambien en
  subdirectorios. El permiso de web no implica inclusion de los originales en Git.
- `src/app/fonts/acid-grotesk/.gitkeep` y
  `src/app/fonts/basis-grotesque-mono/.gitkeep`: reservan los destinos originales.

La plantilla inicial se activo como `fonts.ts`; no queda un archivo de ejemplo
duplicado. `preload: false` evita
precargar todas las variantes por ruta; las diez caras se comprobaron con los
archivos reales en navegador. Acid conserva el ajuste de fallback Arial de Next;
Basis desactiva ese ajuste proporcional y usa fallback monoespaciado.
La validacion de metricas y layout en navegador se registra en la entrega.

La integracion aplica ambas clases `.variable` en el elemento raiz y define
estos alias de Tailwind v4:

```css
@theme inline {
  --font-sans: var(--font-acid);
  --font-mono: var(--font-basis-mono);
}
```

Se conectan loaders en `layout.tsx`, aliases/roles globales en `globals.css`
y los consumidores de Home, navegacion y Exposiciones. Se preservan los recursos
del wordmark/simbolo, GSAP, ScrollTrigger, Three.js y transiciones del menu/slider.
La verificacion final distingue disponibilidad estatica de los archivos,
compilacion de la aplicacion y carga de los recursos en navegador.

| Archivo creado o modificado | Justificacion |
| --- | --- |
| `docs/design-system-audit.md` | Conservar el inventario inicial y documentar arquitectura, roles, integracion, alcance y pendientes. |
| `docs/design-system-color-audit.md` | Registrar HEX, transparencias, mezclas y efectos con procedencia y uso recomendado. |
| `docs/font-file-audit.md` | Documentar los once originales comprobados, hashes, cobertura y seleccion de las diez variantes del loader. |
| `src/app/fonts/README.md` | Precisar originales, pesos comprobados, permiso de web confirmado y configuracion. |
| `src/app/fonts/fonts.ts` | Cargar diez variantes reales con dos instancias next/font/local, variables y fallbacks compartidos. |
| `src/app/layout.tsx` | Exponer ambas variables de fuente en el elemento raiz. |
| `src/app/globals.css` | Mapear variables a Tailwind v4 y definir roles tipograficos reutilizables. |
| `src/features/home/styles/home.css` | Consumir roles compartidos en encabezados, parrafos, etiquetas, CTA y footer. |
| `src/features/home/components/home-landing.tsx` | Aplicar utilidades de familia y peso a etiquetas, CTA, statement y footer sin cambiar secciones. |
| `src/features/home/components/home-navigation.tsx` | Aplicar Basis Medium al boton MENU / CERRAR sin cambiar la logica del menu. |
| `src/features/home/components/home-navigation-content.tsx` | Aplicar Acid Medium a enlaces y Basis Regular a etiquetas, numeraciones y footer. |
| `src/features/home/components/home-navigation.module.css` | Usar Acid en enlaces y Basis en controles/etiquetas/numeracion/footer. |
| `src/app/exposiciones/page.tsx` | Aplicar pesos/roles compartidos a navegacion, eyebrow y footer. |
| `src/features/exhibitions/components/exhibition-slider.tsx` | Marcar tecnica, indicacion, contador y estados con utilidades de familia/peso sin cambiar la logica del slider. |
| `src/features/exhibitions/styles/exhibition.css` | Consumir las familias oficiales en intro, detalle, metadatos y footer compartidos por ambas rutas. |
| `src/app/fonts/.gitignore` | Mantener originales propietarios fuera de Git, sin asumir permiso de redistribucion. |
| `src/app/fonts/acid-grotesk/.gitkeep` | Mantener el directorio de destino Acid sin crear archivos tipograficos. |
| `src/app/fonts/basis-grotesque-mono/.gitkeep` | Mantener el directorio de destino Basis sin crear archivos tipograficos. |

Los diez originales seleccionados se copian a `src/app/fonts/acid-grotesk/` y
`src/app/fonts/basis-grotesque-mono/`; se enumeran por nombre en la auditoria de
archivos y README. Su condicion de ignorados evita su inclusion accidental en Git.

## Estado de entregables

| Entrega | Estado | Evidencia / pendiente |
| --- | --- | --- |
| A: auditoria cromatica | Inventario de codigo preparado; Figma pendiente | Documento cromatico con tabla de HEX, procedencia y uso recomendado. |
| B: sistema tipografico | Integrado y comprobado | Diez variantes reales cargadas, variables, roles y permiso de uso web confirmado. |
| C: cambios realizados | Documentados | Auditorias preservadas y archivos de integracion enumerados y justificados. |
| D: verificacion | Scripts y cuatro vistas aprobados | TypeScript, lint, 46 tests, build, fuentes, fallback y recorridos de Home/menu/Exposiciones. |
| E: pendientes | Identificados | Cotejo con Figma y permiso independiente de redistribucion en Git. |

Se trabaja sobre `test/integration`. La implementacion inicial se valido sin
commit ni push. El usuario autorizo despues revisar y confirmar exclusivamente
la tipografia en esta rama antes de crear `feature/laboratory`; no se realiza
push, merge ni rebase. No se instalaron nuevas dependencias.
Las fuentes y autorizacion web ya estan disponibles. La fidelidad contra Figma
queda pendiente de acceso a ese documento; la implementacion sigue la jerarquia
solicitada y conserva la geometria existente como referencia temporal autorizada.

## D: verificacion

| Comprobacion | Estado |
| --- | --- |
| `npm run typecheck` | Aprobado con las fuentes y consumidores activos. |
| `npm run lint` | Aprobado. |
| `npm run test:run -- --maxWorkers=1 --pool=threads` | Aprobado: 7 archivos y 46 pruebas; timeout original de 5000ms conservado. |
| `npm run build` | Aprobado: compilacion, TypeScript y generacion de `/`, `/_not-found` y `/exposiciones`. |
| Peso y estilo real de las diez variantes oficiales | Confirmados por OS/2 y GlyphTypeface; ver auditoria de archivos. |
| Carga de fuentes en navegador | Diez caras `loaded`, `display: swap`, respuestas HTTP 200 y SHA256 identicos a los diez OTF seleccionados en las cuatro vistas. |
| Fallbacks e hidratacion | Arial y Consolas comprobadas con las peticiones de fuentes bloqueadas. Cero errores Runtime/hidratacion en recorridos normales y fallback. |
| Responsive del nuevo sistema | Aprobado en 1440 x 900, 768 x 1024, 390 x 844 y 320 x 568; sin overflow horizontal ni recortes/solapamientos de los textos de las cinco obras. |
| Desplazamientos de layout | CLS observado durante los recorridos: desktop Home 0.0012996 y Exposiciones 0.00002529; 0 en ambas rutas de las otras tres vistas. No se afirma CLS cero general. |
| Fidelidad visual contra Figma | Pendiente: acceso al documento limitado por el conector. |

La compilacion por si sola no demuestra la carga de cada variante en navegador
ni coincidencia con un diseno que no se pudo leer. En el baseline de preparacion,
lint y build pasaron; cuatro pruebas superaron el timeout de 5000ms al ejecutar
build y tests simultaneamente, con 42 aprobadas. Ese resultado fue anterior a
activar las fuentes. La repeticion sin esa concurrencia aprobo las 46 pruebas,
sin cambiar tests ni limites de tiempo. Se utilizo un worker y pool `threads`
para evitar contencion e incidencias locales de arranque del pool `forks`.

### Comprobaciones de navegador

Se recorrieron Home, menu fullscreen y Exposiciones en Chrome headless mediante
CDP contra `http://127.0.0.1:3100`. El script local reproducible es
[check-typography.mjs](../../verification/check-typography.mjs). Los informes
[desktop](../../verification/typography-desktop.json),
[tablet](../../verification/typography-tablet.json),
[movil](../../verification/typography-mobile.json) y
[320px](../../verification/typography-small.json), con sus capturas
`typography-*.png`, estan en el directorio `verification/` del workspace,
fuera del repositorio Git. Son evidencia local de esta ejecucion.

- `document.fonts.load`, los estados `FontFace` y las reglas CSS confirmaron los seis pesos Acid
  y las cuatro combinaciones Basis, incluidas las italicas 400/500. Los estilos
  computados coinciden con los roles del sistema y las metricas CSS previas.
- Las respuestas de red conservaron exactamente los bytes originales de los
  diez OTF seleccionados. No se cargo el Acid Regular alternativo.
- Las cinco obras se recorrieron en Exposiciones y se comprobaron los controles
  anterior/siguiente del slider de Home, tambien despues de abrir/cerrar el menu.
- El menu mostro seis filas, aplico `inert` al contenido y restituyo scroll al
  cerrarse con Escape. Sus enlaces, etiquetas y boton conservaron sus metricas.
- Wordmark y simbolo PNG se cargaron; imagenes y canvas mostraron pixels no
  uniformes. Se revisaron capturas de desktop y movil, sin modificar recursos,
  GSAP, ScrollTrigger, Three.js, estructura ni logica de interacciones.
- La prueba de fallback bloqueo deliberadamente las peticiones de fuentes en
  desktop y comprobo fuentes de plataforma reales mediante CDP. Los errores de
  red por esos bloqueos se separan de errores de aplicacion/hidratacion.
- El CLS se registro con `PerformanceObserver` durante todo el recorrido,
  incluyendo carga e interacciones; no equivale exclusivamente al font swap.
  En desktop sus fuentes incluyen el boton/menu y la descripcion de Exposiciones.
  Los valores son pequenos pero no nulos; las otras vistas registraron cero en
  esta ejecucion. No se infiere ausencia de desplazamientos en todo dispositivo.

Estos resultados verifican el codigo actual y los escenarios recorridos, no
fidelidad con Figma ni cobertura de todos los navegadores posibles.

## E: pendientes

- Recuperar acceso al documento Figma o recibir sus estilos exportados para
  cotejar colores, familias, pesos, tamanos, interlineados, tracking y estados.
- Cotejar con Figma la seleccion Normal 400 de Acid y el tratamiento de la marca
  textual de Exposiciones y su h1, preservando el wordmark original.
- No se aportaron WOFF2 autorizados: se usan los OTF originales. No falta ningun
  peso requerido; Acid italic no forma parte del material ni del sistema pedido.
- Mantener las fuentes fuera de Git hasta contar con permiso de redistribucion;
  este punto no bloquea el uso/alojamiento web ya confirmado por el usuario.
  Un checkout limpio y CI necesitan provisionar los diez OTF por una via privada
  antes de compilar, segun el README de fuentes; el fallback de navegador no
  reemplaza archivos locales ausentes durante el build.
