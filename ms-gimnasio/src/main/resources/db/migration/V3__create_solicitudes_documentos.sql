-- 6. Tabla de Tipo de Documentos
CREATE TABLE IF NOT EXISTS tipo_documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla Formulario de Solicitud de Inscripción
CREATE TABLE IF NOT EXISTS formulario_solicitud (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_solicitud VARCHAR(30) NOT NULL UNIQUE,
    cliente_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES planes(id),
    disciplina_id UUID REFERENCES disciplinas(id),
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    motivo_rechazo TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_solicitud_cliente ON formulario_solicitud(cliente_id);
CREATE INDEX idx_solicitud_estado ON formulario_solicitud(estado);

-- 8. Tabla Documentos Adjuntos
CREATE TABLE IF NOT EXISTS documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formulario_solicitud_id UUID NOT NULL REFERENCES formulario_solicitud(id) ON DELETE CASCADE,
    tipo_documento_id UUID NOT NULL REFERENCES tipo_documentos(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    url_archivo VARCHAR(500) NOT NULL,
    estado_validacion VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    observaciones TEXT,
    fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documentos_solicitud ON documentos(formulario_solicitud_id);
