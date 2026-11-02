# Fundamentos de GraphQL

## Modelo mental

GraphQL define un esquema de API tipado. El cliente envía un documento con operaciones y selecciones; el motor valida el documento frente al esquema, ejecuta resolvers y produce una respuesta que suele reflejar la selección solicitada. El servidor mantiene el control de campos, permisos, costes y datos.

## SDL esencial

- `type`: objeto con campos; `input`: objeto admitido como entrada; `enum`: valores cerrados; `interface`: contrato compartido; `union`: alternativas de tipos de objeto; `scalar`: valor atómico, integrado o personalizado.
- Nulabilidad: `String` permite `null`; `String!` no; `[Paciente]` admite lista nula y elementos nulos; `[Paciente!]!` exige lista no nula de elementos no nulos y puede ser vacía.
- `Query`: lecturas; `Mutation`: cambios; `Subscription`: streaming de eventos donde el servidor lo soporte.
- Argumentos: `paciente(id: ID!): Paciente` define requisito y retorno potencialmente nulo.

## Documentos de cliente

```graphql
query Buscar($id: ID!) {
  ficha: paciente(id: $id) {
    ...DatosPaciente
  }
}
fragment DatosPaciente on Paciente {
  id
  nombre
}
```

Usar variables separadas del documento, no concatenación de texto. Los alias (`ficha`) cambian el nombre de la clave de respuesta; los fragmentos evitan duplicación de selecciones.

## Respuestas y errores

Un resultado GraphQL puede incluir `data`, `errors` y `extensions`. Un error de campo puede coexistir con datos parciales. Los incumplimientos de no nulabilidad generan propagación de null hasta un ancestro anulable. No considerar el status HTTP como único indicador de éxito de cada campo. Evitar revelar detalles internos de errores.

## Introspección y herramientas

La introspección permite descubrir tipos y campos según la política del servidor. IDEs como GraphiQL y clientes como Apollo ayudan a experimentar; el contrato es independiente de herramientas comerciales.

## Cuándo elegir GraphQL

Útil cuando distintas pantallas requieren selecciones distintas, existen grafos de relaciones y se desea un contrato tipado consultable. REST puede ser mejor por simplicidad operativa, caching HTTP o recursos uniformes. GraphQL no reduce automáticamente consultas internas ni latencia.

## Operaciones especiales

- Mutations deben comprobar permisos y validez transaccional.
- Subscriptions requieren solución de transporte y distribución de eventos.
- Evolucionar esquema sin romper clientes: preferir adiciones y deprecaciones, observando uso antes de eliminar campos.
