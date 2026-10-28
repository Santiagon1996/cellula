# CÈL·LULA

Sitio web para CÈL·LULA, laboratorio cultural de experimentación creativa en Barcelona.

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

Acid Grotesk y Basis Grotesque Mono Pro se integran con `next/font/local` y se
sirven desde el despliegue. Los siete OTF utilizados están en `src/app/fonts/`;
la compilación no depende de Google Fonts ni de archivos externos. Consulta la
[configuración de fuentes](src/app/fonts/README.md).

La integración de marca, el copy aprobado, las comprobaciones y las capturas
están documentados en el [informe de validación](docs/brand-identity-validation.md).
