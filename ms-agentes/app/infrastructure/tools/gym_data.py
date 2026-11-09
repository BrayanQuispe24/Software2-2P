from datetime import datetime, timezone, date
import httpx
from ...config import settings

def utc(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)

async def graphql(query, variables=None):
    async with httpx.AsyncClient(timeout=settings.SOURCE_TIMEOUT_SECONDS) as client:
        response = await client.post(f"{settings.GYM_SERVICE_URL}/graphql", json={"query": query, "variables": variables or {}})
        response.raise_for_status()
        body = response.json()
        if body.get("errors") or not isinstance(body.get("data"), dict):
            raise ValueError("Gimnasio devolvió una respuesta GraphQL incompleta")
        return body["data"]

async def accesses():
    records, seen = [], set()
    # Stable descending pagination; de-duplicate new entries between pages.
    for page in range(2000):
        data = await graphql('''query Access($page: Int!) {
            registrosAccesoPagina(pagina: $page, limite: 500) {
                id clienteId tipoMovimiento estadoAcceso fechaHora
            }
        }''', {"page": page})
        batch = data["registrosAccesoPagina"]
        if not isinstance(batch, list):
            raise ValueError("Página de accesos inválida")
        for row in batch:
            if row["id"] not in seen:
                records.append(row)
                seen.add(row["id"])
        if len(batch) < 500:
            return records
    raise ValueError("No se pudo obtener el historial completo de accesos")

async def enrollments():
    rows, seen = [], set()
    for page in range(2000):
        data = await graphql('''query Enrollments($page: Int!) {
            inscripcionesPagina(pagina: $page, limite: 500) {
                id clienteId estado fechaInicio fechaFin createdAt
            }
        }''', {"page": page})
        batch = data["inscripcionesPagina"]
        for row in batch:
            if row["id"] not in seen:
                rows.append(row)
                seen.add(row["id"])
        if len(batch) < 500:
            return rows
    raise ValueError("No se pudo obtener el historial completo de inscripciones")
