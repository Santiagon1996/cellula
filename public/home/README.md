# Recursos visuales de CÈL·LULA

Los recursos originales usados por Home se mantienen en esta carpeta:

- `celula-wordmark.png`: logotipo tipográfico.
- `celula-symbol.png`: símbolo reducido.

Los archivos son aportados por la clienta y se mantienen sin modificar. Home utiliza estos dos recursos desde `/home/` para la identidad animada con GSAP.

El fondo se genera con `LiquidGradient`, Three.js y un fragment shader GLSL.

Los archivos `liquid-initial-portrait.webp`, `liquid-initial-landscape.webp` y
`liquid-initial.json`, junto con `liquid-gradient-poster.ts`, se generan como un
conjunto desde el shader real a tiempo cero. La paleta se lee de los tokens de
`globals.css`: Pink, Blue, Cream y Green. El cuarto uniform conserva su nombre
histórico `u_lavender` para mantener el contrato del renderer.

Con un Chrome local conectado por CDP, regenerar desde la raíz del repositorio:

```text
node scripts/generate-liquid-poster.mjs --cdp-url http://127.0.0.1:9235
```

El componente utiliza la paleta del póster generado; el build no necesita
ejecutar Chrome. No cambiar las imágenes o el manifiesto por separado.
