-- 11. Tabla Registro Entrada y Salida (Control de Acceso / Torniquete)
CREATE TABLE IF NOT EXISTS registro_entrada_salida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    boleta_inscripcion_id UUID REFERENCES boleta_inscripcion(id),
    tipo_movimiento VARCHAR(10) NOT NULL,
    estado_acceso VARCHAR(20) NOT NULL,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispositivo_torniquete VARCHAR(50) DEFAULT 'TORNIQUETE-01',
    motivo_denegacion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_acceso_cliente ON registro_entrada_salida(cliente_id);
CREATE INDEX idx_acceso_fecha ON registro_entrada_salida(fecha_hora DESC);
CREATE INDEX idx_acceso_estado ON registro_entrada_salida(estado_acceso);
