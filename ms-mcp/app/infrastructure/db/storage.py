import sqlite3
import hashlib
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

from ...config import settings

logger = logging.getLogger("ms-mcp.storage")

class StorageService:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or (settings.DATA_DIR / "mcp_store.db")
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Tabla de tokens de acceso a MCP
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_tokens (
                token_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                token_prefix TEXT NOT NULL,
                owner TEXT NOT NULL,
                scopes TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT,
                revoked INTEGER NOT NULL DEFAULT 0
            );
            """)

            # Tabla de auditoría inmutable de llamadas MCP
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                consumer_id TEXT,
                consumer_type TEXT,
                tool_name TEXT NOT NULL,
                arguments TEXT,
                status TEXT NOT NULL,
                row_count INTEGER DEFAULT 0,
                duration_ms REAL DEFAULT 0,
                warnings TEXT
            );
            """)

            # Tabla de archivos exportados (CSV/PDF)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS export_files (
                file_id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                file_path TEXT NOT NULL,
                formato TEXT NOT NULL,
                reporte_nombre TEXT NOT NULL,
                tamanio_bytes INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                token_id TEXT
            );
            """)

            conn.commit()

        # Sembrar tokens por defecto si la base está vacía
        self._seed_default_tokens()

    @staticmethod
    def hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.strip().encode("utf-8")).hexdigest()

    def _seed_default_tokens(self):
        default_tokens = [
            {
                "id": "tok-agentes-system",
                "name": "ms-agentes Internal Token",
                "raw": settings.AGENT_INTERNAL_TOKEN,
                "owner": "ms-agentes-autonomous",
                "scopes": ["asistencia", "membresias", "inventario", "entrenamiento", "finanzas", "identidades"],
            },
            {
                "id": "tok-gateway-system",
                "name": "API Gateway / WebLLM Token",
                "raw": settings.GATEWAY_INTERNAL_TOKEN,
                "owner": "api-gateway-webllm",
                "scopes": ["*"],
            },
            {
                "id": "tok-admin-init",
                "name": "Root MCP Administrator Token",
                "raw": settings.ADMIN_INIT_TOKEN,
                "owner": "admin@apexfitness.local",
                "scopes": ["*"],
            },
            {
                "id": "tok-claude-dev",
                "name": "Claude Desktop / Remote MCP Connector",
                "raw": settings.CLAUDE_DEV_TOKEN,
                "owner": "claude-connector@apexfitness.com",
                "scopes": ["asistencia", "membresias", "inventario", "finanzas", "entrenamiento", "exportaciones"],
            },
        ]

        with self._get_connection() as conn:
            cursor = conn.cursor()
            for t in default_tokens:
                thash = self.hash_token(t["raw"])
                cursor.execute("SELECT token_id FROM api_tokens WHERE token_hash = ?", (thash,))
                if not cursor.fetchone():
                    prefix = t["raw"][:10] + "..."
                    cursor.execute("""
                    INSERT INTO api_tokens (token_id, name, token_hash, token_prefix, owner, scopes, created_at, expires_at, revoked)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0)
                    """, (
                        t["id"],
                        t["name"],
                        thash,
                        prefix,
                        t["owner"],
                        json.dumps(t["scopes"]),
                        datetime.now(timezone.utc).isoformat()
                    ))
            conn.commit()

    # Operaciones de tokens
    def get_token_by_hash(self, token_hash: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM api_tokens WHERE token_hash = ? AND revoked = 0", (token_hash,))
            row = cursor.fetchone()
            if not row:
                return None
            res = dict(row)
            res["scopes"] = json.loads(res["scopes"])
            res["revoked"] = bool(res["revoked"])
            return res

    def list_tokens(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT token_id, name, token_prefix, owner, scopes, created_at, expires_at, revoked FROM api_tokens ORDER BY created_at DESC")
            rows = cursor.fetchall()
            result = []
            for r in rows:
                item = dict(r)
                item["scopes"] = json.loads(item["scopes"])
                item["revoked"] = bool(item["revoked"])
                result.append(item)
            return result

    def insert_token(self, token_id: str, name: str, token_hash: str, token_prefix: str, owner: str, scopes: List[str], expires_at: Optional[str] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO api_tokens (token_id, name, token_hash, token_prefix, owner, scopes, created_at, expires_at, revoked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
            """, (
                token_id,
                name,
                token_hash,
                token_prefix,
                owner,
                json.dumps(scopes),
                datetime.now(timezone.utc).isoformat(),
                expires_at
            ))
            conn.commit()

    def revoke_token(self, token_id: str) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE api_tokens SET revoked = 1 WHERE token_id = ?", (token_id,))
            conn.commit()
            return cursor.rowcount > 0

    # Operaciones de auditoría
    def log_audit(self, entry_id: str, consumer_id: str, consumer_type: str, tool_name: str, arguments: Dict[str, Any], status: str, row_count: int, duration_ms: float, warnings: List[str]):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO audit_logs (id, timestamp, consumer_id, consumer_type, tool_name, arguments, status, row_count, duration_ms, warnings)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    entry_id,
                    datetime.now(timezone.utc).isoformat(),
                    consumer_id,
                    consumer_type,
                    tool_name,
                    json.dumps(arguments, ensure_ascii=False),
                    status,
                    row_count,
                    round(duration_ms, 2),
                    json.dumps(warnings, ensure_ascii=False)
                ))
                conn.commit()
        except Exception as exc:
            logger.error("Error al registrar auditoría en SQLite: %s", exc)

    def list_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            res = []
            for r in rows:
                item = dict(r)
                item["arguments"] = json.loads(item["arguments"]) if item.get("arguments") else {}
                item["warnings"] = json.loads(item["warnings"]) if item.get("warnings") else []
                res.append(item)
            return res

    # Operaciones de exportación
    def insert_export(self, file_id: str, filename: str, file_path: str, formato: str, reporte_nombre: str, tamanio_bytes: int, expires_at: str, token_id: Optional[str] = None):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR REPLACE INTO export_files (file_id, filename, file_path, formato, reporte_nombre, tamanio_bytes, created_at, expires_at, token_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                file_id,
                filename,
                file_path,
                formato,
                reporte_nombre,
                tamanio_bytes,
                datetime.now(timezone.utc).isoformat(),
                expires_at,
                token_id
            ))
            conn.commit()

    def save_export_file(self, file_record: Any):
        """Guarda un registro de archivo exportado."""
        if hasattr(file_record, "model_dump"):
            data = file_record.model_dump()
        elif isinstance(file_record, dict):
            data = file_record
        else:
            data = {
                "file_id": getattr(file_record, "file_id", None),
                "filename": getattr(file_record, "filename", None),
                "file_path": getattr(file_record, "file_path", None),
                "formato": getattr(file_record, "formato", None),
                "reporte_nombre": getattr(file_record, "reporte_nombre", ""),
                "tamanio_bytes": getattr(file_record, "tamanio_bytes", 0),
                "expires_at": getattr(file_record, "expires_at", ""),
                "token_id": getattr(file_record, "token_id", None),
            }

        formato = data.get("formato", "CSV")
        if hasattr(formato, "value"):
            formato = formato.value

        self.insert_export(
            file_id=data.get("file_id"),
            filename=data.get("filename"),
            file_path=str(data.get("file_path")),
            formato=str(formato),
            reporte_nombre=data.get("reporte_nombre", ""),
            tamanio_bytes=data.get("tamanio_bytes", 0),
            expires_at=data.get("expires_at", ""),
            token_id=data.get("token_id")
        )

    def get_export_by_id(self, file_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM export_files WHERE file_id = ?", (file_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    def get_export_file(self, file_id: str) -> Optional[Dict[str, Any]]:
        return self.get_export_by_id(file_id)

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.list_audit_logs(limit)

    def log_simple_audit(self, tool_name: str, caller: str, token_prefix: str, params: Dict[str, Any], status_code: int = 200, error_message: Optional[str] = None):
        import uuid
        status = "EXITO" if status_code == 200 else "ERROR"
        warnings = [error_message] if error_message else []
        self.log_audit(
            entry_id=str(uuid.uuid4()),
            consumer_id=caller,
            consumer_type=token_prefix,
            tool_name=tool_name,
            arguments=params,
            status=status,
            row_count=0,
            duration_ms=0,
            warnings=warnings
        )

storage_service = StorageService()
