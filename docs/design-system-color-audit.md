# CELULA: auditoria cromatica del codigo

Fecha: 2026-10-12. Rama inspeccionada: `test/integration`.

## Alcance y procedencia

Este inventario describe los valores escritos en el codigo actual y su funcion
observada. No declara una paleta oficial ni cambia colores, efectos o recursos.
La referencia de Figma es
[CEL-LULA WEB](https://www.figma.com/design/V3UGthHJsw1LG4rQKLLrO2/CEL-LULA-WEB--Copia-?node-id=0-1).
Los intentos de obtener contexto y captura fueron rechazados por el limite de
llamadas MCP del plan Starter. El documento de Figma no se pudo inspeccionar:
todos los valores de esta auditoria tienen procedencia **Codigo**. Los roles
oficiales de marca y las coincidencias con Figma quedan pendientes.

Metodo: lectura de todos los estilos de la aplicacion, recorrido de declaraciones
CSS con el parser PostCSS existente, lectura de literales TypeScript mediante su
AST y analisis XML de los cinco SVG de demostracion. Se revisaron los consumidores
de variables, la cascada de Home, el fallback CSS y la interpolacion del shader.
Se excluyen la paleta generica de Tailwind no utilizada y las variaciones de pixels
de PNG, antialiasing, mezclas, ruido, sombras y composicion en pantalla.

Referencias de codigo:

- [G: estilos globales](../src/app/globals.css).
- [H: estilos de Home](../src/features/home/styles/home.css).
- [M: identidad y atmosfera de Home](../src/features/home/styles/home-motion.css).
- [N: navegacion](../src/features/home/components/home-navigation.module.css).
- [E: exposiciones y slider](../src/features/exhibitions/styles/exhibition.css).
- [L: paleta de LiquidGradient](../src/shared/ui/liquid-gradient/liquid-gradient.tsx).
- [F: fallback de LiquidGradient](../src/shared/ui/liquid-gradient/liquid-gradient.module.css).
- [S: shader de LiquidGradient](../src/shared/ui/liquid-gradient/liquid-gradient-shaders.ts).

Las referencias `G:3`, por ejemplo, indican archivo y linea del inventario previo
a integrar las fuentes. Los cambios tipograficos posteriores pueden desplazar
estas lineas; los selectores y las variables identifican cada declaracion.
Los nombres descriptivos siguientes son etiquetas del inventario, no tokens nuevos.

## Valores opacos de interfaz y anclas de gradientes

Hay 20 valores HEX opacos distintos en CSS y TypeScript. Un color empleado como
ancla de un gradiente no equivale al color solido de toda la superficie.

| Valor HEX | Procedencia | Ubicacion y uso actual | Tipo y estado | Uso recomendado |
| --- | --- | --- | --- | --- |
| `#5B5E74` | Codigo | G:3 `--color-slate`; H:3 hero y texto; M:14 scroll; N:2 `--nav-slate`; E:2 `--exhibition-ink` | Solido y base de fondo; activo | Conservar tinta principal, contornos, focus y base oscura de destacados. Confirmar rol oficial en Figma. |
| `#EDE8E0` | Codigo | G:3 `--color-cream`; N:3 `--nav-cream`; E:7 fondo; M:13 hero; H:7,16,23 fondos/textos | Solido y ancla; activo | Conservar superficies claras, texto sobre destacados y fondo del menu. |
| `#FF66CC` | Codigo | G:3 `--color-pink`; H:14 fondo de CTA; N:4 `--nav-pink` | Acento saturado activo en Home; token local de nav sin consumidor | Mantener acento y contraste artistico actual; validar contraste del texto antes de ampliar su uso. No convertirlo al rosa pastel del shader. |
| `#72A1B2` | Codigo | G:3 `--color-blue`; H:11 titulo; H:22 hover de CTA claro; N:5 `--nav-blue` | Solido activo en Home; token local de nav sin consumidor | Mantener titulo de Home y estado hover existente; confirmar papel secundario en Figma. |
| `#E9E7E5` | Codigo | H:3 fondo declarado de `.home-hero` | Solido declarado; M:13 declara `#EDE8E0` despues con igual especificidad | Conservar la declaracion hasta comprobar su funcion; no presentarla como fondo final confirmado de Home. |
| `#C7E4E8` | Codigo | H:7 `.home-about`, stop 0% | Ancla de gradiente activa | Reservar a la transicion de esta seccion. |
| `#E2E4E8` | Codigo | H:7 `.home-about`, stop 15% | Ancla de gradiente activa | Reservar a la transicion de esta seccion. |
| `#EDDCE7` | Codigo | H:7 `.home-about`, stop 32% | Ancla de gradiente activa | Reservar a la transicion de esta seccion. |
| `#AB91AA` | Codigo | H:16 primer gradiente radial de `.home-featured` | Ancla de gradiente activa | Conservar la masa cromatica de destacados sobre la base Slate. |
| `#78A7BC` | Codigo | H:16 segundo gradiente radial de `.home-featured` | Ancla de gradiente activa | Conservar la masa cromatica de destacados sobre la base Slate. |
| `#CAB9E5` | Codigo | N:6 `--nav-lavender`; N:218 mezcla del hover/focus | Entrada de `color-mix`, activa | Conservar como entrada de la mezcla del menu, sin identificarla con la lavanda del shader. |
| `#78798A` | Codigo | E:3 `--exhibition-muted`; enlaces, descripcion, indicacion del slider y footer | Solido activo en Exposiciones | Mantener texto secundario. Home sustituye `--exhibition-muted` por Cream en su slider. |
| `#B3ABB0` | Codigo | E:55 separador `/` del header | Solido activo en Exposiciones | Mantener como separador contextual; no elevarlo a color de marca. |
| `#BCA2BD` | Codigo | E:81 punto de etiqueta; E:280 borde hover del control del slider | Solido activo | Mantener acento contextual de exposiciones y estado del control. |
| `#F3EEE5` | Codigo | E:160 fondo de `.exhibition-slider__artwork` | Solido activo; normalmente cubierto por la imagen | Mantener superficie de respaldo de las obras. No confundirlo con Cream. |
| `#E4DCE3` | Codigo | E:281 fondo hover de los controles del slider | Solido activo | Mantener estado hover contextual. |
| `#F7B3D4` | Codigo | L:17 rosa de `pastelPalette`; uniforme `u_pink` y `--liquid-pink` | Ancla del efecto/fallback, activa | Reservar al LiquidGradient existente. |
| `#A1D6E4` | Codigo | L:17 azul de `pastelPalette`; uniforme `u_blue` y `--liquid-blue` | Ancla del efecto/fallback, activa | Reservar al LiquidGradient existente. |
| `#FFF1D7` | Codigo | L:17 crema de `pastelPalette`; uniforme `u_cream` y `--liquid-cream` | Ancla del efecto/fallback, activa | Reservar al LiquidGradient existente. No reemplazar el fondo global Cream. |
| `#C8B4E5` | Codigo | L:17 lavanda de `pastelPalette`; uniforme `u_lavender` y `--liquid-lavender` | Ancla del efecto/fallback, activa | Reservar al LiquidGradient existente. |

Los tokens globales se consumen fuera de Tailwind mediante `var(--color-...)`;
no hay un `@theme` cromatico personalizado. Navegacion repite Slate, Cream, Pink
y Blue dentro de su propio ambito. Sus declaraciones Pink y Blue no tienen usos
locales actuales; esto se documenta y no se eliminan. Exposiciones tambien repite
Slate y Cream. Cualquier futura centralizacion requiere comparar primero Figma.

## Transparencias y composicion

HEX de ocho digitos: `#RRGGBBAA`. El canal alpha se redondea a 8 bits para el
inventario; el porcentaje o decimal original sigue siendo el valor exacto del
codigo. El HEX no es el color resultante tras componerlo sobre otra superficie.

| HEX normalizado | Valor original | Procedencia y ubicacion | Uso recomendado |
| --- | --- | --- | --- |
| `#5B5E742E` | `rgb(91 94 116 / 18%)` | Codigo, E:4 `--exhibition-line`, separadores y contornos de controles | Mantener lineas sutiles de Exposiciones. |
| `#5B5E7417` | `rgb(91 94 116 / 9%)` | Codigo, E:161 borde de obra | Mantener borde contextual de la superficie de obra. |
| `#5B5E743D` | `rgb(91 94 116 / 24%)` | Codigo, N:194,198,276 bordes de filas y footer | Mantener separadores del menu. |
| `#4C414F08` | `rgb(76 65 79 / 3%)` | Codigo, E:162 sombra de obra | Mantener sombra sutil; no usar su RGB base como nuevo color de marca. |
| `#EDE8E0BF` | `rgb(237 232 224 / 75%)` | Codigo, E:188 stop final del detalle de obra | Mantener velo de lectura sobre la imagen. |
| `#EDE8E04D` | `rgb(237 232 224 / 30%)` | Codigo, H:16 override de `--exhibition-line` | Mantener contornos claros del slider integrado en destacados. |
| `#FFFFFFB3` | `rgba(255,255,255,.7)` | Codigo, M:14 sombra del enlace de scroll | Mantener halo de lectura del scroll; no define una superficie blanca. |
| `#00000000` | `transparent` | Codigo, H:16 stops radiales; N:37,211 tap highlight; E:188,271 velo/control | Ausencia de cobertura. No es un negro de marca. |

`inherit` y `currentColor` heredan el color de contexto y no crean colores HEX
adicionales. `none` en los SVG indica ausencia de relleno. La opacidad animada
modifica la composicion, no la paleta: imagen revelada del slider `.38`, controles
deshabilitados `.35`, flecha del menu `.75`, etiqueta pendiente `.85` y estados
de visibilidad/hover entre `0` y `1`.

## Gradientes y colores derivados

| Superficie/efecto | Procedencia | Configuracion observada | Uso recomendado |
| --- | --- | --- | --- |
| Home, seccion About | Codigo, H:7 | Lineal `180deg`: `#C7E4E8` 0%, `#E2E4E8` 15%, `#EDDCE7` 32%, `#EDE8E0` 55% y 100% | Conservar los stops y su transicion; los tonos intermedios no son tokens oficiales. |
| Home, destacados | Codigo, H:16 | Primera capa radial eliptica en `20% 70%`: `#AB91AA` hasta transparente 50%; segunda en `80% 20%`: `#78A7BC` hasta transparente 55%; base `#5B5E74` | Mantener las dos capas y la base oscura. No reducir la seccion a una paleta pastel. |
| Detalle de una obra | Codigo, E:188 | Lineal: transparente 25%, `#EDE8E0` con alpha 75% a 100% | Conservar como velo, separado del fondo opaco global. |
| Menu hover/focus | Codigo, N:218 | `color-mix(in srgb, #CAB9E5 30%, #EDE8E0)`; resultado RGB calculado `(226.5, 217.9, 225.5)`, aproximado `#E3DAE2` al redondear | Mantener la expresion de mezcla. El HEX calculado es informativo, no un valor escrito ni un token de marca. |
| LiquidGradient fallback | Codigo, F:11 | Lineal `125deg`: rosa `#F7B3D4` 0%, crema `#FFF1D7` 35%, azul `#A1D6E4` 68%, lavanda `#C8B4E5` 100% | Conservar para reduced motion, carga inicial y falta de WebGL. |
| LiquidGradient WebGL | Codigo, L/S | Los cuatro colores de la paleta pasan a `THREE.Color`; shader mezcla rosa/crema y azul/lavanda y combina ambos campos con ruido continuo. RGB lineal convertido a salida sRGB; alpha final 1 | Reservar los tonos generados al efecto. Una captura contiene mezclas dependientes del tiempo, coordenadas y resolucion, no una lista finita de colores oficiales. |

El wordmark y el simbolo son PNG originales en `public/home/`. M:8,10 aplica la
cadena `brightness(0) saturate(100%) invert(37%) sepia(8%) saturate(1279%)
hue-rotate(194deg) brightness(97%) contrast(90%)`. Es un color derivado por filtro
y composicion; no hay un HEX exacto declarado para el resultado. No se modifica
el recurso ni se declara que su color coincide exactamente con Slate.

## Colores de las obras de demostracion

Los siguientes 49 HEX distintos pertenecen al **contenido** de los cinco SVG en
`public/exhibitions/`, usados por Home y Exposiciones mediante `demoArtworks`.
No son pruebas de la identidad cromatica oficial ni propuestas de tokens de UI.
Todos tienen procedencia Codigo. Cada fila mantiene el uso recomendado dentro
de su obra; los stops producen interpolaciones adicionales no enumeradas.

| Obra/archivo | HEX identificado | Tipo y ubicacion dentro del SVG | Uso recomendado |
| --- | --- | --- | --- |
| `corriente-de-cielo.svg` | `#C5DCE1`, `#92B9C8` | Stops 0%/100% de `sky`, lineal diagonal | Contenido: fondo de la obra. |
| `corriente-de-cielo.svg` | `#81A6B7`, `#AECAD2` | Stops 0%/100% de `stream`, lineal horizontal | Contenido: corriente azul. |
| `corriente-de-cielo.svg` | `#D6D5DF` | Relleno de path | Contenido: forma superior. |
| `corriente-de-cielo.svg` | `#EDE7DB` | Relleno de path | Contenido: forma clara. |
| `corriente-de-cielo.svg` | `#E6BCCC` | Relleno de path | Contenido: forma inferior. |
| `corriente-de-cielo.svg` | `#D4E2E2`, `#A2C4CB` | Trazos de paths | Contenido: lineas. |
| `corriente-de-cielo.svg` | `#F0E6D9` | Relleno de circle | Contenido: detalle circular. |
| `la-forma-del-silencio.svg` | `#EEE5D7`, `#DED3BF` | Stops 0%/100% de `cream`, lineal diagonal | Contenido: fondo de la obra. |
| `la-forma-del-silencio.svg` | `#E5C4B8`, `#D8AD9F` | Stops 0%/100% de `peach`, lineal diagonal | Contenido: forma melocoton. |
| `la-forma-del-silencio.svg` | `#AAAEB0` | Relleno de path | Contenido: forma gris. |
| `la-forma-del-silencio.svg` | `#F1E7D8` | Relleno de path | Contenido: forma clara. |
| `la-forma-del-silencio.svg` | `#BFC6BC` | Relleno de path | Contenido: forma inferior. |
| `la-forma-del-silencio.svg` | `#EED4C7` | Trazo de path | Contenido: linea. |
| `la-forma-del-silencio.svg` | `#C4B3C5` | Relleno de ellipse | Contenido: detalle eliptico. |
| `materia-blanda.svg` | `#CDC8DE`, `#B5ADCC` | Stops 0%/100% de `lilac`, lineal vertical | Contenido: fondo de la obra. |
| `materia-blanda.svg` | `#ECC2D0`, `#D993B6` | Stops 0%/100% de `pink`, lineal diagonal | Contenido: forma rosa. |
| `materia-blanda.svg` | `#A4C4CE`, `#81AAB9` | Stops 0%/100% de `blue`, lineal diagonal | Contenido: forma azul. |
| `materia-blanda.svg` | `#F0E6D9`, `#F5EBE1` | Rellenos de paths | Contenido: formas claras. |
| `materia-blanda.svg` | `#F1D4DB` | Trazo de path | Contenido: linea. |
| `materia-blanda.svg` | `#E9DCCC` | Rellenos de circles | Contenido: detalles circulares. |
| `membrana-rosa.svg` | `#F3BDC9`, `#E7A0BE`, `#D58EAE` | Stops 0%/52%/100% de `rose`, lineal diagonal | Contenido: forma rosa. |
| `membrana-rosa.svg` | `#CEC3E4`, `#A8A5CB` | Stops 0%/100% de `lilac`, lineal diagonal | Contenido: forma lavanda. |
| `membrana-rosa.svg` | `#EEE8DF` | Rellenos de path/circle | Contenido: fondo y detalle circular. |
| `membrana-rosa.svg` | `#F7EDE0` | Relleno de path | Contenido: forma clara. |
| `membrana-rosa.svg` | `#F4D2D9` | Trazo de path | Contenido: linea. |
| `membrana-rosa.svg` | `#AEC6CC` | Relleno de circle | Contenido: detalle circular. |
| `umbral-lavanda.svg` | `#D9D0E5`, `#B8AECF` | Stops 0%/100% de `lavender`, lineal vertical | Contenido: fondo de la obra. |
| `umbral-lavanda.svg` | `#9795B9`, `#B1ABCA` | Stops 0%/100% de `arch`, lineal diagonal | Contenido: arco. |
| `umbral-lavanda.svg` | `#F3D6D3`, `#E4AFC2` | Stops 0%/100% de `rose`, radial | Contenido: detalle circular rosa. |
| `umbral-lavanda.svg` | `#E7DFDE` | Relleno de path | Contenido: superficie clara. |
| `umbral-lavanda.svg` | `#C1BAD4`, `#ADA6C4` | Rellenos de paths | Contenido: lados del arco. |
| `umbral-lavanda.svg` | `#AEC7CC` | Relleno de path | Contenido: forma inferior. |
| `umbral-lavanda.svg` | `#F4E8DF` | Trazo de path y relleno de circle | Contenido: linea y detalle circular. |
| `umbral-lavanda.svg` | `#B6ABC7` | Trazo de path | Contenido: linea. |

Cada obra aplica `feTurbulence`, desaturacion, ajuste de alpha y mezcla
`multiply` al grupo visible. El grano genera tonalidades de contenido, sin HEX
finitos declarados: slope alpha `.04` en Corriente, `.045` en Silencio, Materia y
Membrana, y `.05` en Umbral. Estos efectos tampoco se convierten en colores
oficiales. Los SVG y sus filtros se conservan.

## Pendiente de cotejar con Figma

- Clasificacion oficial de colores principales, secundarios y de contraste.
- Superficies, textos, enlaces, botones y estados por seccion, con sus contrastes.
- Stops, opacidades y direccion de los gradientes frente al documento original.
- Diferencias entre los tokens repetidos y las variantes contextuales observadas.
- Valores reales del wordmark/simbolo y sus filtros, sin modificar los originales.
- Jerarquia tipografica, pesos, tamanos, interlineados y espaciados de cada seccion.

No se ha cambiado ningun color ni eliminado ninguna declaracion cromatica durante
esta auditoria o la integracion tipografica. Los metadatos y el estado de las
fuentes se documentan en [la auditoria general](design-system-audit.md) y en
[la auditoria de archivos tipograficos](font-file-audit.md).
Los estilos del repositorio son la referencia temporal autorizada. Confirmar la
fidelidad con el diseno requiere recuperar acceso a Figma o recibir sus estilos
exportados.
