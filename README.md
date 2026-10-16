# CÉLULA

Sitio web para CÉLULA, espacio creativo y de exposición de arte.

## Objetivo

Landing One Page con navegación por anclas, degradados animados, interacciones sobre exposiciones, slider horizontal controlado por scroll y transiciones verticales con capas.

## Stack previsto

Next.js (App Router), React, TypeScript, Tailwind CSS, GSAP/ScrollTrigger, Zod. PostgreSQL y Prisma se incorporarán cuando existan necesidades de persistencia. Despliegue previsto en Vercel.

## Diseño

[Figma — CEL-LULA WEB (copia)](https://www.figma.com/design/V3UGthHJsw1LG4rQKLLrO2/CEL-LULA-WEB--Copia-?node-id=0-1)

## Estado

Aplicación Next.js implementada. Los comandos disponibles de desarrollo y
validación están en `package.json`.

## Tipografías

Space Grotesk y DM Mono se integran con `next/font/google`: se descargan durante
el build y se sirven desde el despliegue. No hacen falta los OTF propietarios
locales. Consulta la [configuración y licencias](src/app/fonts/README.md).
