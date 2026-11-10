import secrets
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from ...domain.models import ScopeEnum
from ..db.storage import storage_service

class TokenService:
    @staticmethod
    def generate_token(name: str, owner: str, scopes: List[str], expires_at: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
        """
        Genera un token seguro con formato mcp_<random_hex>.
        Retorna (raw_token, token_metadata).
        El raw_token SOLO se debe presentar una vez al creador.
        """
        random_part = secrets.token_hex(24)
        raw_token = f"mcp_{random_part}"
        token_id = f"tok-{secrets.token_hex(6)}"
        token_hash = storage_service.hash_token(raw_token)
        prefix = raw_token[:10] + "..."

        storage_service.insert_token(
            token_id=token_id,
            name=name,
            token_hash=token_hash,
            token_prefix=prefix,
            owner=owner,
            scopes=scopes,
            expires_at=expires_at
        )

        metadata = {
            "token_id": token_id,
            "name": name,
            "owner": owner,
            "scopes": scopes,
            "token_prefix": prefix,
            "expires_at": expires_at,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        return raw_token, metadata

    @staticmethod
    def validate_token(raw_token: str, required_scope: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[Dict[str, Any]]]:
        """
        Valida que el token exista, no esté revocado, no haya expirado y posea el scope requerido.
        Retorna (is_valid, error_reason, token_record).
        """
        if not raw_token or not raw_token.strip():
            return False, "Token de autorización no proporcionado", None

        token_hash = storage_service.hash_token(raw_token.strip())
        record = storage_service.get_token_by_hash(token_hash)
        if not record:
            return False, "Token inválido o revocado", None

        if record.get("revoked"):
            return False, "El token ha sido revocado", None

        expires_at = record.get("expires_at")
        if expires_at:
            try:
                exp_dt = datetime.fromisoformat(expires_at)
                if datetime.now(timezone.utc) > exp_dt:
                    return False, "El token ha expirado", None
            except Exception:
                pass

        scopes = record.get("scopes", [])
        if required_scope and ScopeEnum.ALL.value not in scopes:
            if required_scope not in scopes:
                return False, f"Permiso insuficiente: se requiere el scope '{required_scope}'", None

        return True, None, record

    @staticmethod
    def revoke(token_id: str) -> bool:
        return storage_service.revoke_token(token_id)

    revoke_token = revoke

    @staticmethod
    def list_tokens() -> List[Dict[str, Any]]:
        return storage_service.list_tokens()

token_service = TokenService()

