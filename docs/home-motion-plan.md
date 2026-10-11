# Home: plan de animación de CÉLULA

## Referencias visuales
- Figma: `V3UGthHJsw1LG4rQKLLrO2`, hero `1:42`, menú `1:84`, wordmark `1:50`.
- Paleta de identidad: slate `#5B5E74`, crema `#EDE8E0`, rosa `#FF66CC`, azul `#72A1B2`.
- La captura de Figma mezcla imagen de mano y degradados; hace falta recibir la **mano aislada** (idealmente PNG con fondo transparente) y el **wordmark original** antes de incorporarlos en el sitio. No extraer la mano de una captura ni sustituirla por otra imagen.

## Capas
1. Fondo pastel: rosa, crema, celeste y lavanda.
2. Mano original fija, tinta/tono uniforme y opacidad ajustable (pendiente de recurso).
3. Velos animados semitransparentes por delante, que revelan/ocultan la mano sin animarla directamente.
4. Wordmark original siempre visible por encima de la composición (pendiente de recurso); representación tipográfica provisional.
5. Menú con los 6 rótulos de Figma y fondo pastel; mano **no** visible en menú.

## Interacción y accesibilidad
- Movimiento muy lento (24–31 s), continuo y sin cortes evidentes; `prefers-reduced-motion: reduce` desactiva el movimiento.
- Menú accesible por teclado y botón con `aria-expanded`; enlaces permanecen inaccesibles al cerrar.
- La mano debe seguir siendo decorativa, sin información crucial oculta por animación.

## Validación manual pendiente
- Abrir `feature/home` en mobile (390–402 px) y desktop (1440 px).
- Ver la animación durante al menos un ciclo completo; comparar distribución y saturación con Figma.
- Probar apertura/cierre del menú y enlaces.
- Una vez exportados los recursos: verificar archivos locales, encuadre, proporción, `mix-blend-mode` y contraste del wordmark.
- Ejecutar `npm run test:run && npm run typecheck && npm run lint && npm run build` antes del PR.

## Segunda iteración — mano aislada y transición (2026-10-11)

- Los degradados de Home se generan íntegramente mediante CSS en `home-motion.css`; no se utiliza una fotografía como fondo.
- Mano aislada a partir del arte aportado por la clienta: `/public/home/hand-isolated.png` (PNG transparente). La separación automática conserva un borde suave; comprobar calidad visual y refinar si fuera necesario.
- La mano se mantiene estática; tres velos CSS se animan delante de ella con distinta posición/opacidad, generando aparición y desaparición.
- El wordmark y símbolo originales son PNG independientes, superpuestos por encima del resto; ScrollTrigger mueve/reduce el primero y revela el segundo a lo largo del primer ~82% de la altura de viewport.
- Pendiente de validación local, test y build tras la actualización.
- El recurso `hand-isolated.png` se entrega como ZIP para su extracción local: **no está versionado en GitHub hasta que se confirme el push del usuario**.
