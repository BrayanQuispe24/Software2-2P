import json
import logging


def parse_json_object(value):
    """Read persisted JSON objects without breaking an entire dashboard response."""
    if isinstance(value, dict):
        return value
    try:
        parsed = json.loads(value or "{}")
    except (TypeError, ValueError):
        logging.getLogger("ms-agentes.json").warning("JSON inválido en datos persistidos")
        return {}
    return parsed if isinstance(parsed, dict) else {}
