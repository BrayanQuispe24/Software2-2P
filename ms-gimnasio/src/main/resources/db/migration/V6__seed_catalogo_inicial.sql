-- V6: Datos Semilla Iniciales para Catálogo de Gimnasio

-- 1. Tipos de Documentos (prefijo b1)
INSERT INTO tipo_documentos (id, codigo, nombre, descripcion, obligatorio, activo) VALUES
('b1000000-0000-0000-0000-000000000001', 'DOC-CI', 'Cédula de Identidad', 'Fotocopia o escaneo anverso y reverso del documento de identidad', TRUE, TRUE),
('b1000000-0000-0000-0000-000000000002', 'DOC-MED', 'Certificado Médico de Aptitud Física', 'Certificado emitido por médico avalando aptitud cardiovascular', TRUE, TRUE),
('b1000000-0000-0000-0000-000000000003', 'DOC-RESP', 'Deslinde de Responsabilidad', 'Formulario firmado de aceptación de normas y deslinde de riesgo deportivo', FALSE, TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Disciplinas (prefijo d1)
INSERT INTO disciplinas (id, codigo, nombre, descripcion, capacidad_maxima, color_hex, activo) VALUES
('d1000000-0000-0000-0000-000000000001', 'DISC-MUSC', 'Musculación y Fuerza', 'Entrenamiento con máquinas guiadas, pesas libres y poleas', 50, '#3B82F6', TRUE),
('d1000000-0000-0000-0000-000000000002', 'DISC-SPIN', 'Spinning / Indoor Cycling', 'Sesiones intensas de pedaleo cardiovascular guiadas con música', 25, '#10B981', TRUE),
('d1000000-0000-0000-0000-000000000003', 'DISC-CROSS', 'CrossFit & Funcional', 'Entrenamiento de alta intensidad funcional WOD', 20, '#F59E0B', TRUE),
('d1000000-0000-0000-0000-000000000004', 'DISC-YOGA', 'Yoga & Flexibilidad', 'Posturas, respiración consciente, equilibrio y estiramiento', 15, '#8B5CF6', TRUE),
('d1000000-0000-0000-0000-000000000005', 'DISC-BOX', 'Boxeo & Kickboxing', 'Fundamentos técnicos de combate, golpeo en saco y acondicionamiento', 18, '#EF4444', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- 3. Horarios (prefijo c1 en vez de h1)
INSERT INTO horarios (id, dia_semana, hora_inicio, hora_fin, turno, capacidad_aforo, activo) VALUES
('c1000000-0000-0000-0000-000000000001', 'LUN-MIE-VIE', '06:00:00', '07:30:00', 'MAÑANA', 30, TRUE),
('c1000000-0000-0000-0000-000000000002', 'LUN-MIE-VIE', '08:00:00', '09:30:00', 'MAÑANA', 30, TRUE),
('c1000000-0000-0000-0000-000000000003', 'LUN-MIE-VIE', '18:00:00', '19:30:00', 'TARDE', 35, TRUE),
('c1000000-0000-0000-0000-000000000004', 'LUN-MIE-VIE', '19:30:00', '21:00:00', 'NOCHE', 40, TRUE),
('c1000000-0000-0000-0000-000000000005', 'MAR-JUE-SAB', '07:00:00', '08:30:00', 'MAÑANA', 25, TRUE),
('c1000000-0000-0000-0000-000000000006', 'MAR-JUE-SAB', '18:30:00', '20:00:00', 'NOCHE', 30, TRUE)
ON CONFLICT DO NOTHING;

-- 4. Asociaciones Disciplina - Horario (prefijo a1)
INSERT INTO disciplina_horario (id, disciplina_id, horario_id, cupo_disponible, activo) VALUES
('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 30, TRUE),
('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 35, TRUE),
('a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', 25, TRUE),
('a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000004', 20, TRUE)
ON CONFLICT (disciplina_id, horario_id) DO NOTHING;

-- 5. Planes (prefijo e1 en vez de p1)
INSERT INTO planes (id, codigo, nombre, descripcion, duracion_dias, sesiones_totales, tipo_acceso, activo) VALUES
('e1000000-0000-0000-0000-000000000001', 'PLAN-MENS-LIBRE', 'Plan Mensual Libre', 'Acceso ilimitado a todas las instalaciones de musculación durante 30 días', 30, NULL, 'ILIMITADO', TRUE),
('e1000000-0000-0000-0000-000000000002', 'PLAN-TRIM-PRO', 'Plan Trimestral Pro', 'Acceso total durante 90 días con evaluación antropométrica incluida', 90, NULL, 'ILIMITADO', TRUE),
('e1000000-0000-0000-0000-000000000003', 'PLAN-ANUAL-VIP', 'Plan Anual Black VIP', 'Acceso ilimitado a todas las disciplinas, lockers privados y 2 pases de invitado por mes', 365, NULL, 'ILIMITADO', TRUE),
('e1000000-0000-0000-0000-000000000004', 'PLAN-12-SESIONES', 'Paquete 12 Sesiones', 'Boleto para 12 clases a consumir en un plazo máximo de 45 días', 45, 12, 'SESIONES', TRUE)
ON CONFLICT (codigo) DO NOTHING;

-- 6. Tarifas (prefijo f1 en vez de t1)
INSERT INTO tarifas (id, plan_id, nombre, monto, moneda, matricula_inscripcion, fecha_inicio, activa) VALUES
('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Tarifa Estándar Mensual', 250.00, 'BOB', 30.00, CURRENT_DATE, TRUE),
('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'Tarifa Trimestral con 15% Descuento', 635.00, 'BOB', 0.00, CURRENT_DATE, TRUE),
('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000003', 'Tarifa VIP Anualizada', 2200.00, 'BOB', 0.00, CURRENT_DATE, TRUE),
('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000004', 'Tarifa Ticketera 12 Clases', 200.00, 'BOB', 20.00, CURRENT_DATE, TRUE)
ON CONFLICT DO NOTHING;
