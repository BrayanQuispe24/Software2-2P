# Reglas del Proyecto ms-auth

## 🚨 Regla Obligatoria de Arquitectura y Desarrollo

Siempre que se vaya a **diseñar, implementar, modificar, refactorizar o auditar** cualquier endpoint, servicio, caso de uso, módulo, persistencia o funcionalidad en este proyecto NestJS (`ms-auth`), es **OBLIGATORIO** consultar y adherirse estrictamente a la skill de arquitectura hexagonal:

👉 **[Skill NestJS Hexagonal Architecture](.agents/skills/nestjs-hexagonal-architecture/SKILL.md)**

### Mandatos Esenciales:
1. **Separación Estricta de Capas:**
   - **`domain/`**: TypeScript puro. Prohibido `@nestjs/*`, `@Injectable()`, ORMs, DTOs HTTP o código de transporte.
   - **`application/`**: Casos de uso orquestadores, contratos de puertos (`ports/out`, `ports/in`) y modelos de comando/resultado. Prohibido NestJS u ORMs.
   - **`infrastructure/`**: Adaptadores de entrada (`adapters/in` para HTTP, controllers, DTOs) y adaptadores de salida (`adapters/out` para persistencia, repositorios, mappers, clientes).
2. **Inversión de Dependencias (DI):**
   - El núcleo (`domain` y `application`) nunca depende de la infraestructura.
   - Usar `Symbol`, tokens o clases abstractas para los puertos en el composition root (`*.module.ts`) de NestJS con `useFactory` / `useClass`.
3. **Mappers Obligatorios:**
   - Jamás exponer entidades ORM/ODM o esquemas hacia el dominio o casos de uso. Mapear explícitamente entre persistencia y dominio.
4. **Pruebas:**
   - Tests unitarios de dominio y aplicación deben ser 100% aislados de NestJS y de la base de datos (usar fakes/stubs en memoria).
