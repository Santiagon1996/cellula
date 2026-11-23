# CÈL·LULA

Sitio web para CÈL·LULA, laboratorio cultural de experimentación artística,
producción, curaduría y comunidad en Barcelona.

## Estado actual

Landing de una sola página en `/`, con navegación por anclas y mejoras
progresivas de movimiento. Estado revisado el 23 de noviembre de 2026;
la integración local no implica que los cambios estén publicados.

| Estado | Funcionalidad |
| --- | --- |
| Implementado y montado | Hero con identidad original y LiquidGradient; menú fullscreen; introducción y AboutIdentity; portada Featured y CardSwap; rueda 3D Laboratory y detalle fullscreen; footer. |
| Implementado pero pospuesto | Contact completo; AboutEcosystem, AboutFinale y AboutMaterial; conjunto WarpText; ExhibitionPage y ExhibitionSlider. |
| Planificado | Activación de las secciones pendientes, ruta independiente de exposiciones si se aprueba y persistencia cuando exista un caso de uso real. |

No existe una ruta activa `/exposiciones`. CONTACTO y QUÉ HACEMOS aparecen como
pendientes, sin enlaces ficticios. No hay formularios, API ni base de datos.

## Stack actual

- Next.js 16.4.5 App Router, React 19.3.0 y TypeScript.
- Tailwind CSS v4, CSS global por feature y CSS Modules.
- GSAP, ScrollTrigger y Flip; Three.js para LiquidGradient.
- CardSwap adaptado de React Bits y Hugeicons dentro de su motor.
- OGL conservado para WarpText, actualmente sin montaje en la landing.
- Vitest 5, React Testing Library y JSDOM.

Las versiones reproducibles están en `package-lock.json`. No se utilizan Zod,
Prisma ni PostgreSQL en el runtime actual.

## Arquitectura y recorrido

`src/app/page.tsx` monta `HomeLanding`, que compone las secciones existentes:

| Tramo | Ancla | Implementación |
| --- | --- | --- |
| Home | `inicio` | HomeAtmosphere, HomeIdentity y LiquidGradient. |
| Qué es CÈL·LULA | `que-es-celula` | AboutIntro y AboutIdentity; fondo coordinado con ContinuousBackground. |
| Exposiciones | `exposiciones` | ExhibitionFeatured seguido de CardSwap manual. |
| Laboratory | `laboratorio` | Una única LaboratoryImageWheel y su detalle fullscreen. |

`#laboratorios` está obsoleto. `#laboratorio` identifica Laboratory, aunque
históricamente identificaba About. No se añadieron alias ni redirecciones.

```text
src/app/          Rutas, layout, metadatos, estilos base y fuentes locales
src/features/    home, about, exhibitions, laboratory y contact
src/shared/      Configuración, utilidades y componentes visuales compartidos
src/tests/       Setup y pruebas transversales o de composición futura
public/          Assets preparados para su servicio público
docs/            Arquitectura, testing y registros históricos
scripts/         Herramientas manuales de generación y QA
```

Los componentes servidor componen la página; los componentes cliente gestionan
interacción, foco y animación. Consulta la [arquitectura](docs/architecture.md),
[Exhibition](src/features/exhibitions/README.md),
[Laboratory](src/features/laboratory/README.md) y
[Contact pospuesto](src/features/contact/README.md).

## Desarrollo local

La verificación local utiliza Node.js 22. Con Node y npm compatibles instalados:

```text
npm ci
npm run dev
```

Abrir `http://localhost:3000`. Para revisar producción local:

```text
npm run build
npm run start
```

No ejecutar desarrollo y producción simultáneamente sobre el mismo `.next`.
Mantener secretos fuera de Git; la landing estática no necesita datos de
contacto ficticios ni una base de datos para ejecutarse.

## Scripts y validación

| Comando | Finalidad |
| --- | --- |
| `npm run dev` | Servidor de desarrollo Next.js. |
| `npm run build` | Build de producción; genera `.next` y puede actualizar `next-env.d.ts`. |
| `npm run start` | Servidor del build existente. |
| `npm run typecheck` | TypeScript sin emisión; puede actualizar su caché incremental. |
| `npm run lint` | ESLint sin corrección automática. |
| `npm test` | Vitest en modo interactivo. |
| `npm run test:run -- --cache=false` | Suite principal. |
| `npm run test:run:second-phase` | Cuatro suites de composición futura conservadas. |

El último baseline validado es de 296 tests en 37 archivos de la suite principal.
La segunda fase puede fallar mientras sus secciones sigan pospuestas;
no sustituye la suite principal. Véase [testing](docs/testing.md).

Las herramientas manuales que escriben posters o informes tienen requisitos y
limitaciones distintos: [scripts](docs/scripts.md). No forman parte del build.

## Diseño

[Figma — CEL-LULA WEB (copia)](https://www.figma.com/design/V3UGthHJsw1LG4rQKLLrO2/CEL-LULA-WEB--Copia-?node-id=0-1)

## Exhibition y recursos

Featured utiliza Halo como referencia editorial provisional y revela la
fotografía mediante capas nítida/desenfocada. Después continúa CardSwap, sin
autoplay. Los datos demo y la rueda Laboratory no representan una programación
definitiva. Los derechos de publicación de Halo siguen pendientes de confirmar.

Los assets activos mantienen sus rutas. Los ZIP y materiales maestros se
archivan fuera de `public` y fuera de la aplicación; no deben publicarse ni
añadirse al repositorio. Consulta el [inventario y la política de assets](docs/assets.md).

## Tipografías

Acid Grotesk y Basis Grotesque Mono Pro se integran con `next/font/local` y se
sirven desde el despliegue. Los siete OTF utilizados están en `src/app/fonts/`;
la compilación de estas familias no requiere descargas externas. Los iconos
del menú usan Material Symbols mediante una hoja de Google Fonts y sí dependen
de su disponibilidad durante la navegación. Consulta la
[configuración de fuentes](src/app/fonts/README.md).

La integración de marca, el copy aprobado, las comprobaciones y las capturas
están documentados en el [informe histórico de validación](docs/brand-identity-validation.md).

## Publicación

Vercel es el destino previsto. Esta documentación no acredita un despliegue
vigente ni autoriza publicar. Revisar contenido provisional, derechos de imagen,
dependencias y QA antes de cualquier push o despliegue autorizado.
