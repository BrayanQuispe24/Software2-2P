-- V7: Agregar disciplina_id a boleta_inscripcion para selección explícita de disciplina al inscribirse
ALTER TABLE boleta_inscripcion ADD COLUMN IF NOT EXISTS disciplina_id UUID REFERENCES disciplinas(id);
CREATE INDEX IF NOT EXISTS idx_inscripcion_disciplina ON boleta_inscripcion(disciplina_id);

-- Actualizar inscripciones existentes para que hereden disciplina_id de disciplina_horario si lo tienen
UPDATE boleta_inscripcion bi
SET disciplina_id = dh.disciplina_id
FROM disciplina_horario dh
WHERE bi.disciplina_horario_id = dh.id AND bi.disciplina_id IS NULL;
