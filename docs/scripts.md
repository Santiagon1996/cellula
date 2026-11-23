# Herramientas manuales de recursos y QA

Estas herramientas no forman parte de `npm run build`. Leer sus efectos antes
de ejecutarlas; no son comandos de limpieza ni autorizan regenerar assets.
Los ejemplos se ejecutan desde la raíz del repositorio con Node.js 22 o superior.

## generate-liquid-poster.mjs

Captura el shader real de Three.js en tiempo cero. Requiere un Chrome local
dedicado con CDP accesible; no instala un paquete de navegador ni descarga imágenes.

```text
node scripts/generate-liquid-poster.mjs --cdp-url http://127.0.0.1:9226 --port 3201
```

`--cdp-url` señala el Chrome ya iniciado. `--port` es el servidor HTTP temporal
del generador, no el servidor Next.js. El script cierra su servidor y la pestaña
que crea; no administra todo el navegador externo.

Escribe como conjunto:

- `public/home/liquid-initial-landscape.webp`.
- `public/home/liquid-initial-portrait.webp`.
- `public/home/liquid-initial.json`.
- `src/shared/ui/liquid-gradient/liquid-gradient-poster.ts`.

Lee los shaders y la paleta existente de `globals.css`. No regenerar solo una
parte, ni ejecutarlo como paso rutinario de validación. Revisar los cuatro diffs
y la correspondencia entre poster y renderer cuando exista autorización para regenerar.

## check-exhibition-card-swap.mjs

Herramienta histórica de navegador/CDP para CardSwap, con drag, teclado,
responsive, SSR, idle y capturas. Requiere un servidor de producción y un Chrome
dedicado ya accesible por CDP; administra únicamente las pestañas que crea.

Variables disponibles:

| Variable | Predeterminado | Finalidad |
| --- | --- | --- |
| `CARD_SWAP_ORIGIN` | `http://127.0.0.1:3142` | Servidor que se comprueba. |
| `CDP_PORT` | `9238` | Puerto del Chrome externo. |
| `CARD_SWAP_OUTPUT` | Carpeta externa `../verification/` | Destino de capturas PNG e informes JSON. |

Ejemplos históricos:

```text
node scripts/check-exhibition-card-swap.mjs
node scripts/check-exhibition-card-swap.mjs --gestures-only
node scripts/check-exhibition-card-swap.mjs --home --gestures-only
```

**No utilizar actualmente como puerta de aceptación de la landing.** Aunque
`--home` dirige las comprobaciones iniciales a `/#exposiciones`, al finalizar
el script sigue visitando `/exposiciones` y exige el Slider antiguo. Esa ruta
ya no existe. El modo completo también presupone el preview de CardSwap.
Por tanto, incluso el modo Home conserva una comprobación incompatible; no se
presentan estos ejemplos como comandos que deban pasar en la versión actual.

Por defecto genera `report.json`, `report-gestures.json` o `report-home.json`
y capturas en `../verification/exhibition-card-swap-feature/` o
`../verification/exhibition-card-swap-home/`, según el modo. No dirigir su salida
a `public/` ni añadirla a Git.

Conservar el script como trazabilidad y posible herramienta futura. Adaptar su
comprobación final requiere otra intervención; no crear una ruta o reactivar el
Slider para hacer pasar el QA. Para validación vigente, utilizar los comandos
del [README](../README.md), los tests reales de navegación y un recorrido de
navegador sobre la landing actual.
