# About — una identidad en transformación

Desarrollo local en `feature/about`, desde
`9b031ce9d579ce39ef362a6af7fc23d81628eefc` de `test/integration`.
Sin dependencias adicionales, commits ni merges automáticos.

## Composición

`AboutSection` sustituye el bloque editorial anterior de `HomeLanding`, después
del hero y antes de Exposiciones. Conserva `#laboratorio` y `home-about-title`.
LAB mantiene `#laboratorios`; `#nosotros` continúa en el footer. Se retiraron
únicamente las reglas `.home-about` que pertenecían al bloque sustituido.

- `AboutIntro`: pregunta semántica completa, fragmentos visuales y declaración.
- `AboutEcosystem` / `AboutEcosystemNode`: selección Crear / Explorar / Conectar,
  botones nativos y un panel editorial estable.
- `AboutFinale`: convergencia de tres formas y enlace real a `#exposiciones`.
- `useAboutScroll`: timelines independientes de descomposición, revelación y
  convergencia; scroll reversible sin pin, bloqueo de scroll ni estado por frame.
- `useEcosystemMotion`: una timeline reutilizable para selección y conexiones;
  el cursor mueve un hijo decorativo separado del transform del botón.
- `data/about-content.ts` / `types.ts`: contenido provisional y contrato tipado.
- `styles/about.module.css`: composición mobile first, sin estilos filtrados a
  otras features, con Acid Grotesk y Basis Mono globales.

## Accesibilidad y movimiento

Los textos fragmentados conservan una versión semántica completa; sus copias
visuales tienen `aria-hidden`. Los conceptos usan `aria-pressed` y
`aria-controls`, Tab y activación nativa con Enter/Espacio. Toda selección
actualiza el contenido de inmediato y mantiene la identidad y altura mínima
del panel, sin scroll programático ni anuncios automáticos repetidos.

La experiencia base y el HTML inicial incluyen los tres actos y el concepto
Crear. Sin animaciones, el contenido permanece legible. `prefers-reduced-motion`
desactiva las coreografías de scroll y la respuesta al cursor; las selecciones
son inmediatas. Los cambios de preferencia y breakpoints revierten los recursos
de cada contexto. `useGSAP` / `gsap.matchMedia` limpian timelines, triggers y
listeners también en Strict Mode. No se eliminan triggers de otras features.

Se utilizan transforms, opacidad y SVG ligero. No se añade WebGL, filtros de
blur ni renderizado de React durante el scroll. Las mediciones geométricas se
limitan a inicialización, refresh, cambios de selección y eventos del cursor.
No se afirma un rendimiento de 60 FPS sin mediciones.

## Contenido y diseño

El copy adicional es provisional y se identifica en pantalla como
`COPY PENDIENTE DE APROBACIÓN`. No se atribuyen servicios, colaboradores ni
afirmaciones institucionales definitivas a CÉLULA.

Se reutilizan los cuatro tokens de color y los colores de la transición del
Home anterior. Las etiquetas sobre formas pink/blue usan un fondo cream para
mantener contraste slate/cream. El wordmark y el símbolo originales permanecen
en HomeIdentity; las formas abstractas de About no sustituyen esos assets.

La referencia de Figma no pudo consultarse por el límite del plan conectado.
El resultado interpreta el brief y el sistema confirmado en código; no afirma
fidelidad a composiciones de Figma que no pudieron inspeccionarse.

## Validación

Los tests cubren contenido, selección, nombres accesibles, destinos únicos,
composición de Home, HTML inicial, movimiento reducido, cambios de preferencia,
Strict Mode y limpieza. El hook del ecosistema se comprueba con GSAP real,
incluyendo selecciones repetidas y ausencia de acumulación de tweens.

Comandos del proyecto:

```text
npm run typecheck
npm run lint
npm.cmd run test:run -- --maxWorkers=1 --pool=threads
npm run build
```

En PowerShell se usa `npm.cmd` para que los argumentos de Vitest se transmitan
correctamente. No se modifican los timeouts de las pruebas.

Resultados de la revisión del 13 de octubre de 2026:

| Comprobación | Resultado |
| --- | --- |
| TypeScript | Aprobado. |
| ESLint | Aprobado, sin errores ni advertencias. |
| Suite completa | 16 archivos, 98 pruebas aprobadas. |
| Hooks tras los ajustes visuales finales | 2 archivos, 10 pruebas aprobadas. |
| Build de producción | Aprobado; `/`, `/_not-found`, `/exposiciones`. |
| Chrome: matriz responsive y movimiento reducido | 10 escenarios aprobados, sin errores de ejecución, consola ni recursos. |
| Navegación, CTA y Exposiciones | Aprobado; el carrusel de obras se verifica también con activación nativa por Enter. |
| Laboratory en escritorio | Apertura, Escape, foco y desbloqueo del scroll aprobados. |

La verificación de navegador usa Chrome headless con CDP, inputs táctiles y de
teclado reales, capturas e informes JSON. El script de trabajo está fuera del
repositorio en [check-about.mjs](../../../../verification/check-about.mjs).
La matriz incluye 320, 375, 390, 430, 768, 1024 y 1440 px, horizontal 844 × 390
y movimiento reducido en móvil y escritorio. No sustituye pruebas en
dispositivos físicos o en todos los motores de navegador.

El resumen de todos los escenarios está en
[about-summary.json](../../../../verification/about-summary.json), junto con
`about-*.json` y las capturas `about-*.png` del workspace. Las capturas con
sufijo `failure` son diagnósticos de iteraciones anteriores; los informes
finales identifican los escenarios aprobados.
