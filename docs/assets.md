# Recursos públicos y originales

Inventario revisado el 23 de noviembre de 2026. Tamaños en bytes.
Clases: A, activo; B, futuro; C, original/procedencia; D, residual; E, incierto.
La ausencia de un import estático no basta para retirar un asset: revisar datos,
CSS, scripts, tests y funcionalidades pospuestas.

## Recursos conservados en public

Las rutas siguientes son relativas a `public/` y mantienen sus nombres.

| Ruta | Tipo | Bytes | Consumidor y finalidad | Clase / decisión |
| --- | --- | ---: | --- | --- |
| `home/celula-wordmark.png` | PNG | 13.070 | HomeIdentity y máscara CSS del wordmark original. | A; conservar. |
| `home/celula-symbol.png` | PNG | 19.089 | HomeIdentity y máscara CSS del símbolo. | A; conservar. |
| `home/liquid-initial-landscape.webp` | WebP | 28.262 | LiquidGradient mediante su metadata; fallback horizontal. | A; conservar. |
| `home/liquid-initial-portrait.webp` | WebP | 20.892 | LiquidGradient mediante su metadata; fallback vertical. | A; conservar. |
| `home/liquid-initial.json` | JSON | 708 | Manifiesto del generador y trazabilidad de posters. | C; conservar con el conjunto. |
| `home/README.md` | Markdown | 1.128 | Documentación de identidad y regeneración de posters. | C; conservar. |
| `exhibitions/halo/Halo_05-1200x800.jpg` | JPEG | 410.952 | `featured-exhibition.ts`; foto provisional de Featured, 1200 × 800. | A; conservar; derechos pendientes. |
| `exhibitions/halo/Halo_05-blurred.webp` | WebP | 2.436 | `featured-exhibition.ts`; capa blur preprocesada. | A; conservar. |
| `exhibitions/membrana-rosa.svg` | SVG | 1.771 | Datos demo de Exhibition y Laboratory; también pruebas de AboutMaterial. | A/B; conservar. |
| `exhibitions/corriente-de-cielo.svg` | SVG | 1.722 | Datos demo de Exhibition y Laboratory; también pruebas de AboutMaterial. | A/B; conservar. |
| `exhibitions/materia-blanda.svg` | SVG | 1.981 | Datos demo de Exhibition y Laboratory. | A; conservar. |
| `exhibitions/umbral-lavanda.svg` | SVG | 1.790 | Datos demo de Exhibition, también disponibles para la galería futura. | A/B; conservar. |
| `exhibitions/la-forma-del-silencio.svg` | SVG | 1.727 | Datos demo de Exhibition, también disponibles para la galería futura. | A/B; conservar. |

No se identificaron recursos D cuya retirada fuera necesaria. Las fotografías
maestras no se recomprimen en esta fase. La marca y los posters no se sustituyen.

## Fuentes

Las siete caras activas están en `src/app/fonts/`, declaradas por `fonts.ts` con
`next/font/local`: Acid Regular, Medium y Bold; Basis Regular y Medium, normales
y cursivas. No se cambian archivos, pesos, métricas ni loaders.

Se conservan además cuatro originales Acid locales ignorados: Thin (51.939),
Extra Light (46.167), Light (51.503) y Normal (51.479 bytes). Son clase C, no
recursos cargados en producción. Véanse [configuración de fuentes](../src/app/fonts/README.md)
y [auditoría histórica](font-file-audit.md). Los iconos Material Symbols del menú
tienen una dependencia externa distinta de estas familias locales.

## ZIP original protegido

`IMÁGENES-20261115T114532Z-1-001.zip` es clase C, no un recurso de ejecución.
Se retiró de `public/` después de copiarlo y verificar integridad:

- Tamaño: 13.704.126 bytes.
- SHA-256: `ccba1ea03ea7332edcb5357a4fedb1d481fd438e502d3105278c199148e60709`.
- Archivo persistente local: `../source-materials/originals/images/`, fuera de
  este repositorio y de los directorios servidos por Next.js.
- Procedencia y comprobación: `archive-provenance.json`, junto al ZIP archivado.
- La foto Halo extraída y activa coincide por hash con su original en el ZIP.

El ZIP estaba ignorado mediante `.git/info/exclude`; no se añadió a Git.
Su traslado local no se representa como un movimiento versionado. No se borró
definitivamente ni se dejó otra copia pública.

Para otros materiales, usar un archivo persistente fuera de la aplicación,
comprobar permisos, copiar sin sobrescribir y comparar SHA-256 antes de retirar
la copia pública. Mantener una copia de seguridad independiente del archivo local.
No usar carpetas temporales como archivo definitivo. Un checkout nuevo debe
funcionar con los assets activos versionados, sin necesitar ZIP ni maestros.
