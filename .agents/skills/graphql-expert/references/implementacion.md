# Implementación y arquitectura GraphQL

## Separación recomendada

Cliente web/móvil -> servidor GraphQL -> resolver -> aplicación/caso de uso -> repositorio o conector -> base de datos/servicios. El resolver traduce argumentos y contexto, invoca servicios y construye valores. La capa de dominio no depende de GraphQL.

## Ejemplo conceptual en JavaScript

```js
const resolvers = {
  Query: {
    paciente: async (_parent, { id }, context) => {
      context.requirePermission('paciente:read', id);
      return context.services.pacientes.obtenerPorId(id);
    },
  },
  Mutation: {
    crearPaciente: async (_parent, { input }, context) => {
      context.requirePermission('paciente:create');
      return context.services.pacientes.crear(input);
    },
  },
};
```

El código es ilustrativo: `requirePermission` y `services` deben implementarse; no es un servidor ejecutable por sí solo.

## NestJS Code First

```ts
@ObjectType()
export class Paciente {
  @Field(() => ID) id!: string;
  @Field() nombre!: string;
}

@Resolver(() => Paciente)
export class PacienteResolver {
  constructor(private readonly service: PacientesService) {}

  @Query(() => Paciente, { nullable: true })
  paciente(@Args('id', { type: () => ID }) id: string) {
    return this.service.buscarPorId(id);
  }
}
```

Requiere instalar/configurar los paquetes GraphQL compatibles con las versiones presentes. Comparar enfoque Code First y Schema First antes de elegir; no mezclar al azar.

## Frontend Angular/React

- Centralizar cliente, endpoint y gestión de credenciales.
- Generar tipos desde el esquema/operaciones cuando sea posible.
- Preferir variables para filtros y IDs, y fragmentos para componentes reutilizables.
- Definir políticas de caché e invalidación para mutations.
- Manejar carga, errores GraphQL y errores de transporte por separado.

## Testing mínimo

1. Esquema válido y operación positiva.
2. Argumentos inválidos y faltantes.
3. Casos sin resultados y campos nulos.
4. Permisos denegados en consultas y relaciones anidadas.
5. Mutations con transacción/rollback cuando aplique.
6. Paginación y límites.
7. Conteo de consultas a datos y casos N+1.
8. Compatibilidad de cambios del esquema.

## Antipatrones

Resolver haciendo SQL directamente; esquema reflejando tablas sin considerar dominio; campos `JSON` sin contrato cuando se puede modelar tipos; mutations genéricas sin reglas de negocio; cambiar varias librerías sin verificar compatibilidad; usar errores genéricos para todos los casos.
