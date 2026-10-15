# CELULA: auditoria de archivos tipograficos originales

Fecha: 2026-10-12. Origen autorizado por el usuario:
`C:/Users/Usuario/Downloads/celulaFonts/`.

## Metodo y autorizacion

Se leyeron los once originales mediante `System.Windows.Media.GlyphTypeface`
de PresentationCore y el parser fontkit incluido en Next.js, sin instalar nuevas
dependencias. Se comprobaron nombres internos, pesos OpenType, estilos, tablas,
versiones, cobertura, metricas y hashes SHA-256. La comparacion de contornos
Normal/Regular usa Windows; la lectura de contornos CFF con la copia compilada
de fontkit fallo internamente, aunque sus metadatos y coverage se pudieron leer.

El usuario confirmo el 2026-10-12 que ambas familias tienen permiso para uso y
alojamiento web, y autorizo leer y copiar estos originales al proyecto. Se
registra esa confirmacion como base de uso; no se infiere el permiso a partir
del nombre de archivo ni de los bits de embedding. No se presupone autorizacion
para redistribuirlos en Git. Los OTF siguen excluidos por `.gitignore` y no se
realizan commit ni push.

## Inventario real

Todos los archivos son **OpenType con contornos CFF**, firma `OTTO`, extension
OTF. El nombre interno `TTF` expuesto por fontkit identifica su lector SFNT, no
contornos TrueType: las tablas originales contienen `CFF ` y no `glyf`.
No se entregaron versiones WOFF2, WOFF o TTF; no se convirtieron estos originales.

Las familias tipograficas preferidas de Windows son Acid Grotesk y Basis
Grotesque Mono Pro. Fontkit tambien expone nombres heredados separados, como
Acid Grotesk Light o Basis Grotesque Mono Pro Medium; no son familias adicionales
que deban cargarse con otros loaders.

| Archivo original | Bytes | Variante real | Peso | Estilo | Glifos | Cmap Windows | Seleccion CSS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `acid-grotesk-thin.otf` | 51939 | Thin | 100 | normal | 508 | 262 | 100 normal |
| `acid-grotesk-extralight.otf` | 46167 | Extra Light | 200 | normal | 508 | 262 | 200 normal |
| `acid-grotesk-light.otf` | 51503 | Light | 300 | normal | 508 | 262 | 300 normal |
| `acid-grotesk-normal.otf` | 51479 | Normal | 400 | normal | 508 | 262 | 400 normal; version seleccionada |
| `acid-grotesk-regular.otf` | 125012 | Regular | 400 | normal | 508 | 262 | Alternativa real, excluida del loader |
| `acid-grotesk-medium.otf` | 50275 | Medium | 500 | normal | 508 | 262 | 500 normal |
| `acid-grotesk-bold.otf` | 51447 | Bold | 700 | normal | 508 | 262 | 700 normal |
| `Basis Grotesque Mono Pro Regular.otf` | 61888 | Regular | 400 | normal | 730 | 631 | 400 normal |
| `Basis Grotesque Mono Pro Regular Italic.otf` | 64628 | Regular Italic | 400 | italic | 730 | 631 | 400 italic |
| `Basis Grotesque Mono Pro Medium.otf` | 62048 | Medium | 500 | normal | 730 | 631 | 500 normal |
| `Basis Grotesque Mono Pro Medium Italic.otf` | 64608 | Medium Italic | 500 | italic | 730 | 631 | 500 italic |

La asignacion de pesos viene de `OS/2.usWeightClass`, confirmada tambien por
Windows. Ningun original es 600 u 800. No se asignan esos pesos a archivos 500
o 700, ni se carga el mismo 400 normal dos veces.

## Normal y Regular de Acid

Ambos archivos son Acid, 400 normal, 508 glifos y la misma cobertura Unicode,
pero **no son archivos ni contornos equivalentes**. Sus hashes son diferentes,
los nombres PostScript son `AcidGrotesk-Normal` / `AcidGrotesk-Regular`, y sus
tablas/numeracion interna tambien difieren.

Para evitar confundir indices reordenados con diferencias visuales, se comparo
el glifo de cada uno de los 262 caracteres del cmap Windows por su codigo
Unicode. El resultado fue 257 contornos diferentes y 189 anchos de avance
diferentes. La comparacion usa `GetGlyphOutline` a escala 1000 y serializacion
invariante; no asegura diferencia optica en cada contorno serializado, pero los
anchos distintos prueban que no son intercambiables sin alterar metricas.

Ejemplos de ancho en unidades de em: `(` Normal `.293` / Regular `.302`; `%`
Normal `.887` / Regular `.896`; `&` Normal `.659` / Regular `.666`.
Los bounding boxes globales son Normal `(-50, -306, 2016, 920)` y Regular
`(-44, -309, 2028, 923)` en unidades de fuente.

Se selecciona **Normal** para el unico 400 normal de Acid: comparte cadena de
compilacion y conjunto de tablas con Thin, ExtraLight, Light, Medium y Bold.
Esos seis archivos incluyen `DSIG`; Regular usa `FFTM` y una cadena de version
mas corta. Esto es un criterio tecnico de consistencia con el juego entregado,
no una afirmacion de que Figma use necesariamente esa variante. Se conserva el
nombre original; Regular queda documentado como alternativa sin declaracion
`@font-face` duplicada. El cotejo de esa eleccion con Figma sigue pendiente.

## Versiones y derechos declarados

| Grupo | Version del archivo | Copyright | Embedding | Informacion de licencia interna |
| --- | --- | --- | --- | --- |
| Acid Thin, ExtraLight, Light, Normal, Medium y Bold | `Version 1.000;hotconv 1.0.109;makeotfexe 2.5.65596` | Copyright (C) 2019 by Folch Studio. All rights reserved. | Editable | Descripcion y URL de licencia ausentes. |
| Acid Regular | `Version 1.000` | Copyright (C) 2019 by Folch Studio. All rights reserved. | Editable | Descripcion y URL de licencia ausentes. |
| Las cuatro Basis | `Version 2.003 \| wf-rip DC20190315` | Copyright (c) 2015 by Colophon Foundry. All rights reserved. | Installable | Descripcion remite al acuerdo actualizado en `http://www.colophon-foundry.org`; campo URL separado vacio. |

Las cadenas se registran tal como vienen en los originales, con copyright
transcrito a ASCII. Los metadatos de embedding se conservan como informacion
tecnica y no sustituyen la autorizacion de uso web confirmada por el usuario.

## Cobertura y metricas

- Acid comparte cobertura de 262 caracteres Windows / 263 entradas fontkit;
  Basis comparte 631 / 632. Fontkit incluye la entrada final U+FFFF que Windows
  no expone en su `CharacterToGlyphMap`; las cifras provienen de lectores distintos.
- Se comprobaron los caracteres de `CELULA` con E acentuada, vocales acentuadas,
  enye, u con dieresis, signos de apertura espanoles y los diez digitos en todos
  los archivos. Cada archivo tambien cubre U+2190, U+2191, U+2192, U+2193 y U+2197,
  usados por flechas de navegacion y enlaces.
- Todas las Acid usan 1000 unidades/em, ascent 1000, descent -200 y lineGap 0.
  Todas las Basis usan 1000 unidades/em, ascent 782, descent -218 y lineGap 0.
- Los digitos de Basis Regular tienen avance uniforme 602/1000 em. No aparece
  feature `tnum` entre sus tags; el ancho monoespaciado ya aporta la uniformidad.
  Se conserva `font-variant-numeric: tabular-nums` en el contador.
- Los hashes SHA-256 de la cobertura fontkit ordenada son Acid
  `59badbe356ba6529cac129e8fdd47acc61cf4e99f6fdccfb85a8b44a34f1740a` y Basis
  `30ad5626d44c26c9f7c470d616e4eabc41ffd2f8ca87b18559c1ef72daf18196`.

## Integridad de originales

Hashes SHA-256 de los once archivos de origen; todos son distintos:

| Archivo | SHA-256 |
| --- | --- |
| `acid-grotesk-thin.otf` | `4B46420C36FD3B3D6F6E1E9195FFDD6642B5758E8897770AD253D05C5C6CB1E6` |
| `acid-grotesk-extralight.otf` | `EB09419AB5ADC6E851635172DEABF49F79BF846C2C0D57EA318D5CC7AD2D7EAB` |
| `acid-grotesk-light.otf` | `5269D8771F3E570CDF76A12923A06B1D69AEE0ECD10B635C2BE22D814CEE2483` |
| `acid-grotesk-normal.otf` | `467E90F27A62272960C277E7B4998FEB4401C4EFC0F9B4BFF7AFB8BF18E22152` |
| `acid-grotesk-regular.otf` | `BC5ADDDE49B465690E5FD6D175B9BDB5ED02B38C9D624CA4E6EF62C98DD2B906` |
| `acid-grotesk-medium.otf` | `BCF5F3A00CCA653C3B57B4D3AB8DFB063E8E4453D060A8E6EF0C19E69376A483` |
| `acid-grotesk-bold.otf` | `2A344CA5A3F415E70C9609F0531D434BF75A55EB06C0FEB6C0AB85A61CD9B199` |
| `Basis Grotesque Mono Pro Regular.otf` | `F8B7D741FC2358E780D8F16034889D14CF7F11FE6CECE5A968212A019B00BBF1` |
| `Basis Grotesque Mono Pro Regular Italic.otf` | `EDE9816D9F9C52A3FE29CB009568EF61B3B882DC9E657159391DCE18BF6C4931` |
| `Basis Grotesque Mono Pro Medium.otf` | `8B2F9AE13DC026DFA9099A1E37D08EF41C96003659F65045D26F5B34F3E0F138` |
| `Basis Grotesque Mono Pro Medium Italic.otf` | `D56D5D27A6B87238EC97975DEAA9E39584442784567D6E8AE13E4FD41B36E213` |

Las copias de uso deben conservar estos bytes. Su carga por navegador,
fallbacks, hidratacion y responsive se verifican en la entrega tecnica, por
separado de esta auditoria estatica. Consulte
[design-system-audit.md](./design-system-audit.md) y
[README de fuentes](../src/app/fonts/README.md).
