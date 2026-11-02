---
name: react-clean-architecture
description: Diseña, implementa, refactoriza y revisa aplicaciones frontend React con Clean Architecture, separación por funcionalidades, casos de uso, contratos de repositorios, adaptadores Axios, estado global con Zustand, estado remoto con TanStack Query y pruebas. Actívala al crear módulos, componentes conectados a datos, formularios, integraciones API o al auditar dependencias en React/TypeScript.
---

# Skill: Clean Architecture para React

## Objetivo
Aplicar Clean Architecture **de manera pragmática** en proyectos React existentes o nuevos, preservando la lógica de negocio independiente de React, librerías HTTP, almacenamiento y frameworks visuales. Evitar sobreingeniería: las capas deben aportar una separación útil y comprobable, no ser solo carpetas.

## Cuándo usar esta skill
- Crear o modificar módulos frontend con reglas de negocio, consultas o mutaciones.
- Conectar React con REST/GraphQL, reemplazar proveedores de datos o agregar caché.
- Refactorizar componentes que mezclan UI, acceso HTTP y reglas de negocio.
- Diseñar módulos de microfrontends o revisar cumplimiento arquitectónico.
- Escribir pruebas de dominio, casos de uso e integración de UI.

## Procedimiento obligatorio del agente

1. **Inspeccionar primero el repositorio**: framework y versión, TypeScript/JavaScript, bundler, convenciones, rutas, gestión de estado, cliente HTTP, librerías de formularios, pruebas, alias, reglas ESLint y funcionalidades existentes. Verificar versiones de React, TypeScript, Zustand, Axios y @tanstack/react-query; si faltan, proponer/instalar según las instrucciones del proyecto, sin inventar versiones ni romper dependencias.
2. **Identificar el caso de uso**: actores, acciones, reglas de negocio, datos entrantes/salientes, estados UI, errores y contratos reales del backend. No inventar endpoints ni propiedades; cuando no existan, señalar claramente el supuesto o crear un adaptador configurable.
3. **Elegir complejidad mínima**: para una vista estática, mantener componentes simples. Para CRUD trivial, permitir una capa de aplicación ligera. Para reglas complejas, aplicar separación completa. No agregar interfaces, clases, DTOs o carpetas vacías sin justificación. Este stack (Zustand + Axios + TanStack Query) es la opción por defecto solicitada por el usuario.
4. **Organizar por feature** cuando hay varios módulos: `features/<feature>/{domain,application,infrastructure,presentation}`. Compartir únicamente lo verdaderamente transversal, evitando un directorio `shared` como depósito indiscriminado.
5. **Definir el dominio primero**: entidades/value objects, invariantes y contratos de acceso cuando corresponda. Las reglas autoritativas de seguridad y negocio deben validarse además en el backend.
6. **Implementar casos de uso**: recibir puertos por constructor o argumentos; no importar React, Axios, Fetch, navegador, router ni una implementación concreta del repositorio.
7. **Crear adaptadores de infraestructura con Axios**: implementar puertos; encapsular HTTP y persistencia; comprobar respuestas, manejar cancelación si aplica, mapear/validar DTOs y normalizar errores sin exponer secretos.
8. **Conectar con composición de dependencias**: instanciar adaptadores y casos de uso desde `app/composition` o proveedor apropiado. Evitar instanciarlos de nuevo en cada render.
9. **Construir presentación**: páginas, componentes, hooks y adaptadores de UI; usar TanStack Query para consultas/mutaciones/cache/estados remotos y Zustand para estado cliente compartido; controlar loading, empty, error, success, accesibilidad y formularios. Mantener lógica del dominio fuera de JSX.
10. **Probar y verificar**: ejecutar tests/lint/typecheck/build disponibles; no afirmar ejecución si no se realizó. Validar dirección de imports y cubrir reglas de negocio y flujos críticos.
11. **Entregar un resumen**: archivos creados/cambiados, motivos de diseño, supuestos del contrato API, validaciones realizadas, riesgos o tareas pendientes.

## Regla principal de dependencias

- `domain` no importa `application`, `infrastructure`, `presentation`, React, browser APIs, HTTP ni librerías de UI.
- `application` puede importar `domain`; **no** debe importar una clase concreta de `infrastructure` ni componentes/hook React.
- `infrastructure` puede importar contratos y entidades de `domain` y tipos internos necesarios de `application` cuando estén justificados.
- `presentation` utiliza casos de uso o un facade de aplicación; no hace llamadas directas a endpoints para las funcionalidades gobernadas por esta skill.
- `app/composition` es la excepción intencional que conoce las implementaciones concretas y las conecta con los casos de uso y la UI.
- **Flujo de ejecución ≠ dirección de dependencias**: el caso de uso invoca el puerto que en ejecución resuelve un adaptador HTTP, aunque el código de aplicación no importe ese adaptador.
- Evitar dependencias circulares, imports entre internals de features sin contrato público, y tipos DTO del backend dentro del dominio.

## Responsabilidad por capa

| Capa | Contiene | No contiene |
|---|---|---|
| Domain | Entidades, tipos de negocio, invariantes, value objects y puertos de dominio | Hooks React, Fetch/Axios, DTO HTTP, componentes |
| Application | Casos de uso, orquestación, puertos de entrada/salida cuando corresponda | JSX, gestión de botones, cliente HTTP concreto |
| Infrastructure | Adaptadores REST/GraphQL, mappers, DTOs, validación de respuestas, almacenamiento | Reglas centrales del negocio, componentes |
| Presentation | Páginas, componentes, hooks, TanStack Query, Zustand, formularios y estados de UI | URL hardcodeadas, reglas críticas escondidas en JSX |
| App/composition | Wiring de repositorios, casos de uso, routers/providers globales | Nuevas reglas del negocio |

## Estructura orientativa

```text
src/
  app/
    composition/
      patients.ts
    router.tsx
  features/
    patients/
      domain/
        Patient.ts
        PatientRepository.ts
      application/
        listPatients.ts
      infrastructure/
        PatientHttpRepository.ts
        patientDto.ts
      presentation/
        hooks/usePatients.ts
        pages/PatientsPage.tsx
      index.ts
  shared/
    http/axiosClient.ts
    ui/
```

No imponer esta estructura si el proyecto tiene una convención consistente mejor establecida. Preferir nombres coherentes con el idioma existente.

## Reglas prácticas de React

- Los hooks (`useState`, `useEffect`, `useMemo`, `useQuery`, `useMutation`) viven en presentación o adaptadores específicos de UI, nunca en dominio/aplicación.
- **TanStack Query es obligatorio para server state**: consultas, mutaciones, caché, invalidación y estados remotos; `queryFn` y `mutationFn` llaman a casos de uso. Pasar `signal` en consultas cuando aplique. No duplicar colecciones remotas en Zustand.
- **Zustand es obligatorio para estado global cliente cuando exista**: filtros, selección, preferencias visuales, sidebar y wizard; crear stores pequeños por ámbito, con selectores, evitando un store universal. Estado local trivial permanece en `useState`.
- **Axios es obligatorio como adaptador HTTP REST**: instancia configurable, baseURL por entorno, timeouts, `signal`, interceptores limitados a temas transversales, normalización de errores y mapeo de DTO. No importar Axios en Domain, Application o componentes.
- TanStack Query, Zustand y Axios deben permanecer en capas externas: React hooks/stores en Presentation, Axios en Infrastructure, configuración/proveedores en App.
- Validación de formulario para UX pertenece a presentación; invariantes del negocio al dominio; validación autoritativa al servidor.
- Mapeo DTO → modelo de dominio en infraestructura, evitando `as` sin verificar cuando la fuente es externa. Considerar Zod si ya existe o es proporcional al problema.
- Estados de carga, error, vacío, reintentos y cancelación se tratan explícitamente según las herramientas existentes.
- Evitar `new Repository()` dentro del render; resolver instancias estables en composición o provider.
- No almacenar tokens sensibles en el código fuente; seguir la estrategia de autenticación y seguridad existente. No asumir que localStorage es una solución segura para tokens.
- Para SSR, no acceder a `window`, `document` o `localStorage` durante evaluación del módulo o render en servidor.

## Reglas para implementar funcionalidades

Para cada feature con datos y reglas:
1. Definir contratos observables y errores de negocio.
2. Crear tipos o entidades que expresen las reglas reales (no modelos anémicos artificiales por obligación).
3. Definir un puerto con las operaciones que necesita el caso de uso, no una interfaz genérica gigante.
4. Implementar un caso de uso enfocado, con dependencias explícitas.
5. Implementar el adaptador HTTP separado y su mapper.
6. Componer dependencias una sola vez, o con un ciclo de vida deliberado.
7. Conectar el hook React y componentes.
8. Probar el caso de uso con fake repo; probar adaptador y estados UI según criticidad.

Para features sencillas sin lógica de negocio, justificar explícitamente la simplificación en lugar de fabricar capas redundantes.

## Criterios de aceptación (checklist)

- [ ] Cada dependencia importada respeta la dirección de Clean Architecture.
- [ ] Domain y Application se pueden probar sin renderizar React ni llamar a APIs reales.
- [ ] La URL, el cliente HTTP y los DTOs están aislados de Application/Domain.
- [ ] Los contratos expresan necesidades reales; el caso de uso no construye repositorios concretos.
- [ ] La UI maneja carga, vacío, éxito y errores apropiadamente.
- [ ] La respuesta externa se verifica o mapea antes de tratarse como entidad confiable.
- [ ] TanStack Query mantiene una única fuente de verdad del server state; no se replica en Zustand.
- [ ] Los query keys incluyen filtros, paginación, identidad y scope necesarios; las mutaciones invalidan o actualizan cachés apropiadas.
- [ ] Zustand solo contiene estado cliente compartido y usa selectores.
- [ ] Axios se limita a infraestructura; trata errores, baseURL, cancelación y autenticación conforme al contrato real.
- [ ] No hay validaciones críticas exclusivamente en el frontend.
- [ ] Tests/lint/typecheck/build disponibles pasan, o se registran claramente los fallos.
- [ ] No se agregaron dependencias o capas innecesarias.
- [ ] La nueva funcionalidad respeta patrones, versiones y nomenclatura del repositorio.

## Antipatrones a evitar

- `useEffect` que llama a `fetch` directamente dentro de cada página para reglas que ya tienen caso de uso.
- Guardar respuestas GET en Zustand para luego sincronizarlas manualmente con TanStack Query.
- Usar Zustand para representar `isLoading`/`isError` que ya entrega TanStack Query.
- Llamar Axios desde JSX, stores Zustand o casos de uso.
- Interceptores que redirigen con React Router o importan stores de presentación generando ciclos.
- Reintentar mutaciones no idempotentes sin analizar el riesgo de duplicados.
- `application` importando `axios`, `react`, `window`, `localStorage` o `PatientHttpRepository`.
- `domain` acoplado a respuestas HTTP (`status`, `headers`, DTOs de transporte).
- Pasar entidades de dominio complejas directamente como estado mutable de formularios sin adaptarlas.
- Crear casos de uso que solo delegan sin valor en todas las pantallas por dogma.
- Crear repositorios genéricos CRUD enormes; preferir interfaces pequeñas por necesidad.
- Silenciar errores con `catch { return [] }` y confundir un fallo de red con un resultado vacío.
- Convertir la arquitectura en un requisito de carpetas sin tests ni control de imports.

## Recursos de esta skill

- `references/ejemplo-pacientes.md`: ejemplo integral TypeScript + React de un módulo de consulta de pacientes con inyección de dependencias y prueba unitaria.
- `references/stack-zustand-axios-tanstack.md`: reglas y ejemplo integrado de Axios + TanStack Query + Zustand, consultas y mutaciones.
- `references/revision-arquitectonica.md`: guía de auditoría, prioridades y formato de respuesta en revisiones/refactors.

## Formato de respuesta del agente

Al implementar o revisar, responder en español salvo indicación contraria, con:
1. **Diagnóstico**: estructura actual y problemas específicos.
2. **Decisión arquitectónica**: capas y separación elegidas, indicando simplificaciones.
3. **Cambios realizados**: archivos y flujo de datos.
4. **Verificación**: pruebas y comandos ejecutados, con resultados comprobados.
5. **Pendientes**: restricciones y riesgos reales; no inventar resultados.
