# Arquitectura de CÉLULA

## Principios

- Next.js App Router: rutas, layouts, metadatos y composición en `src/app`.
- `src/features/<feature>`: componentes y lógica específicos de cada sección.
- `src/shared/ui`: componentes visuales reutilizables sin lógica de negocio.
- `src/shared/lib`: funciones puras y utilidades.
- `src/shared/config`: configuración estática del sitio.
- `src/shared/motion`: abstracciones compartidas de animación (GSAP).
- Importaciones absolutas mediante el alias `@/*`.
- Server Components por defecto; `use client` solo donde haya interacción o APIs del navegador.

## Flujo de ramas

1. `main`: configuración estable y features integradas.
2. `chore/nextjs-foundation`: configuración inicial hasta superar comprobaciones.
3. `feature/home`, `feature/laboratory`, `feature/exhibitions`, etc.: cada rama nace de `main`.
4. Pull requests con `npm run lint`, `npm run typecheck`, `npm run build` y tests cuando estén disponibles.

## Persistencia

No introducir una base de datos en el runtime de la landing hasta definir una necesidad real (gestión de exposiciones, artistas, reservas o contenido). Prisma y PostgreSQL se configurarán en la fase de infraestructura, con variables de entorno no versionadas.

## Diseño

La implementación sigue Figma, pero se construirá con layout responsive y no copiando posiciones absolutas del diseño móvil. Se respetará `prefers-reduced-motion`.
