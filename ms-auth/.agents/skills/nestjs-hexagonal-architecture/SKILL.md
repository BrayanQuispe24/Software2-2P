---
name: nestjs-hexagonal-architecture
description: Diseña, implementa, refactoriza y audita backends y microservicios NestJS con arquitectura hexagonal Ports & Adapters, dominio independiente, casos de uso, puertos de entrada/salida, adaptadores REST/mensajería/persistencia (Mongoose, TypeORM o Prisma), DI de NestJS y pruebas. Activar obligatoriamente para cualquier implementación, endpoint, repositorio, integración o revisión arquitectónica de NestJS.
---

# Skill: Arquitectura Hexagonal para NestJS

## Objetivo

Construir y mantener servicios backend NestJS + TypeScript preservando la independencia del **Domain** y **Application** frente a NestJS, transportes, ORM/ODM y microservicios externos. Separar **puertos (contratos)** de **adaptadores (implementaciones)**, con pruebas y seguridad.

## Protocolo obligatorio

1. **Inspeccionar primero:** `package.json`, versión NestJS/TS, `tsconfig*`, módulos, transporte (REST, GraphQL, TCP, RMQ, Kafka), persistencia (Mongoose/TypeORM/Prisma), tests, convenciones, scripts y despliegue. No inventar dependencias.
2. **Definir comportamiento:** casos de uso, invariantes, operaciones, autorizaciones, errores, concurrencia y consistencia. Preservar APIs y contratos existentes salvo petición explícita.
3. **Proponer diseño mínimo:** entidades/value objects, comandos/resultados, puertos de salida y adaptadores; puerto de entrada solo si aporta valor. Indicar archivos afectados antes de editar.
4. **Implementar por capas:** Domain → Application → Infrastructure/Adapters/Out → Infrastructure/Adapters/In → módulo de composición. Mantener cambios atómicos.
5. **Probar:** unitarios puros del dominio/casos de uso con fakes; integración de mappers y repositorios; HTTP/mensajería e2e según contexto; comprobar índices/restricciones y errores.
6. **Verificar scripts disponibles:** `npm test`, `npm run test:e2e`, `npm run lint`, `npm run build` o equivalentes reales del repo. No afirmar ejecución sin evidencia.
7. **Entregar:** rutas y archivos modificados, decisión de diseño, pruebas ejecutadas, posibles incompatibilidades, migraciones/índices y riesgos pendientes.

## Estructura sugerida (por módulo de negocio)

```text
src/
├── [modulo-negocio]/
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── enums/
│   │   ├── errors/
│   │   ├── services/                 # reglas entre múltiples objetos de dominio
│   │   └── events/                   # eventos de dominio internos sin broker
│   ├── application/
│   │   ├── ports/
│   │   │   ├── in/                   # opcional (interfaces de casos de uso)
│   │   │   └── out/                  # contratos hacia infraestructura (repositorios, clientes)
│   │   ├── use-cases/                # lógica de orquestación pura
│   │   └── models/                   # commands, queries, results/dtos de aplicación
│   ├── infrastructure/
│   │   ├── adapters/
│   │   │   ├── in/
│   │   │   │   ├── http/             # controllers, guards, dto, presenters
│   │   │   │   └── messaging/        # listeners, consumers
│   │   │   └── out/
│   │   │       ├── persistence/      # repositorios, esquemas, mappers
│   │   │       ├── http/             # clientes externos REST
│   │   │       └── messaging/        # publishers de eventos
│   │   └── config/                   # configuración local de infra
│   └── [modulo-negocio].module.ts    # composition root (DI providers)
├── app.module.ts
└── main.ts

test/
├── unit/domain/
├── unit/application/
├── integration/
└── e2e/
```

> **Nota:** Estructura orientativa; nunca crear directorios vacíos o infraestructura no utilizada. En monorepos NestJS respetar `apps/` y `libs/` existentes. Evitar crear librerías compartidas con entidades de negocio de distintos microservicios.

## Reglas no negociables

- **Domain:** TypeScript puro. Sin `@nestjs/*`, `@Injectable()`, `@Schema()`, Mongoose, Prisma, TypeORM, `HttpException`, DTOs HTTP, transporte, `process.env` ni IO. Proteger invariantes mediante entidades y value objects; errores de negocio sin códigos HTTP.
- **Application:** casos de uso orquestan operaciones y dependen de contratos internos. No importar `@nestjs/common`, ORM/ODM, adaptadores o clases concretas externas. Entradas/salidas independientes de transportes. Excepciones de aplicación sin status HTTP.
- **Ports Out:** interfaces/clases abstractas del núcleo, con modelos del dominio o de aplicación. No retornar documentos Mongoose, entidades ORM, `Response`, ni observables de transporte si no son parte del contrato elegido.
- **Adapters In:** controladores/rest resolvers/consumidores transforman protocolo → comando → caso de uso → respuesta. DTOs `class-validator` y decoradores Nest solamente en infraestructura. Traducción de errores a HTTP/mensajería en filtros o mappers del borde.
- **Adapters Out:** Mongoose/TypeORM/Prisma, HTTP clients y publishers implementan los puertos. Esquemas/entidades ORM != entidades de dominio. Mapear explícitamente y preservar invariantes durante rehidratación.
- **Inyección NestJS:** interfaces TS no existen en runtime; usar `Symbol`/string tokens o clases abstractas. Registrar `provide`/`useClass`, `useFactory` e `inject` en el `*.module.ts` o módulo de composición; el núcleo no importa el token Nest. Crear casos de uso mediante factory si se requiere mantenerlos sin `@Injectable()`.
- **Dependencias de código:** `Infrastructure → Application → Domain` (Infra puede importar Domain); Domain jamás importa Application ni Infra. El flujo de ejecución de un repositorio no invierte este principio.
- **Persistencia y concurrencia:** índices únicos, transacciones si corresponden, control de versiones/optimistic concurrency cuando sea necesario; la verificación `exists()` previa no evita condiciones de carrera. Mapear error de índice único a conflicto de negocio.
- **Distribuidos:** comunicación con otros servicios mediante puertos, no acceso directo a su BD. Timeouts, idempotencia, retry acotado, validación de identidad/permiso, diseño de consistencia y eventos/outbox según criticidad.
- **Seguridad:** authn/guards al borde, autorización de negocio en aplicación/dominio, no exponer propiedades sensibles ni loguearlas. Validar la entrada y la salida.
- **Pragmatismo:** no crear interfaces/abstracciones o `mapper` por cada clase trivial. Conservar nombres y convenciones coherentes del proyecto.

## Modo de desarrollo por funcionalidad

1. Elaborar contrato funcional y reglas con ejemplos positivos/negativos.
2. Implementar entidad/value object y pruebas puras.
3. Crear `ports/out` y `application/models` necesarios.
4. Implementar caso de uso mediante constructor con puertos sin decoradores Nest.
5. Implementar repositorio/cliente externo y mapper, con pruebas integradas.
6. Crear DTO HTTP, `Controller` delgado, guards/filtros/presenter necesarios.
7. Registrar adaptadores y caso de uso en `*.module.ts` con provider tokens y factory.
8. Probar flujo completo, índices, fallos de red, validación y concurrencia.
9. Revisar imports del núcleo, scripts y compatibilidad.

## Criterios de aceptación

- [ ] `domain/` importa solo TypeScript/librerías agnósticas del negocio.
- [ ] `application/` no importa NestJS, ORM ni `infrastructure/`.
- [ ] Los ports no exponen modelos de persistencia o transporte.
- [ ] Controladores/consumidores delegan a casos de uso; sin negocio mezclado.
- [ ] Contratos conectados a adaptadores reales por provider tokens en el módulo.
- [ ] Mappers separan entidades de dominio y modelos ORM/ODM.
- [ ] Errores se traducen en el borde; consistencia y restricciones garantizadas.
- [ ] Pruebas unitarias sin Nest Application ni BD; integración donde procede.
- [ ] `build`, `test`, `lint` según scripts existentes o límites documentados.

## Documentación complementaria

- [Decisiones y anti-patrones](./references/architecture-rules.md)
- [Playbook de implementación end-to-end](./references/implementation-playbook.md)
- [Pruebas, auditoría y checklist](./references/testing-and-review.md)
- [Plantilla de funcionalidad](./examples/feature-template.md)
