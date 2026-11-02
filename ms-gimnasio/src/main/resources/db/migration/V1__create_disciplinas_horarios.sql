CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Disciplinas
CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    capacidad_maxima INT NOT NULL DEFAULT 20,
    color_hex VARCHAR(10) DEFAULT '#3B82F6',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disciplinas_activo ON disciplinas(activo);

-- 2. Tabla de Horarios
CREATE TABLE IF NOT EXISTS horarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    turno VARCHAR(20) NOT NULL,
    capacidad_aforo INT NOT NULL DEFAULT 30,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_horarios_dia_turno ON horarios(dia_semana, turno);

-- 3. Tabla Intermedia Disciplina - Horario
CREATE TABLE IF NOT EXISTS disciplina_horario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    horario_id UUID NOT NULL REFERENCES horarios(id) ON DELETE CASCADE,
    instructor_id UUID,
    cupo_disponible INT NOT NULL DEFAULT 20,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_disciplina_horario UNIQUE (disciplina_id, horario_id)
);

CREATE INDEX idx_dh_disciplina ON disciplina_horario(disciplina_id);
CREATE INDEX idx_dh_horario ON disciplina_horario(horario_id);
