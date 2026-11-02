import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  UserCheck,
  QrCode,
  FileText,
  Dumbbell,
  RefreshCw,
  Copy,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Utensils,
  Flame,
  Award,
} from 'lucide-react';
import { useSessionQuery } from '../../../auth/presentation/hooks/useSessionQuery';
import { ssoAuthService } from '../../../../shared/auth/ssoAuthService';
import { socioService } from '../../infrastructure/socio.service';
import type {
  BoletaInscripcionSocio,
  BoletaPagoDetalle,
  PlanEntrenamientoSocio,
  PlanAlimentacionSocio,
  SocioProfile,
} from '../../domain/socio.types';
import '../styles/portal-socio.css';

export const PortalSocioPage: React.FC = () => {
  const { data: session } = useSessionQuery();
  const user = session?.user ?? ssoAuthService.getCurrentUser();

  const [activeTab, setActiveTab] = useState<'perfil' | 'inscripcion' | 'plan'>('perfil');
  const [subTabPlan, setSubTabPlan] = useState<'entrenamiento' | 'nutricion'>('entrenamiento');
  const [selectedDiaIndex, setSelectedDiaIndex] = useState<number>(0);
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  const [perfil, setPerfil] = useState<SocioProfile | null>(null);
  const [inscripcion, setInscripcion] = useState<BoletaInscripcionSocio | null>(null);
  const [pagos, setPagos] = useState<BoletaPagoDetalle[]>([]);
  const [planEntrenamiento, setPlanEntrenamiento] = useState<PlanEntrenamientoSocio | null>(null);
  const [planNutricion, setPlanNutricion] = useState<PlanAlimentacionSocio | null>(null);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrToken, setQrToken] = useState<string>('');
  const [loadingQr, setLoadingQr] = useState<boolean>(false);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Carga inicial de datos de los microservicios
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadData() {
      if (!user) return;
      try {
        const perf = await socioService.getPerfilSocio(user);
        const insc = await socioService.getInscripcionActiva(user.sub);
        const histPagos = await socioService.getHistorialPagos(user.sub);
        const pEnt = await socioService.getPlanEntrenamientoActivo(user.sub);
        const pNut = await socioService.getPlanAlimentacionActivo(user.sub);

        if (isMounted) {
          setPerfil(perf);
          setInscripcion(insc);
          setPagos(histPagos);
          setPlanEntrenamiento(pEnt);
          setPlanNutricion(pNut);
        }

        // Generar QR para torniquete
        const token = await socioService.getPaseDigitalQr(
          insc?.id || 'insc-activa-01',
          user.sub
        );
        if (isMounted) {
          setQrToken(token);
          const dataUrl = await QRCode.toDataURL(token, {
            width: 240,
            margin: 1,
            color: {
              dark: '#162026',
              light: '#ffffff',
            },
          });
          setQrDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('[PortalSocio] Error al cargar portal:', err);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Refrescar QR con timestamp dinámico y firma criptográfica oficial
  const handleRegenerarQr = async () => {
    if (!user) return;
    setLoadingQr(true);
    try {
      const targetInscId = inscripcion?.id || '2289808e-cace-4a77-81e0-64d8221150dc';
      const nuevoToken = await socioService.getPaseDigitalQr(targetInscId, user.sub);
      setQrToken(nuevoToken);
      const dataUrl = await QRCode.toDataURL(nuevoToken, {
        width: 240,
        margin: 1,
        color: {
          dark: '#162026',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Error al generar QR:', err);
    } finally {
      setTimeout(() => setLoadingQr(false), 300);
    }
  };

  const handleCopyToken = () => {
    if (!qrToken) return;
    navigator.clipboard.writeText(qrToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const diaActual = planEntrenamiento?.rutinasProgramadas[selectedDiaIndex];

  return (
    <div className="portal-socio-container">
      {/* Topbar con selector de pestañas principales */}
      <div className="portal-topbar">
        <div className="portal-title-group">
          <h1>
            <UserCheck size={26} color="#6ee7b7" />
            Portal del <span>Socio</span>
          </h1>
          <p>Credencial digital, membresía activa y plan biomecánico asignado</p>
        </div>

        <nav className="portal-tabs-nav" aria-label="Secciones del Socio">
          <button
            type="button"
            className={`portal-tab-btn ${activeTab === 'perfil' ? 'active' : ''}`}
            onClick={() => setActiveTab('perfil')}
          >
            <QrCode size={18} />
            <span>1. Mi Perfil & Pase QR</span>
          </button>

          <button
            type="button"
            className={`portal-tab-btn ${activeTab === 'inscripcion' ? 'active' : ''}`}
            onClick={() => setActiveTab('inscripcion')}
          >
            <FileText size={18} />
            <span>2. Boleta de Inscripción</span>
            {inscripcion && (
              <span className="tab-badge-pill">{inscripcion.estado}</span>
            )}
          </button>

          <button
            type="button"
            className={`portal-tab-btn ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => setActiveTab('plan')}
          >
            <Dumbbell size={18} />
            <span>3. Plan Asignado</span>
          </button>
        </nav>
      </div>

      {/* Viewport scrolleable */}
      <div className="portal-viewport">
        {/* ===================================================================
            PESTAÑA 1: MI PERFIL Y PASE DIGITAL QR
            =================================================================== */}
        {activeTab === 'perfil' && (
          <div className="perfil-grid">
            {/* Carnet VIP Digital */}
            <div className="digital-card-container">
              <div className="card-header-badge">
                <div className="card-brand">
                  APEX <span>PASSE</span>
                </div>
                <div className="card-status-badge">
                  <span className="dot" />
                  <span>{perfil?.estadoMembresia || 'MEMBRESÍA ACTIVA'}</span>
                </div>
              </div>

              {/* QR del pase */}
              <div className="qr-display-box">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Pase Digital QR para Torniquete" />
                ) : (
                  <div style={{ color: '#666', fontSize: '0.8rem' }}>Generando QR...</div>
                )}
              </div>

              <div className="qr-actions-row">
                <button
                  type="button"
                  className="qr-btn"
                  onClick={handleRegenerarQr}
                  disabled={loadingQr}
                  title="Generar nuevo token dinámico de seguridad"
                >
                  <RefreshCw size={14} className={loadingQr ? 'animate-spin' : ''} />
                  <span>{loadingQr ? 'Actualizando...' : 'Refrescar QR'}</span>
                </button>

                <button
                  type="button"
                  className="qr-btn"
                  onClick={handleCopyToken}
                  title="Copiar token criptográfico del pase"
                >
                  <Copy size={14} />
                  <span>{copiedToken ? '¡Copiado!' : 'Copiar Token'}</span>
                </button>
              </div>

              <div className="card-bottom-info">
                <div>
                  <h3 className="card-client-name">
                    {user?.name || user?.email?.split('@')[0] || 'Socio Apex'}
                  </h3>
                  <p className="card-client-code">
                    {perfil?.codigoSocio || user?.codigo || 'SOC-000000'}
                  </p>
                  <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#6ee7b7', fontWeight: 700 }}>
                    <Dumbbell size={13} />
                    <span>{inscripcion?.disciplina?.nombre || 'CrossFit & Funcional'}</span>
                  </div>
                </div>
                <div className="card-nfc-tag">
                  <ShieldCheck size={16} color="#6ee7b7" />
                  <span>Acceso Biométrico</span>
                </div>
              </div>
            </div>

            {/* Ficha Personal y Datos del Perfil */}
            <div className="profile-details-card">
              <h2 className="section-subtitle">
                <UserCheck size={20} color="#6ee7b7" />
                Información del Titular
              </h2>

              <div className="profile-fields-grid">
                <div className="field-item">
                  <span className="field-label">Nombre Completo</span>
                  <span className="field-value">{user?.name || 'Titular Registrado'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Correo Electrónico (SSO)</span>
                  <span className="field-value">{user?.email || 'N/A'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Código de Socio / Matrícula</span>
                  <span className="field-value">
                    <code>{perfil?.codigoSocio || user?.codigo || 'N/A'}</code>
                  </span>
                </div>

                <div className="field-item">
                  <span className="field-label">Cédula de Identidad (CI/RUT)</span>
                  <span className="field-value">{perfil?.ciNumero || '7492103 SC'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Teléfono de Contacto</span>
                  <span className="field-value">{perfil?.telefono || '+591 784-92103'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Contacto de Emergencia</span>
                  <span className="field-value">{perfil?.contactoEmergencia || 'Familia (+591 700-11223)'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Grupo Sanguíneo</span>
                  <span className="field-value">{perfil?.tipoSangre || 'O Rh Positivo'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Sede de Entrenamiento</span>
                  <span className="field-value">{perfil?.sedePrincipal || 'Apex Central'}</span>
                </div>

                <div className="field-item">
                  <span className="field-label">Disciplina Vinculada</span>
                  <span className="field-value" style={{ color: '#6ee7b7' }}>
                    {inscripcion?.disciplina?.nombre || 'CrossFit & Funcional'}
                  </span>
                </div>

                <div className="field-item">
                  <span className="field-label">Horario / Turno</span>
                  <span className="field-value">
                    {inscripcion?.horario
                      ? `${inscripcion.horario.diaSemana} (${inscripcion.horario.horaInicio} - ${inscripcion.horario.horaFin}) • Turno ${inscripcion.horario.turno}`
                      : 'LUN-MIE-VIE (19:30 - 21:00) • Turno NOCHE'}
                  </span>
                </div>
              </div>

              {/* Indicaciones para el torniquete */}
              <div className="turnstile-instructions-box">
                <AlertCircle size={22} className="info-icon" />
                <div>
                  <strong>¿Cómo ingresar al gimnasio con tu pase digital?</strong>
                  <p>
                    Coloca la pantalla de tu teléfono con este código QR a unos 10-15 cm del
                    escáner óptico del torniquete. El sistema validará tu membresía activa y
                    desbloqueará el molinete automáticamente en milisegundos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 2: BOLETA DE INSCRIPCIÓN Y FINANZAS
            =================================================================== */}
        {activeTab === 'inscripcion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Resumen del Contrato / Membresía Activa */}
            <div className="inscripcion-summary-hero">
              <div>
                <div className="plan-title-badge">
                  <h2>{inscripcion?.plan.nombre || 'Plan Apex Rendimiento'}</h2>
                  <span className="matricula-tag">
                    Matrícula: {inscripcion?.codigoMatricula || 'MAT-2025-0042'}
                  </span>
                </div>
                <p style={{ color: '#90ab8b', margin: '0.2rem 0 1rem', fontSize: '0.9rem' }}>
                  Disciplina:{' '}
                  <strong style={{ color: '#ebf4dd' }}>
                    {inscripcion?.disciplina?.nombre || 'Musculación Biomecánica & Acondicionamiento'}
                  </strong>
                </p>

                <div className="plan-specs-row">
                  <div className="spec-chip">
                    <Calendar size={16} color="#6ee7b7" />
                    <span>
                      Vigencia:{' '}
                      <strong>
                        {inscripcion?.fechaInicio} al {inscripcion?.fechaFin}
                      </strong>
                    </span>
                  </div>

                  <div className="spec-chip">
                    <Clock size={16} color="#6ee7b7" />
                    <span>
                      Horario:{' '}
                      <strong>
                        {inscripcion?.horario
                          ? `${inscripcion.horario.diaSemana} (${inscripcion.horario.horaInicio} - ${inscripcion.horario.horaFin})`
                          : 'LUN-MIE-VIE (07:00 - 09:00)'}
                      </strong>
                    </span>
                  </div>

                  <div className="spec-chip">
                    <CreditCard size={16} color="#6ee7b7" />
                    <span>
                      Tipo de Acceso:{' '}
                      <strong>{inscripcion?.plan.tipoAcceso || 'ILIMITADO'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Cluster de Métricas */}
              <div className="metrics-card-cluster">
                <div className="metric-bar-group">
                  <div className="metric-labels">
                    <span>Sesiones Consumidas</span>
                    <strong>
                      {inscripcion?.sesionesConsumidas || 12} / {inscripcion?.totalSesiones || 30}
                    </strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          100,
                          (((inscripcion?.sesionesConsumidas || 12) / (inscripcion?.totalSesiones || 30)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="metric-bar-group">
                  <div className="metric-labels">
                    <span>Vigencia Restante</span>
                    <strong>{inscripcion?.diasRestantes || 14} días</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(100, (((inscripcion?.diasRestantes || 14) / 30) * 100))}%`,
                        background: 'linear-gradient(90deg, #5a7863, #38bdf8)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Pagos y Boletas Emitidas */}
            <div className="section-block">
              <h2 className="section-subtitle">
                <CreditCard size={20} color="#6ee7b7" />
                Historial de Boletas & Comprobantes de Pago
              </h2>

              <div className="table-responsive">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>N° Comprobante</th>
                      <th>Fecha de Pago</th>
                      <th>Método</th>
                      <th>Código Transacción</th>
                      <th>Monto Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#6ee7b7' }}>
                          {p.numeroComprobante}
                        </td>
                        <td>
                          {p.fechaPago
                            ? new Date(p.fechaPago).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '01 feb 2025'}
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{p.metodoPago}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', color: '#90ab8b' }}>
                          {p.codigoTransaccion || 'N/A'}
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          Bs. {p.montoTotal.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge-payment ${p.estado}`}>
                            <CheckCircle2 size={12} />
                            {p.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PESTAÑA 3: PLAN DE IMPLEMENTACIÓN ASIGNADO
            =================================================================== */}
        {activeTab === 'plan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Sub-pestañas: Entrenamiento vs Nutrición */}
            <div className="plan-subtabs">
              <button
                type="button"
                className={`plan-subtab-btn ${subTabPlan === 'entrenamiento' ? 'active' : ''}`}
                onClick={() => setSubTabPlan('entrenamiento')}
              >
                <Dumbbell size={16} />
                <span>Rutinas & Biomecánica ({planEntrenamiento?.rutinasProgramadas.length || 3} días)</span>
              </button>

              <button
                type="button"
                className={`plan-subtab-btn ${subTabPlan === 'nutricion' ? 'active' : ''}`}
                onClick={() => setSubTabPlan('nutricion')}
              >
                <Utensils size={16} />
                <span>Pauta Nutricional & Macros</span>
              </button>
            </div>

            {/* SECCIÓN ENTRENAMIENTO BIOMECÁNICO */}
            {subTabPlan === 'entrenamiento' && planEntrenamiento && (
              <>
                <div className="plan-hero-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <h3>{planEntrenamiento.nombre}</h3>
                      <p style={{ margin: '0.25rem 0', color: '#90ab8b', fontSize: '0.85rem' }}>
                        Objetivo: <strong style={{ color: '#ebf4dd' }}>{planEntrenamiento.objetivo}</strong>
                      </p>
                    </div>
                    <div className="plan-coach-info">
                      <Award size={18} />
                      <span>{planEntrenamiento.instructorNombre || 'Instructor Asignado'}</span>
                    </div>
                  </div>

                  {planEntrenamiento.observacion && (
                    <div style={{ background: 'rgba(22, 32, 38, 0.6)', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', color: '#90ab8b', borderLeft: '3px solid #6ee7b7' }}>
                      <strong>Pauta del Entrenador:</strong> {planEntrenamiento.observacion}
                    </div>
                  )}
                </div>

                {/* Selector de días de la semana */}
                <div className="days-pills-row">
                  {planEntrenamiento.rutinasProgramadas.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`day-pill ${selectedDiaIndex === index ? 'active' : ''}`}
                      onClick={() => setSelectedDiaIndex(index)}
                    >
                      {item.diaSemana}: {item.rutina.nombre}
                    </button>
                  ))}
                </div>

                {/* Rutina del día actual */}
                {diaActual && (
                  <div className="section-block">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h2 className="section-subtitle">
                        <Dumbbell size={20} color="#6ee7b7" />
                        {diaActual.diaSemana} - {diaActual.rutina.nombre}
                      </h2>
                      <span className="tag-mini" style={{ background: 'rgba(110, 231, 183, 0.15)', color: '#6ee7b7' }}>
                        Nivel: {diaActual.rutina.nivel}
                      </span>
                    </div>

                    <div className="ejercicios-list">
                      {diaActual.rutina.rutinaEjercicios.map((re) => {
                        const isDone = !!completedExercises[re.id];
                        return (
                          <div
                            key={re.id}
                            className={`ejercicio-card ${isDone ? 'completed' : ''}`}
                          >
                            <div className="ejercicio-order-badge">{re.orden}</div>

                            <div className="ejercicio-main-info">
                              <h4>{re.ejercicio.nombre}</h4>
                              <div className="ejercicio-tags">
                                {re.ejercicio.patronMovimiento && (
                                  <span className="tag-mini">{re.ejercicio.patronMovimiento}</span>
                                )}
                                {re.ejercicio.equipamiento && (
                                  <span className="tag-mini">{re.ejercicio.equipamiento}</span>
                                )}
                                <span className="tag-mini">{re.ejercicio.nivelDificultad}</span>
                              </div>
                              {re.observacion && (
                                <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#90ab8b', fontStyle: 'italic' }}>
                                  💡 {re.observacion}
                                </p>
                              )}
                            </div>

                            <div className="ejercicio-stats-grid">
                              <div className="stat-box">
                                <span className="val">{re.series}</span>
                                <span className="lbl">Series</span>
                              </div>

                              <div className="stat-box">
                                <span className="val">{re.repeticiones}</span>
                                <span className="lbl">Reps</span>
                              </div>

                              {re.peso !== undefined && (
                                <div className="stat-box">
                                  <span className="val">{re.peso} kg</span>
                                  <span className="lbl">Peso Sug.</span>
                                </div>
                              )}

                              {re.descansoSegundos !== undefined && (
                                <div className="stat-box">
                                  <span className="val">{re.descansoSegundos}s</span>
                                  <span className="lbl">Descanso</span>
                                </div>
                              )}

                              <button
                                type="button"
                                className={`check-complete-btn ${isDone ? 'active' : ''}`}
                                onClick={() => toggleExercise(re.id)}
                                title={isDone ? 'Marcar como pendiente' : 'Marcar ejercicio como completado'}
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* SECCIÓN NUTRICIÓN */}
            {subTabPlan === 'nutricion' && planNutricion && (
              <>
                <div className="plan-hero-card">
                  <h3>{planNutricion.nombre}</h3>
                  <p style={{ margin: '0.2rem 0', color: '#90ab8b', fontSize: '0.85rem' }}>
                    Objetivo: <strong style={{ color: '#ebf4dd' }}>{planNutricion.objetivo}</strong>
                  </p>
                  {planNutricion.observacion && (
                    <div style={{ background: 'rgba(22, 32, 38, 0.6)', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem', color: '#90ab8b', borderLeft: '3px solid #6ee7b7' }}>
                      <strong>Instrucción Dietética:</strong> {planNutricion.observacion}
                    </div>
                  )}
                </div>

                {/* Macro summary boxes */}
                <div className="macros-grid">
                  <div className="macro-box">
                    <span className="macro-number">2,400</span>
                    <span className="macro-name">Calorías Diarias (kcal)</span>
                  </div>
                  <div className="macro-box">
                    <span className="macro-number" style={{ color: '#38bdf8' }}>165g</span>
                    <span className="macro-name">Proteínas (g)</span>
                  </div>
                  <div className="macro-box">
                    <span className="macro-number" style={{ color: '#fbbf24' }}>260g</span>
                    <span className="macro-name">Carbohidratos (g)</span>
                  </div>
                  <div className="macro-box">
                    <span className="macro-number" style={{ color: '#f87171' }}>65g</span>
                    <span className="macro-name">Grasas Saludables (g)</span>
                  </div>
                </div>

                {/* Horario de comidas */}
                <div className="section-block">
                  <h2 className="section-subtitle">
                    <Flame size={20} color="#6ee7b7" />
                    Distribución de Comidas
                  </h2>

                  <div className="comidas-timeline">
                    {planNutricion.comidas.map((comida) => (
                      <div key={comida.id} className="comida-card">
                        <div className="comida-time">
                          {comida.hora || '08:00'}
                        </div>

                        <div className="comida-info">
                          <h5>{comida.tipoComida}</h5>
                          <p>
                            <strong style={{ color: '#ebf4dd' }}>{comida.alimento}</strong> ({comida.unidad})
                          </p>
                          {comida.observacion && (
                            <p style={{ fontStyle: 'italic', color: '#90ab8b', marginTop: '0.2rem' }}>
                              Nota: {comida.observacion}
                            </p>
                          )}
                        </div>

                        <div className="comida-cals">
                          <div>{comida.calorias || 500} kcal</div>
                          <span style={{ fontSize: '0.75rem', color: '#90ab8b' }}>
                            P: {comida.proteinas}g | C: {comida.carbohidratos}g | G: {comida.grasas}g
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
