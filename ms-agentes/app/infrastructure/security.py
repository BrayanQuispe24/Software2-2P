import hmac
from fastapi import Header, HTTPException
from ..config import settings

def require_gateway(x_internal_token: str = Header(default="")):
    if not settings.INTERNAL_API_TOKEN or not hmac.compare_digest(x_internal_token, settings.INTERNAL_API_TOKEN):
        raise HTTPException(401, "La solicitud debe pasar por el gateway autenticado")

def require_admin(x_actor_role: str = Header(default="")):
    if x_actor_role != "ADMINISTRADOR":
        raise HTTPException(403, "Se requiere rol ADMINISTRADOR")
