# Tipografías oficiales de CÈL·LULA

La configuración activa está en `fonts.ts` y se importa una sola vez desde el
root layout. **Acid Grotesk** y **Basis Grotesque Mono Pro**, las familias del
brandbook, se cargan mediante `next/font/local` con los OTF originales
autorizados por el usuario para uso y alojamiento web.

## Familias y variantes

| Familia | Export | Pesos | Estilos | Variable CSS |
| --- | --- | --- | --- | --- |
| Acid Grotesk | `acidGrotesk` | 400, 500, 700 | normal | `--font-acid` |
| Basis Grotesque Mono Pro | `basisGrotesqueMono` | 400, 500 | normal, italic | `--font-basis-mono` |

Se conservan las siete combinaciones de peso y estilo de la configuración
anterior. Cada archivo se declara con su peso OpenType real; no se asignan
pesos 600 u 800 ni rangos variables a estos archivos estáticos. Las dos
cursivas Basis son variantes reales, con ángulo de −11°.

Acid cubre el texto proporcional, los titulares y la navegación. Basis cubre
etiquetas, fechas, numeraciones, controles y footer. Cada familia usa una sola
instancia de `next/font/local`, con `display: 'swap'` y `preload: false`.

Las variables se aplican al elemento `html`. Los alias existentes de Tailwind
en `globals.css` siguen conectados a ellas:

```css
@theme inline {
  --font-sans: var(--font-acid);
  --font-mono: var(--font-basis-mono);
}
```

Los estilos que usan esas variables y las utilidades `font-sans` y `font-mono`
reciben las fuentes oficiales sin cambiar sus selectores. Acid usa un fallback
Arial ajustado por Next.js y la pila Arial/Helvetica/sans-serif. Basis conserva
ui-monospace/SFMono-Regular/Consolas/monospace con `adjustFontFallback: false`
para mantener un fallback monoespaciado.

## Archivos incluidos

| Ruta relativa a este directorio | Peso y estilo | Bytes originales |
| --- | --- | ---: |
| `acid-grotesk/acid-grotesk-regular.otf` | 400 normal | 125012 |
| `acid-grotesk/acid-grotesk-medium.otf` | 500 normal | 50275 |
| `acid-grotesk/acid-grotesk-bold.otf` | 700 normal | 51447 |
| `basis-grotesque-mono/Basis Grotesque Mono Pro Regular.otf` | 400 normal | 61888 |
| `basis-grotesque-mono/Basis Grotesque Mono Pro Regular Italic.otf` | 400 italic | 64628 |
| `basis-grotesque-mono/Basis Grotesque Mono Pro Medium.otf` | 500 normal | 62048 |
| `basis-grotesque-mono/Basis Grotesque Mono Pro Medium Italic.otf` | 500 italic | 64608 |

El `.gitignore` de este directorio permite incluir explícitamente estos siete
OTF y mantiene excluidos los demás archivos tipográficos. Las copias conservan
los bytes originales de `C:/Users/Usuario/Downloads/celulaFonts/`; no se han
convertido, modificado ni renombrado. Un checkout debe incluir esos siete
archivos para compilar sin depender de una carpeta externa.

### Elección de Acid Regular 400

`acid-grotesk-normal.otf` y `acid-grotesk-regular.otf` tienen peso 400, pero son
variantes distintas: 189 de sus 262 caracteres compartidos tienen avances
diferentes. Se carga únicamente **Regular**, identificada en la página 28 de
`CEL-LULA_Brandbook.pdf` como `AcidGrotesk-Regular`.

El subset embebido del PDF contiene el separador `|`: su avance de 201/1000 em
y su bounding box global `(-44, -309, 2028, 923)` coinciden con Regular. Normal
tiene avance 189/1000 em y bounding box `(-50, -306, 2016, 920)`. Esta evidencia
actualiza la selección técnica de Normal que figura en la
[auditoría histórica de originales](../../../docs/font-file-audit.md).

## Compilación y comprobación

Next.js incorpora los OTF como recursos estáticos y los sirve desde el dominio
de la aplicación. La compilación de estas fuentes no necesita Google Fonts ni
acceso a los originales de Downloads. No se añaden enlaces remotos ni
declaraciones `@font-face` manuales.

La integración cambia las métricas respecto a Space Grotesk y DM Mono. La
validación de la entrega debe comprobar la carga de las siete variantes, los
saltos de línea, la ausencia de desbordamientos y el comportamiento responsive,
además de los comandos definidos en `package.json`. Este documento describe
la configuración; los resultados de esas comprobaciones se registran en la
[validación de la entrega](../../../docs/brand-identity-validation.md).
