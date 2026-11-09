# Monitoreo con fuentes reales

## Ejecución

Desde la raíz: `docker compose up -d --build ms-gimnasio ms-agentes api-gateway shell`.
El servicio usa PostgreSQL con el controlador `psycopg2`. Si la base no responde, el arranque falla: no cambia a SQLite.
Los cambios de esquema de agentes son aditivos y repetibles; no eliminan registros.

La interfaz está en `/admin/monitoreo-inteligente`. Requiere sesión de administrador o recepcionista.
La API interna exige `X-Internal-Token`; el gateway añade la identidad y el rol de la sesión.
Configura `AGENTES_INTERNAL_TOKEN` en el entorno de Compose antes de desplegar fuera del equipo local.
Las modificaciones de reglas, configuración de agentes, aprobaciones y despachos requieren administrador.

## Indicadores

* Aforo: último movimiento permitido de cada cliente, obtenido con paginación. La capacidad es la suma de capacidades de disciplinas activas; no representa un aforo físico independiente si varias disciplinas comparten sala.
* Asistencias: entradas permitidas en el intervalo solicitado.
* Matrículas: fechas reales de registro, comparando ventanas consecutivas de 7 o 30 días. Sin registros en la ventana anterior no se inventa un porcentaje.
* Membresías: inscripciones activas que vencen dentro de la ventana solicitada.
* Inventario: cantidades y estados de todos los equipos registrados, recorriendo todas las páginas. Sin equipos se informa falta de datos.
* Retención: consulta `ML_SERVICE_URL/api/v1/ml/churn/summary`. Si no está disponible, calcula la proporción de clientes con membresía activa sin entradas durante `RETENTION_INACTIVITY_DAYS`. Esta alternativa se identifica como `REGLA_INACTIVIDAD`, **no como predicción ML**. No se incluye ni se inventa un modelo entrenado.

Los servicios pueden contener registros cargados por sus propios seeders: agentes consulta los registros existentes y no puede determinar su procedencia cuando el contrato de origen no la indica.
No hay escenarios inyectados, simulador ni valores de demostración en ejecución. Los datos ficticios de las pruebas solo se usan con bases en memoria y adaptadores sustitutos.

## Reglas y acciones

Se respetan reglas activas, agente activo, máximo de autonomía del agente, horarios (zona `MONITOR_TIMEZONE`), duración mínima sostenida, histéresis y espera entre avisos.
Los ciclos se serializan con un bloqueo transaccional PostgreSQL. Cada acción externa utiliza su identificador como clave de idempotencia.

El nivel 0 solo observa; 1 alerta; 2 recomienda; 3 encola un aviso; 4 genera una propuesta pendiente de aprobación.
La aprobación de nivel 4 no ejecuta cambios. El administrador puede despachar después la propuesta aprobada al workflow configurado.
Un despacho confirmado acredita la entrega HTTP al workflow, no una modificación de precios, políticas o campañas en otros servicios.

El workflow n8n debe existir en `N8N_WEBHOOK_URL`, validar la entrada y respetar `Idempotency-Key` antes de enviar comunicaciones o aplicar acciones. Sus credenciales y destinatarios se configuran en la instalación; no se crean cuentas, correos ni entregas ficticias.
Si no hay destinatarios o el webhook falla, la acción queda `FALLIDA`, sin fecha de ejecución. El registro de hechos e intención se confirma antes del despacho (outbox).

## IA local

La vista usa `@mlc-ai/web-llm` en un Web Worker: descarga real, caché de pesos, selección de modelo, inferencia y velocidad de tokens observada.
El primer uso necesita red y memoria GPU suficientes. Sin WebGPU siguen disponibles las explicaciones determinísticas del backend; no se muestra una IA cargada ni un motor WASM ficticio.

Las respuestas son sugerencias revisables. Los modelos pequeños pueden equivocarse: no sustituyen las reglas ni tienen herramientas de escritura.
La validación numérica rechaza cifras ajenas a la evidencia y porcentajes que confundan capacidad con ocupación. En ese caso se presenta un resumen directo de los datos, identificado como tal. Esta comprobación no demuestra que todas las afirmaciones en lenguaje natural sean correctas.
El asistente solo selecciona herramientas de lectura de una lista permitida mediante JSON restringido. Se muestran los resultados utilizados.
Las explicaciones se guardan tras revisión del usuario, con modelo, texto y hash de la evidencia. Si la alerta cambia durante el análisis, la API rechaza la explicación antigua con `409`.

Referencia de integración: [WebLLM y Web Workers](https://webllm.mlc.ai/docs/user/advanced_usage.html).

## Verificación

Pruebas aisladas del backend:

```powershell
docker compose run --rm --no-deps -e DATABASE_URL=sqlite:///:memory: -v "${PWD}/ms-agentes:/app" ms-agentes python -m pytest tests -q
```

Incluyen fuentes no disponibles, agregaciones con registros reales de contrato, paginación, escalamiento, histéresis, cooldown, horarios, duración mínima, autorización, auditoría de IA, outbox y rechazo de escenarios simulados.
Las pruebas de UI no deben generar alertas ni notificaciones de prueba en las bases operativas.
