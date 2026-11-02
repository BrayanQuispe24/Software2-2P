# Regla: Consulta Obligatoria de la Skill de Arquitectura Hexagonal

Para cualquier tarea de implementación, adición de endpoints, creación de repositorios, integración de servicios o refactorización en este repositorio:

1. **Consultar la Skill:** Leer y seguir el protocolo y criterios establecidos en [.agents/skills/nestjs-hexagonal-architecture/SKILL.md](../skills/nestjs-hexagonal-architecture/SKILL.md).
2. **Respetar Capas:**
   - `domain/`: Reglas de negocio e invariantes sin dependencias de NestJS ni bases de datos.
   - `application/`: Casos de uso y puertos (interfaces de repositorios/servicios).
   - `infrastructure/`: Implementación de adaptadores (HTTP controllers, DTOs con class-validator, repositorios de persistencia con mappers).
3. **Composición en NestJS:** Conectar puertos y adaptadores mediante provider tokens (`Symbol` o clases abstractas) en los módulos NestJS.
4. **Verificación:** Ejecutar pruebas unitarias puras y scripts de comprobación (`npm test`, `npm run lint`, `npm run build`).
