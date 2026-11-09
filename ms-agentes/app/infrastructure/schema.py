from sqlalchemy import inspect, text

def ensure_schema(engine, metadata):
    """Additive upgrades; never replace existing data."""
    metadata.create_all(engine)
    additions = {
        "reglas_monitoreo": {"horario_inicio": "VARCHAR(5)", "horario_fin": "VARCHAR(5)", "anomalia_desde": "TIMESTAMP"},
        "alertas": {"ultima_notificacion_at": "TIMESTAMP"},
    }
    with engine.begin() as conn:
        for table, columns in additions.items():
            current = {c["name"] for c in inspect(conn).get_columns(table)}
            for column, sql_type in columns.items():
                if column not in current:
                    conn.execute(text(f'ALTER TABLE "{table}" ADD COLUMN "{column}" {sql_type}'))
