# Suites de pruebas

La suite de primera entrega se ejecuta con `npm run test:run`. Incluye los
tests de componentes activos y excluye las pruebas de composición de About
completo y la integración de Contact en Home, que están pospuestas.

Las pruebas conservadas para esa composición futura se ejecutan con
`npm run test:run:second-phase`. Esta suite puede fallar mientras About
Ecosystem, About Finale y Contact sigan fuera de Home; los tests unitarios de
esos componentes continúan en la suite principal.

Ambas configuraciones limitan Vitest a dos workers para reducir la contención
observada al ejecutar en paralelo los archivos con JSDOM.
