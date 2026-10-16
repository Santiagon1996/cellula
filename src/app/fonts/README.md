# Tipografías de CÉLULA

La configuración activa está en `fonts.ts` y se importa una sola vez desde el
root layout. Desde el 2026-10-16 se usan **Space Grotesk** y **DM Mono** mediante
`next/font/google`; la compilación ya no depende de los OTF propietarios de
Acid Grotesk o Basis Grotesque Mono.

## Familias y variantes

| Familia activa | Export | Pesos configurados | Estilos | Variable CSS conservada |
| --- | --- | --- | --- | --- |
| Space Grotesk | `spaceGrotesk` | 400, 500, 700 | normal | `--font-acid` |
| DM Mono | `dmMono` | 400, 500 | normal, italic | `--font-basis-mono` |

Space Grotesk cubre el texto proporcional, los titulares y la navegación.
DM Mono cubre etiquetas, fechas, numeraciones, controles y footer. Cada familia
usa una sola instancia de `next/font/google`, con `display: 'swap'`,
`preload: false` y el subconjunto `latin`. Las cursivas de DM Mono son variantes
reales.

Los nombres de las variables se conservan por compatibilidad con los estilos
existentes; ahora apuntan a las familias de esta tabla. El layout aplica ambas
variables al elemento `html`. Tailwind v4 mantiene los alias globales en
`globals.css`:

```css
@theme inline {
  --font-sans: var(--font-acid);
  --font-mono: var(--font-basis-mono);
}
```

Así, las referencias existentes a estas variables y las utilidades `font-sans`
y `font-mono` reciben las familias nuevas sin cambiar los selectores de las
secciones. Se conservan tamaños, interlineados, tracking, colores y composición.
Las familias tienen métricas distintas de las anteriores, por lo que los saltos
de línea y la ocupación del texto requieren revisión visual.

Space Grotesk conserva la pila de fallback Arial/Helvetica/sans-serif.
DM Mono conserva ui-monospace/SFMono-Regular/Consolas/monospace y
`adjustFontFallback: false` para evitar un fallback proporcional automático.

## Compilación y alojamiento

`next/font/google` descarga el CSS y los archivos de las fuentes durante la
compilación y los incorpora como recursos estáticos de Next.js. El entorno de
build necesita acceso de red a Google Fonts para obtenerlos. La aplicación
desplegada sirve las fuentes desde su propio dominio; el navegador no necesita
consultar Google Fonts para cargarlas.

No se debe añadir un enlace remoto de Google Fonts al layout ni duplicar las
declaraciones `@font-face`. Este comportamiento se documenta en la
[referencia oficial de `next/font`](https://nextjs.org/docs/app/api-reference/components/font).

Un checkout limpio no necesita copiar los OTF originales para ejecutar el build.
Los comandos de validación siguen siendo los definidos en `package.json`.

## Licencias

Space Grotesk y DM Mono se publican bajo **SIL Open Font License 1.1**. Sus
licencias permiten usar, incrustar y redistribuir las fuentes conforme a sus
condiciones, incluyendo conservar los avisos de copyright y la licencia en las
copias distribuidas. La licencia de las fuentes no cambia la del sitio.
Las fuentes primarias son los archivos de licencia del repositorio Google Fonts:

- [Space Grotesk — OFL.txt](https://github.com/google/fonts/blob/main/ofl/spacegrotesk/OFL.txt).
- [DM Mono — OFL.txt](https://github.com/google/fonts/blob/main/ofl/dmmono/OFL.txt).

## Originales propietarios e historial

Los OTF locales de Acid Grotesk y Basis Grotesque Mono permanecen excluidos por
el `.gitignore` de este directorio. No se cargan, no se distribuyen con esta
configuración y no son necesarios para compilar. La autorización previa de uso
y alojamiento web no confirmó permiso de redistribución en Git.

La [auditoría de archivos originales](../../../docs/font-file-audit.md) y la
[auditoría del sistema visual](../../../docs/design-system-audit.md) se conservan
como registros históricos de la integración anterior. Sus rutas, inventarios y
resultados tipográficos no describen la configuración activa.

## Validación de la migración (2026-10-16)

- `npm run typecheck` y `npm run lint`: correctos.
- `npm run test -- --run --maxWorkers=2`: 21 archivos, 184 pruebas correctas.
- `npm run build`: correcto con Next.js 16.4.0 y acceso a Google Fonts.
- Navegador: las siete combinaciones de peso/estilo configuradas cargan sus
  fuentes reales. Los WOFF2 se sirven desde el propio origen, sin peticiones a
  Google en ejecución.
- Comparación antes/después a 320, 390, 768 y 1440 px: sin desbordamientos
  horizontales en las páginas ni en los titulares revisados. Se usó movimiento
  reducido para medir el texto en reposo, sin modificar las animaciones.

No fue necesario ajustar tamaños, espaciados ni reglas de composición. Los
titulares fragmentados de About y Contacto, el menú y `DESTACADO / DEL MES`
conservan sus saltos. Las diferencias naturales de métricas incluyen:

| Ancho | Texto | Líneas antes → después |
| --- | --- | --- |
| 320 px | Dar forma a una idea. | 1 → 2 |
| 320 px | Procesos abiertos. / Ideas en movimiento. | 2 → 3 |
| 768 px | Una pausa para mirar. | 1 → 2 |

También pueden cambiar los puntos de corte de los párrafos. El wordmark gráfico
y el símbolo de Home conservan sus imágenes originales; la marca textual
`Cél·ula` de `/exposiciones` hereda Space Grotesk como el resto del texto sans.
