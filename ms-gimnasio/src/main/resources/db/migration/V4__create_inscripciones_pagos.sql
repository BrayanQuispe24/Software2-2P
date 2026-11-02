-- 9. Tabla Boleta de Inscripción
CREATE TABLE IF NOT EXISTS boleta_inscripcion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_matricula VARCHAR(30) NOT NULL UNIQUE,
    cliente_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES planes(id),
    disciplina_horario_id UUID REFERENCES disciplina_horario(id),
    formulario_solicitud_id UUID REFERENCES formulario_solicitud(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    total_sesiones INT,
    sesiones_consumidas INT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL DEFAULT 'ACTIVA',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inscripcion_cliente ON boleta_inscripcion(cliente_id);
CREATE INDEX idx_inscripcion_estado_fechas ON boleta_inscripcion(estado, fecha_inicio, fecha_fin);

-- 10. Tabla Boleta de Pago
CREATE TABLE IF NOT EXISTS boleta_pago (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boleta_inscripcion_id UUID NOT NULL REFERENCES boleta_inscripcion(id) ON DELETE CASCADE,
    tarifa_id UUID NOT NULL REFERENCES tarifas(id),
    numero_comprobante VARCHAR(50) NOT NULL UNIQUE,
    monto_subtotal NUMERIC(10, 2) NOT NULL,
    monto_descuento NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monto_total NUMERIC(10, 2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    codigo_transaccion_externa VARCHAR(100),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    comprobante_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pago_inscripcion ON boleta_pago(boleta_inscripcion_id);
CREATE INDEX idx_pago_estado ON boleta_pago(estado);
CREATE INDEX idx_pago_numero ON boleta_pago(numero_comprobante);
