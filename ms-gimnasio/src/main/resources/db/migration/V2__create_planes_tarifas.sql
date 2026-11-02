-- 4. Tabla de Planes
CREATE TABLE IF NOT EXISTS planes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    duracion_dias INT NOT NULL DEFAULT 30,
    sesiones_totales INT,
    tipo_acceso VARCHAR(30) NOT NULL DEFAULT 'ILIMITADO',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_planes_activo ON planes(activo);

-- 5. Tabla de Tarifas
CREATE TABLE IF NOT EXISTS tarifas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID NOT NULL REFERENCES planes(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    monto NUMERIC(10, 2) NOT NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'BOB',
    matricula_inscripcion NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tarifas_plan ON tarifas(plan_id);
CREATE INDEX idx_tarifas_activa ON tarifas(activa);
