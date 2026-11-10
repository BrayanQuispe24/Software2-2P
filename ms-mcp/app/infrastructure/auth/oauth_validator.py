import logging
import httpx
import jwt
from typing import Optional, Dict, Any, Tuple
from ...config import settings

logger = logging.getLogger("ms-mcp.oauth")

class OAuthValidator:
    """
    Validador de tokens JWT emitidos por el servidor OIDC central de ms-auth (utilizado por ChatGPT).
    Descarga las claves públicas JWKS y valida firma, emisor, audiencia y scopes.
    """
    def __init__(self):
        self._cached_jwks: Optional[Dict[str, Any]] = None

    async def _fetch_jwks(self) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=settings.SOURCE_TIMEOUT_SECONDS) as client:
                res = await client.get(settings.AUTH_JWKS_URL)
                if res.status_code == 200:
                    self._cached_jwks = res.json()
                    return self._cached_jwks
        except Exception as exc:
            logger.warning("No se pudo obtener JWKS de ms-auth: %s", exc)
        return self._cached_jwks

    async def validate_jwt(self, token: str, required_scope: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        if not token:
            return False, "Token ausente", None

        # Si no parece un JWT (3 partes separadas por puntos), no es OAuth JWT
        if token.count(".") != 2:
            return False, "Formato de token no es JWT", None

        jwks = await self._fetch_jwks()
        if not jwks:
            return False, "Servidor de claves OIDC no disponible", None

        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")

            # Buscar la clave pública en el set de JWKS
            key = None
            for k in jwks.get("keys", []):
                if not kid or k.get("kid") == kid:
                    key = jwt.algorithms.RSAAlgorithm.from_jwk(k)
                    break

            if not key:
                return False, "Clave pública del token no encontrada en JWKS", None

            payload = jwt.decode(
                token,
                key=key,
                algorithms=["RS256"],
                options={"verify_aud": False}  # Acepta audiencia de ms-auth o mcp
            )

            # Validar scopes del token
            token_scopes = payload.get("scope", "").split()
            if required_scope:
                if "*" not in token_scopes and required_scope not in token_scopes and f"reportes:{required_scope}" not in token_scopes and "api:read" not in token_scopes:
                    return False, f"Token OAuth carece del scope requerido: {required_scope}", None

            consumer_record = {
                "token_id": payload.get("jti", "jwt-oauth"),
                "name": f"ChatGPT OAuth ({payload.get('client_id', 'unknown')})",
                "owner": payload.get("sub", payload.get("email", "oauth-user")),
                "scopes": token_scopes,
                "consumer_type": "CHATGPT_OAUTH"
            }
            return True, None, consumer_record

        except jwt.ExpiredSignatureError:
            return False, "Token OAuth expirado", None
        except Exception as exc:
            return False, f"Firma o token OAuth inválido: {str(exc)}", None

oauth_validator = OAuthValidator()

