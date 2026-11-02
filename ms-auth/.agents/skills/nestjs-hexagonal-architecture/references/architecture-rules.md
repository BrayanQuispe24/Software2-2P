# Decisiones Arquitectónicas y Anti-patrones en NestJS Hexagonal

Este documento complementa la skill `nestjs-hexagonal-architecture` detallando patrones recomendados y anti-patrones comunes.

---

## 1. Anti-patrones Comunes a Evitar

### ❌ Fugas de Framework en el Núcleo
- **Error:** Colocar `@Injectable()`, `@Inject()`, `@Body()`, o decoradores de Swagger/Class-Validator dentro de clases en `domain/` o `application/`.
- **Consecuencia:** Acopla la lógica de negocio al ciclo de vida y metadatos de NestJS, impidiendo reutilizar la lógica o probarla sin el contenedor de DI.
- **Solución:** Casos de uso y entidades se instancian mediante constructores planos de TypeScript puro. En el módulo de NestJS (`*.module.ts`), se usa un provider con `useFactory` para inyectar las dependencias al caso de uso.

### ❌ Inyección Directa de Repositorios ORM en Controladores o Casos de Uso
- **Error:** Inyectar `@InjectModel(User.name)` de Mongoose o `@InjectRepository(User)` de TypeORM dentro del caso de uso.
- **Consecuencia:** El caso de uso queda atado a los métodos propietarios de la librería ORM/ODM (`.find()`, `.exec()`, `QueryBuilder`).
- **Solución:** El caso de uso solo conoce la interfaz o clase abstracta del puerto (`UserRepositoryPort`). La implementación en `infrastructure/adapters/out/persistence` inyecta el modelo/ORM y traduce a la entidad de dominio.

### ❌ Fuga de Entidades de Persistencia a la Aplicación/Dominio
- **Error:** Retornar `UserDocument` (Mongoose) o la entidad `@Entity()` de TypeORM directamente desde el repositorio hacia el caso de uso o dominio.
- **Consecuencia:** Modificaciones accidentales de esquemas de BD rompen las reglas de negocio; mutaciones en memoria provocan side-effects no deseados en la BD.
- **Solución:** Uso estricto de **Mappers**:
  - `toDomain(record): DomainEntity`
  - `toPersistence(entity): PersistenceRecord`

### ❌ Lógica de Negocio en Controladores o DTOs
- **Error:** Validar estados de negocio o mutar entidades dentro del controller HTTP.
- **Consecuencia:** Dificulta cambiar o agregar otros adaptadores de entrada (GraphQL, RabbitMQ, Kafka, CLI) sin duplicar código.
- **Solución:** El controlador únicamente valida el payload (vía class-validator), mapea el DTO a un comando plano de aplicación, invoca el caso de uso y formatea la respuesta HTTP.

### ❌ Manejo de Errores con Códigos HTTP en Dominio/Aplicación
- **Error:** Lanzar `new BadRequestException('Usuario inactivo')` o `new NotFoundException(...)` dentro de un caso de uso o entidad.
- **Consecuencia:** Contamina el núcleo con conceptos del protocolo HTTP.
- **Solución:** Lanzar excepciones de negocio específicas (ej. `UserNotFoundError`, `InvalidUserStatusError`). Un `ExceptionFilter` de NestJS o un bloque en el adaptador HTTP mapea estas excepciones al código HTTP correspondiente (404, 400, 409).

---

## 2. Inyección de Dependencias sin Acoplamiento

En TypeScript, las interfaces son eliminadas en tiempo de compilación. Para desacoplar el puerto de la implementación en NestJS existen dos técnicas:

### Opción A: Symbol o Token String (Recomendado para purismo)
```typescript
// application/ports/out/user-repository.port.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// auth.module.ts (Composition Root)
@Module({
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: MongooseUserRepositoryAdapter,
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (repo: UserRepositoryPort) => new RegisterUserUseCase(repo),
      inject: [USER_REPOSITORY],
    },
  ],
})
```

### Opción B: Clases Abstractas como Tokens
```typescript
// application/ports/out/user-repository.port.ts
export abstract class UserRepositoryPort {
  abstract findById(id: string): Promise<User | null>;
  abstract save(user: User): Promise<void>;
}

// auth.module.ts
@Module({
  providers: [
    {
      provide: UserRepositoryPort,
      useClass: MongooseUserRepositoryAdapter,
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (repo: UserRepositoryPort) => new RegisterUserUseCase(repo),
      inject: [UserRepositoryPort],
    },
  ],
})
```
