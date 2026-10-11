# Auditoría de dependencias (2026-10-11)

## Estado comprobado localmente

- `npm audit --omit=dev`: **0 vulnerabilidades reportadas**.
- `npm audit`: **5 alertas de severidad alta** en la cadena `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
- Advisory: GHSA-vfj7-8cjw-p6xm (agotamiento de pila mediante patrones anidados).
- `npm run typecheck`, `npm run lint`, `npm run build` y `npm run test:run` correctos (4 tests).

## Decisión

Riesgo residual documentado y pendiente de remediación compatible. Es una cadena de dependencias de desarrollo, pero eso **no implica ausencia total de riesgo**. No usar `npm audit fix --force`: el arreglo sugerido baja `eslint-config-next` a 14.2.35 y rompe la compatibilidad con Next.js 16.

Las dependencias de desarrollo deben quedar excluidas del runtime de producción. Repetir auditorías al actualizar dependencias y antes de desplegar; revisar parches compatibles aguas arriba.
