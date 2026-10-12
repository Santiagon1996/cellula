# Fuentes oficiales de CELULA

Configuracion activa en `fonts.ts`, importada una sola vez por el root layout.
Los originales proceden de `C:/Users/Usuario/Downloads/celulaFonts/`.
Se copiaron diez OTF sin modificar sus bytes; los hashes de destino coinciden con
los originales. No se encontraron TTF, WOFF o WOFF2 en la carpeta proporcionada.

La autorizacion de uso web y alojamiento de ambas familias fue confirmada por
el usuario el 2026-10-12. Los binarios permanecen excluidos de Git mediante el
`.gitignore` local: esta confirmacion no se extiende a redistribucion en Git.
El usuario autorizo posteriormente confirmar la configuracion en
`test/integration`; los binarios siguen fuera del commit. No se realiza push.

## Preparacion de un checkout limpio

Antes de ejecutar desarrollo, tests o build en otra maquina, incorporar por una
via privada autorizada los diez originales de la tabla siguiente bajo
`src/app/fonts/`, respetando los subdirectorios y nombres exactos. En este equipo
ya estan presentes y sus hashes se documentan en la auditoria de archivos.

`next/font/local` necesita los archivos durante la compilacion: los fallbacks
resuelven fallos de carga en navegador, no archivos ausentes en el checkout.
Un clon sin provisionar los OTF no puede compilar. No hay descarga automatica,
conversion ni sustitucion silenciosa; CI tambien necesita provisionar estos
recursos autorizados antes de `npm run build`.

## Archivos seleccionados

| Subdirectorio | Archivo original | Peso real | Estilo real |
| --- | --- | --- | --- |
| `acid-grotesk/` | `acid-grotesk-thin.otf` | 100 | normal |
| `acid-grotesk/` | `acid-grotesk-extralight.otf` | 200 | normal |
| `acid-grotesk/` | `acid-grotesk-light.otf` | 300 | normal |
| `acid-grotesk/` | `acid-grotesk-normal.otf` | 400 | normal |
| `acid-grotesk/` | `acid-grotesk-medium.otf` | 500 | normal |
| `acid-grotesk/` | `acid-grotesk-bold.otf` | 700 | normal |
| `basis-grotesque-mono/` | `Basis Grotesque Mono Pro Regular.otf` | 400 | normal |
| `basis-grotesque-mono/` | `Basis Grotesque Mono Pro Regular Italic.otf` | 400 | italic |
| `basis-grotesque-mono/` | `Basis Grotesque Mono Pro Medium.otf` | 500 | normal |
| `basis-grotesque-mono/` | `Basis Grotesque Mono Pro Medium Italic.otf` | 500 | italic |

`acid-grotesk-regular.otf` tambien declara 400 normal, pero no es un duplicado:
257 contornos y 189 anchos difieren al comparar los caracteres comunes.
Se selecciono Normal por su coherencia de build con Thin, ExtraLight, Light,
Medium y Bold. Regular permanece en la carpeta original y no se carga como otra
cara 400. No se renombraron archivos para simular pesos.

Inventario completo de los once originales, metadatos, hashes y metodo de
comparacion: [auditoria de archivos](../../../docs/font-file-audit.md).

## Configuracion global

Una instancia `next/font/local` por familia declara `--font-acid` y
`--font-basis-mono`. Ambas usan `display: 'swap'`, pesos y estilos explicitos.
`preload: false` evita precargar diez variantes en todas las rutas; el navegador
solicita las caras utilizadas. La politica de precarga se podra ajustar con
mediciones posteriores.

Acid conserva el ajuste automatico de fallback Arial de Next y la pila
Arial/Helvetica/sans-serif. Basis usa una pila monoespaciada
ui-monospace/SFMono-Regular/Consolas/monospace, con `adjustFontFallback: false`
para no insertar un fallback proporcional Arial en los metadatos y controles.

`layout.tsx` aplica ambas clases de variables al elemento `html`. No hay cargas
individuales en componentes ni declaraciones manuales duplicadas de `@font-face`.

Tailwind v4 utiliza los alias compartidos en `globals.css`:

```css
@theme inline {
  --font-sans: var(--font-acid);
  --font-mono: var(--font-basis-mono);
}
```

La opcion inline resuelve las utilidades contra las variables de las familias.
Referencia: [variables de tema de Tailwind](https://tailwindcss.com/docs/theme#referencing-other-variables).

## Jerarquia y utilidades reutilizables

| Rol | Familia | Peso / estilo | Configuracion |
| --- | --- | --- | --- |
| H1 / H2 | Acid Grotesk | 700 normal | Capa base global |
| H3 / H4 | Acid Grotesk | 500 normal | Capa base global |
| Parrafo descriptivo | Acid Grotesk | 400 normal | Herencia global |
| Navegacion principal | Acid Grotesk | 500 normal | `font-medium`; provisional hasta cotejar Figma |
| Boton MENU / CERRAR | Basis Mono | 500 normal | `font-mono font-medium` |
| Etiquetas, fechas y numeraciones | Basis Mono | 400 normal | `font-mono font-normal` |
| Footer | Basis Mono | 400 normal | `font-mono font-normal` |
| Italicas secundarias | Basis Mono | 400 / 500 italic | `font-mono italic` y peso correspondiente |

Los tamanos, interlineados, tracking, colores y disposicion siguen en las hojas
de sus secciones, con los valores preexistentes. Se eliminaron las familias
genericas y los pesos 600/800 que impedian aplicar la jerarquia oficial.

Acid no incluye un archivo italic entre los originales proporcionados. El
`em` del titular de Exposiciones conserva su semantica, pero usa el Bold normal
real en lugar de sintetizar una cursiva. Esta decision y el peso del menu quedan
documentados para cotejo con Figma cuando sea accesible.

El wordmark y simbolo permanecen como imagenes originales. No se cambiaron la
logica de GSAP, ScrollTrigger, Three.js, el slider ni las transiciones del menu.

## Validacion y pendientes

La carga de las diez caras, los fallbacks y las comprobaciones de desktop, tablet
y movil se registran en [la auditoria general](../../../docs/design-system-audit.md).
La referencia de Figma sigue pendiente: el conector rechazo contexto y captura
por el limite de llamadas del plan Starter y el enlace tampoco pudo leerse por web.

No faltan variantes necesarias del sistema solicitado. No hay WOFF2 originales
autorizados en la carpeta entregada; se usan los OTF sin conversion. Si se entregan
WOFF2 originales mas adelante, se verificaran sus metadatos y licencia antes de
sustituir rutas. La redistribucion de archivos tipograficos en Git no esta
confirmada y los binarios siguen ignorados.
