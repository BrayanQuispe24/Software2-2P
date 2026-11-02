# Seguridad, rendimiento y operación

## Modelo de amenazas

- Autenticación: validar identidad y establecer contexto por petición/conexión.
- Autorización: comprobar acceso por operación, recurso y campo; no exponer datos sensibles en asociaciones anidadas ni en introspección si el contrato no debe revelarlos.
- Abuso de consultas: limitar profundidad, complejidad, aliases excesivos, volumen, timeout y tasa por identidad.
- Validación: esquema + validación de negocio; proteger integraciones externas y consultas de persistencia con parámetros seguros.
- Errores: separar mensajes útiles para clientes de logs internos con información sensible.
- Subscriptions: revalidar autorización de conexión/evento y gestionar revocación de sesión.

## Problema N+1

Consulta de 100 pacientes y sus odontólogos podría ejecutar 1 + 100 lecturas. Batch loading agrupa las claves en una sola búsqueda o pocas consultas. Crea los DataLoaders por petición para aislar usuarios, políticas de autorización y caché.

```js
const loader = new DataLoader(async (ids) => {
  const records = await repo.buscarVarios(ids);
  const byId = new Map(records.map(r => [String(r.id), r]));
  return ids.map(id => byId.get(String(id)) ?? null);
});
```

`DataLoader`, `repo` y el esquema de datos deben estar disponibles; mantener el orden de resultados según `ids`.

## Paginación

No exponer colecciones ilimitadas. En offset pagination, imponer `limit` máximo; en conexiones cursor-based, incluir `edges { cursor node }` y `pageInfo { hasNextPage endCursor }`, definir orden estable y considerar cambios concurrentes.

## Caché

Distinguir caché de resolvers por solicitud, caché por usuario/identidad, caché distribuida y caché de cliente. Evitar fugas entre usuarios; invalidar según mutations. GraphQL no implementa caching automáticamente.

## Checklist de entrega

- [ ] Esquema y nulabilidad revisados
- [ ] Validaciones y autorización de campos anidados
- [ ] Paginación y límites de complejidad
- [ ] No hay N+1 graves; DataLoader si corresponde
- [ ] Errores seguros, logging y métricas
- [ ] Pruebas de GraphQL y dominios sensibles
- [ ] Compatibilidad documentada y deprecaciones planificadas
- [ ] Rate limits y políticas operativas definidos

## Fuentes oficiales

- https://graphql.org/learn/
- https://graphql.org/learn/schema/
- https://graphql.org/learn/execution/
- https://graphql.org/learn/security/
- https://spec.graphql.org/
