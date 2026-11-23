# Arquitectura de CÉLULA

## Composición vigente

`app/layout.tsx` aporta metadatos, fuentes locales y estilos base.
`app/page.tsx` monta `HomeLanding`, un compositor servidor que conserva este orden:

```text
HomeNavigation + HomeIdentity + ContinuousBackground
main#inicio
  Hero -> HomeAtmosphere -> LiquidGradient -> Three.js diferido
  AboutSection#que-es-celula -> AboutIntro + AboutIdentity
  Exhibition#exposiciones -> ExhibitionFeatured + ExhibitionCardSwap -> CardSwap
  LaboratorySection#laboratorio -> LaboratoryImageWheel + LaboratoryDetail
  Footer
```

La única página de producto es `/`. `/_not-found` pertenece al framework.
No hay ruta `/exposiciones` ni rutas experimentales activas. `contacto` y
`que-hacemos` están reservados, sin nodos vacíos ni enlaces activos.

| Feature | Entrada, contratos y dependencias |
| --- | --- |
| Home | `home-landing.tsx` compone las features. La navegación y su hook poseen foco, bloqueo modal y animación. |
| About | `index.ts` exporta AboutSection y tipos; datos y CSS local compartidos entre composición actual y desarrollos pospuestos. |
| Exhibition | Barrel para CardSwap, Slider y tipo de obra. Featured se importa directamente; su dato centraliza la fotografía reemplazable. |
| Laboratory | Barrel de sección y tipos; vistas derivadas de los proyectos; rueda controlada; una selección y un detalle. La geometría de rueda reutiliza matemáticas circulares. |
| Contact | Barrel de ContactSection; implementación, datos, estilos y tests conservados sin montaje. |
| Shared | Configuración del sitio, `cn`, ArrowIcon, LiquidGradient y ContinuousBackground. No importa features. |

Home es el punto de composición entre features. Las pruebas transversales pueden
importar la landing; no son dependencias de producción. La revisión de Cleanup 04
no detectó ciclos en los imports locales estáticos ni dinámicos literales.

## Código conservado para fases posteriores

- AboutEcosystem, AboutFinale, AboutMaterial, WarpText y sus hooks, pruebas,
  estilos, licencias y procedencia.
- Contact completo; canales aún sin datos oficiales.
- ExhibitionPage, ExhibitionSlider, metadata y CSS de la futura galería.

No montado no significa residual. No se eliminan exports de estas capacidades.
Los hooks próximos a componentes se mantienen por cohesión; CardSwap y WarpText
conservan los nombres registrados en su procedencia. No existe motivo técnico
para moverlos o introducir más capas en esta landing.

## Principios

- Next.js App Router: rutas, layouts, metadatos y composición en `src/app`.
- `src/features/<feature>`: componentes y lógica específicos de cada sección.
- `src/shared/ui`: componentes visuales reutilizables sin lógica de negocio.
- `src/shared/lib`: funciones puras y utilidades.
- `src/shared/config`: configuración estática del sitio.
- Los hooks de animación GSAP se mantienen junto a los componentes de cada feature.
- Importaciones absolutas mediante el alias `@/*`.
- Server Components por defecto; `use client` solo donde haya interacción o APIs del navegador.

## Flujo de ramas

1. `main`: configuración estable y features integradas.
2. Cada intervención nace del `main` local validado, sin perder integraciones locales pendientes de publicar.
3. Features y mantenimiento permanecen separados en ramas de alcance definido.
4. Validar TypeScript, ESLint, suite principal, build y los escenarios de navegador afectados antes de integrar.
5. Commit, merge local y publicación son pasos distintos; la integración local no acredita un despliegue.

## Persistencia

No introducir una base de datos en el runtime de la landing hasta definir una necesidad real (gestión de exposiciones, artistas, reservas o contenido). Prisma y PostgreSQL se configurarán en la fase de infraestructura, con variables de entorno no versionadas.

## Diseño

La implementación sigue Figma, pero se construirá con layout responsive y no copiando posiciones absolutas del diseño móvil. Se respetará `prefers-reduced-motion`.

Para los recursos y herramientas de mantenimiento, consultar
[assets](assets.md), [scripts](scripts.md) y [testing](testing.md).
