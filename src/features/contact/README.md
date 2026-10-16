# Contacto — activar una conexión

Sección integrada después de Laboratory, antes del footer de la landing. El menú
existente llega a `#contacto`; el footer conserva su destino `#nosotros`. No hay
IDs duplicados ni una segunda sección provisional de contacto.

## Base de trabajo

- Rama: `feature/contact`, ya existente al comenzar esta implementación.
- Origen: `main`, commit `88d093625c5194e4524eb64020598fb47f613e29`.
- Este commit contiene Home, Navigation, Exhibition, Laboratory, About y la
  corrección del espacio vertical móvil. Se validó en la tarea anterior con lint,
  TypeScript y 98 pruebas.
- No se han realizado nuevos merges, commits ni push para esta implementación.

## Composición e interacción

Titular Space Grotesk revelado por grupos de palabras, sobre Slate. Una ventana
Cream presenta CONVERSEMOS, COLABOREMOS y CONECTEMOS. Las formas geométricas Pink
y Blue son decoración propia de esta sección; no sustituyen al símbolo original.
El cierre editorial continúa hacia el footer existente.

En móvil, la ilustración precede al texto. Desde 900 px, ocupa una columna lateral
y la tipografía crece. El módulo usa una cuadrícula con los tres paneles en la
misma celda: los paneles inactivos mantienen su espacio y evitan cambios de altura.
El contenido admite más líneas y zoom sin imponer una altura fija.

Los cambios son explícitos, sin autoplay. Flechas izquierda/derecha y Home/End
seleccionan y enfocan las pestañas, con recorrido circular; Tab entra al panel
activo. Los paneles inactivos tienen `aria-hidden` e `inert`. La selección y el
foco utilizan Cream sobre Slate para mantener contraste; Pink queda en detalles
decorativos.

`useContactMotion` separa las entradas de scroll, la transición de paneles y el
movimiento del gráfico. Reutiliza una timeline de aproximadamente 0,78 s. Una
nueva selección completa la anterior antes de iniciar el destino más reciente.
Los estilos transitorios vuelven a CSS al finalizar o cancelar.

Con movimiento reducido, el contenido aparece directamente y las pestañas siguen
funcionando. El cursor solo desplaza el gráfico en dispositivos con
`(hover: hover) and (pointer: fine)`; ignora eventos táctiles y limita su recorrido
a 8 px por eje. No hay animación decorativa continua ni scroll fijado.

## Contenido y canales

Todos los textos editoriales, los tres estados y los datos de contacto están en
`data/contact-content.ts`. Por indicación del usuario, `contactChannels.email`
permanece en `null` y `contactChannels.socials` en `[]`. La interfaz muestra un
aviso editorial de próxima apertura, sin enlaces falsos ni controles deshabilitados
que parezcan acciones disponibles.

Al incorporar datos oficiales confirmados:

- Los dos primeros paneles muestran una acción `mailto:`. Colaboración incluye
  un asunto codificado.
- El tercer panel muestra los canales HTTPS configurados, con nombre accesible,
  aviso de nueva pestaña y `rel="noopener noreferrer"`.
- `getContactActions` descarta formatos inválidos, controles, esquemas inseguros,
  URLs con credenciales, destinos locales y dominios reservados de ejemplo.
  Esta validación de formato no certifica la titularidad de un perfil.

No se añadieron formularios, rutas API, backend, WebGL ni dependencias.

## Archivos de la feature

- `components/contact-section.tsx`: estado seleccionado y composición.
- `components/contact-intro.tsx`: encabezado y narrativa.
- `components/contact-stage.tsx`: ventana, gráfico y paneles superpuestos.
- `components/contact-panel.tsx`: contenido y acciones disponibles.
- `components/contact-navigation.tsx`: pestañas, teclado y foco.
- `components/contact-footer.tsx`: cierre editorial.
- `hooks/use-contact-motion.ts`: GSAP, ScrollTrigger y ciclo de vida.
- `data/contact-content.ts`: textos, canales y generación de acciones.
- `types.ts`: contratos de contenido, canales y acciones.
- `styles/contact.module.css`: layout responsive, paleta y estados visuales.
- `index.ts`: export público de `ContactSection`.
- `data/contact-content.test.ts`: datos y validación de acciones.
- `components/contact-section.test.tsx`: paneles, teclado, SSR y canales.
- `components/contact-integration.test.tsx`: landing, menú y footer.
- `hooks/use-contact-motion.test.tsx`: transiciones con GSAP real y límite de
  scroll simulado; movimiento reducido, selecciones rápidas y limpieza.

Fuera de Contact se modifica `home-landing.tsx` para la integración. La prueba de
integración de About incorpora un mock local de la nueva animación de Contact:
mantiene su alcance en About y no requiere `matchMedia` real de navegador en jsdom.

## Verificación

Comprobaciones realizadas:

- `npm run typecheck`: correcto.
- `npm run lint`: correcto.
- `npm run test:run`: 20 archivos y 152 pruebas correctas, incluidas 54 nuevas.
  La pasada final utilizó `npm.cmd run test:run -- --maxWorkers=2` para evitar
  tiempos de espera por contención de CPU en Windows. No se ampliaron los tiempos
  de espera de pruebas ajenas.
- `npm run build`: correcto; `/`, `/_not-found` y `/exposiciones` se generan
  estáticamente.
- Chrome real: 320, 375, 390, 430, 768, 1024 y 1440 px; además, movimiento
  reducido en 390 y 1440 px. Se comprobaron menú, ancla y foco en Contacto,
  selección táctil y con ratón, teclado, cambios rápidos, paneles inactivos en
  el árbol de accesibilidad y continuidad del footer.
- La altura del escenario se mantuvo estable durante las transiciones
  muestreadas. La comprobación final de los tres estados en los nueve escenarios
  no encontró desbordamiento horizontal ni texto cortado por la máscara.
- Se corrigió el recorte de «CONVERSACIÓN» a 320 px y el contraste de la selección,
  el énfasis final y el foco sobre Slate. Se revisaron capturas reales de móvil
  y escritorio. No se encontraron excepciones ni errores de recursos de la
  aplicación en la navegación probada.

Los scripts y las capturas se guardan fuera del repositorio, en `../verification/`:
`check-contact.mjs`, `check-contact-final-layout.mjs`, `contact-<ancho>.json`,
`contact-final-layout.json` y `contact-final-390.png` / `contact-final-1440.png`.
Usan el protocolo nativo de Chrome sin instalar paquetes.

### Comportamiento previo detectado

Al cambiar en caliente de movimiento reducido a normal, la landing vuelve al
principio de la página. Se aisló el contexto de animación de Contacto mediante
React y se retiró de GSAP en una pestaña de diagnóstico: el salto de `scrollY`
6974 a 0 ocurrió tanto con Contacto activo como con su contexto completamente
retirado. La funcionalidad de los paneles se conserva en ambos modos. El informe
está en `../verification/contact-scroll-diagnosis.json`; no se modificaron los
efectos globales de otras features para resolver este comportamiento previo.

La consulta de la referencia Figma quedó bloqueada por el límite de llamadas MCP
del plan Starter. Se usaron los tokens y fuentes existentes y el comportamiento
descrito en el brief. No se afirma una comparación visual con Figma ni con un
vídeo de referencia que no estaba adjunto.

Mensaje de commit propuesto:

`feat(contact): implement interactive mobile-first contact section`
