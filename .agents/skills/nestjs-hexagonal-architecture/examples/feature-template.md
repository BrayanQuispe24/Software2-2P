# Plantilla de Funcionalidad para Módulos NestJS Hexagonales

Usa esta plantilla como referencia para estructurar nuevos módulos o funcionalidades en el proyecto:

```text
src/
└── [nombre-modulo]/
    ├── domain/
    │   ├── entities/
    │   │   └── [nombre].entity.ts            # Entidad pura TypeScript
    │   ├── value-objects/
    │   │   └── [nombre].vo.ts                # Value objects inmutables
    │   ├── errors/
    │   │   └── [nombre].error.ts             # Excepciones de negocio sin status HTTP
    │   └── events/
    │       └── [nombre].event.ts             # Eventos internos de dominio
    │
    ├── application/
    │   ├── ports/
    │   │   ├── in/                           # Interfaces opcionales de entrada
    │   │   └── out/
    │   │       └── [nombre].repository.port.ts # Contrato del puerto (Symbol + Interface)
    │   ├── use-cases/
    │   │   └── [accion-nombre].use-case.ts   # Caso de uso plano con constructor injection
    │   └── models/
    │       ├── [accion].command.ts           # Payload de entrada
    │       └── [accion].result.ts            # Resultado retornado
    │
    ├── infrastructure/
    │   ├── adapters/
    │   │   ├── in/
    │   │   │   └── http/
    │   │   │       ├── controllers/
    │   │   │       │   └── [nombre].controller.ts # Recibe HTTP y delega a use-case
    │   │   │       ├── dto/
    │   │   │       │   └── [accion].dto.ts        # Validaciones con class-validator
    │   │   │       └── presenters/
    │   │   │           └── [nombre].presenter.ts  # Formateo de respuesta JSON
    │   │   └── out/
    │   │       └── persistence/
    │   │           ├── [orm]/
    │   │           │   ├── schemas/               # Esquema o entidad de BD
    │   │           │   ├── mappers/               # Mapper Dominio <-> BD
    │   │           │   └── repositories/          # Implementación del puerto
    │   └── config/
    │
    └── [nombre-modulo].module.ts             # Composition Root: registra DI y controladores
```
