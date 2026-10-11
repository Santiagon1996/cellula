# Referencia arquitectónica: dev-portafolio

Repositorio de referencia: https://github.com/Santiagon1996/dev-portafolio (rama main, revisado 2026-10-11).

## Patrones observados

- Separación entre `src/core` (dominio y puertos), `src/application`, `src/infrastructure`, `src/features`, `src/shared` y `src/app`.
- Principio de dependencias hacia el dominio, sin acoplar entidades a Next.js, React o Prisma.
- Prisma/PostgreSQL y Docker para persistencia, especialmente administración y sesiones.
- Tests unitarios y componentes reutilizables.

## Adaptación a CÉLULA

- Mantener `src/features/<sección>` y `src/shared` como estructura principal de la landing.
- Introducir `core/domain`, `application` e `infrastructure` **solo cuando aparezcan casos de uso reales** (gestionar exposiciones, obras, artistas, reservas, panel de administración).
- Empezar con datos tipados estáticos y componentes Server por defecto; usar Client Components para interacción y animaciones GSAP.
- Mantener Vitest y React Testing Library (sin migrar a Jest).
- Conservar Next.js 16 y Tailwind 4. No copiar dependencias ajenas a las necesidades de CÉLULA.
- Priorizar diseño responsive, accesibilidad, rendimiento y soporte de `prefers-reduced-motion`.

## Criterio

Reutilizar principios, convenciones y soluciones probadas, no copiar carpetas vacías o servicios innecesarios.
