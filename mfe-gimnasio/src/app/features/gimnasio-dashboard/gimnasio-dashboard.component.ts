import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import {
  CATALOGO_REPOSITORY,
  INSCRIPCION_REPOSITORY,
  PAGO_REPOSITORY,
  CONTROL_ACCESO_REPOSITORY,
  CLIENTE_REPOSITORY,
} from '../../core/tokens/injection-tokens';

// Casos de uso de Catálogo
import { ListarDisciplinasUseCase } from '../catalogo/application/use-cases/listar-disciplinas.use-case';
import { ListarPlanesUseCase } from '../catalogo/application/use-cases/listar-planes.use-case';
import { CrearDisciplinaUseCase } from '../catalogo/application/use-cases/crear-disciplina.use-case';
import { CrearPlanUseCase } from '../catalogo/application/use-cases/crear-plan.use-case';
import { ActualizarPlanUseCase, EliminarPlanUseCase } from '../catalogo/application/use-cases/gestionar-plan.use-case';
import { CrearTarifaUseCase, ActualizarTarifaUseCase, EliminarTarifaUseCase } from '../catalogo/application/use-cases/gestionar-tarifa.use-case';
import {
  ActualizarDisciplinaUseCase,
  EliminarDisciplinaUseCase,
  ActualizarAforoDisciplinaUseCase,
  ActualizarCupoHorarioUseCase,
  CrearHorarioUseCase,
  ActualizarHorarioUseCase,
  AsignarDisciplinaHorarioUseCase,
  EliminarDisciplinaHorarioUseCase,
} from '../catalogo/application/use-cases/gestionar-disciplina-aforo.use-case';
import { Disciplina, DisciplinaHorario, Horario } from '../catalogo/domain/models/disciplina.model';
import { Plan, Tarifa } from '../catalogo/domain/models/plan.model';

// Casos de uso de Clientes / Socios
import { ListarClientesUseCase } from '../clientes/application/use-cases/listar-clientes.use-case';
import { Cliente } from '../clientes/domain/models/cliente.model';

// Casos de uso de Inscripciones y Pagos
import { ListarInscripcionesUseCase } from '../inscripciones/application/use-cases/listar-inscripciones.use-case';
import { ProcesarInscripcionUseCase } from '../inscripciones/application/use-cases/procesar-inscripcion.use-case';
import { CongelarInscripcionUseCase } from '../inscripciones/application/use-cases/congelar-inscripcion.use-case';
import { ConfirmarPagoUseCase } from '../inscripciones/application/use-cases/confirmar-pago.use-case';
import { BoletaInscripcion, BoletaPago } from '../inscripciones/domain/models/inscripcion.model';
import { EstadoInscripcion, MetodoPago, EstadoPago } from '../inscripciones/domain/enums/inscripcion.enums';

// Casos de uso de Control de Acceso
import { ValidarAccesoTorniqueteUseCase } from '../control-acceso/application/use-cases/validar-acceso-torniquete.use-case';
import { ValidarAccesoQrUseCase } from '../control-acceso/application/use-cases/validar-acceso-qr.use-case';
import { ObtenerQrPaseDigitalUseCase } from '../control-acceso/application/use-cases/obtener-qr-pase-digital.use-case';
import { QrRendererService } from '../control-acceso/application/services/qr-renderer.service';
import { ListarAuditoriaAccesosUseCase } from '../control-acceso/application/use-cases/listar-auditoria-accesos.use-case';
import { RegistroAcceso, ValidacionAccesoResult } from '../control-acceso/domain/models/acceso.model';
import { TipoMovimientoAcceso, EstadoAcceso } from '../control-acceso/domain/enums/acceso.enums';

@Component({
  selector: 'app-gimnasio-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gimnasio-dashboard.component.html',
  styleUrls: ['./gimnasio-dashboard.component.css'],
})
export class GimnasioDashboardComponent implements OnInit, OnDestroy {
  // Inyección de dependencias de puertos (Clean Architecture)
  private readonly catalogoRepo = inject(CATALOGO_REPOSITORY);
  private readonly inscripcionRepo = inject(INSCRIPCION_REPOSITORY);
  private readonly pagoRepo = inject(PAGO_REPOSITORY);
  private readonly controlAccesoRepo = inject(CONTROL_ACCESO_REPOSITORY);
  private readonly clienteRepo = inject(CLIENTE_REPOSITORY);
  private readonly validarAccesoQrUC = inject(ValidarAccesoQrUseCase);
  private readonly obtenerQrPaseDigitalUC = inject(ObtenerQrPaseDigitalUseCase);
  private readonly qrRendererService = inject(QrRendererService);
  private readonly sanitizer = inject(DomSanitizer);

  // Instanciación de Casos de Uso
  private readonly listarDisciplinasUC = new ListarDisciplinasUseCase(this.catalogoRepo);
  private readonly listarPlanesUC = new ListarPlanesUseCase(this.catalogoRepo);
  private readonly crearDisciplinaUC = new CrearDisciplinaUseCase(this.catalogoRepo);
  private readonly actualizarDisciplinaUC = new ActualizarDisciplinaUseCase(this.catalogoRepo);
  private readonly eliminarDisciplinaUC = new EliminarDisciplinaUseCase(this.catalogoRepo);
  private readonly actualizarAforoDisciplinaUC = new ActualizarAforoDisciplinaUseCase(this.catalogoRepo);
  private readonly actualizarCupoHorarioUC = new ActualizarCupoHorarioUseCase(this.catalogoRepo);
  private readonly crearHorarioUC = new CrearHorarioUseCase(this.catalogoRepo);
  private readonly actualizarHorarioUC = new ActualizarHorarioUseCase(this.catalogoRepo);
  private readonly asignarDisciplinaHorarioUC = new AsignarDisciplinaHorarioUseCase(this.catalogoRepo);
  private readonly eliminarDisciplinaHorarioUC = new EliminarDisciplinaHorarioUseCase(this.catalogoRepo);

  private readonly crearPlanUC = new CrearPlanUseCase(this.catalogoRepo);
  private readonly actualizarPlanUC = new ActualizarPlanUseCase(this.catalogoRepo);
  private readonly eliminarPlanUC = new EliminarPlanUseCase(this.catalogoRepo);

  private readonly crearTarifaUC = new CrearTarifaUseCase(this.catalogoRepo);
  private readonly actualizarTarifaUC = new ActualizarTarifaUseCase(this.catalogoRepo);
  private readonly eliminarTarifaUC = new EliminarTarifaUseCase(this.catalogoRepo);

  private readonly listarClientesUC = new ListarClientesUseCase(this.clienteRepo);

  private readonly listarInscripcionesUC = new ListarInscripcionesUseCase(this.inscripcionRepo);
  private readonly procesarInscripcionUC = new ProcesarInscripcionUseCase(this.inscripcionRepo);
  private readonly congelarInscripcionUC = new CongelarInscripcionUseCase(this.inscripcionRepo);
  private readonly confirmarPagoUC = new ConfirmarPagoUseCase(this.pagoRepo);

  private readonly validarAccesoUC = new ValidarAccesoTorniqueteUseCase(this.controlAccesoRepo);
  private readonly listarAuditoriaUC = new ListarAuditoriaAccesosUseCase(this.controlAccesoRepo);

  // Control de Roles y Permisos (SSO)
  userRole = signal<string>('ADMINISTRADOR');
  esRecepcionista = computed(() => this.userRole() === 'RECEPCIONISTA');
  puedeEditarCatalogo = computed(() => this.userRole() !== 'RECEPCIONISTA');

  // Signals de control y estado
  activeTab = signal<'inscripciones' | 'pagos' | 'planes' | 'disciplinas' | 'torniquete'>('inscripciones');
  subTabTorniquete = signal<'consola' | 'auditoria' | 'dividida'>('consola');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Colecciones de dominio
  inscripciones = signal<BoletaInscripcion[]>([]);
  planes = signal<Plan[]>([]);
  disciplinas = signal<Disciplina[]>([]);
  accesos = signal<RegistroAcceso[]>([]);
  clientes = signal<Cliente[]>([]);

  // Modales Principales
  showInscripcionModal = signal<boolean>(false);
  showPagoModal = signal<boolean>(false);
  showCrearPlanModal = signal<boolean>(false);
  showCrearDisciplinaModal = signal<boolean>(false);

  // Modales de Edición, Aforo y Eliminación
  showEditarPlanModal = signal<boolean>(false);
  showEditarTarifaModal = signal<boolean>(false);
  showEditarDisciplinaModal = signal<boolean>(false);
  showAjustarAforoModal = signal<boolean>(false);
  showConfirmarEliminarModal = signal<boolean>(false);

  // Modelos de Formulario de Edición
  editarPlanForm = {
    id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    duracionDias: 30,
    sesionesTotales: null as number | null,
    tipoAcceso: 'ILIMITADO',
    activo: true,
  };

  editarTarifaForm = {
    id: '',
    planId: '',
    planNombre: '',
    nombre: '',
    monto: 250,
    moneda: 'BOB',
    matriculaInscripcion: 0,
    esNueva: false,
  };

  editarDisciplinaForm = {
    id: '',
    codigo: '',
    nombre: '',
    descripcion: '',
    capacidadMaxima: 25,
    colorHex: '#3B82F6',
    activo: true,
  };

  ajustarAforoForm = {
    disciplinaId: '',
    disciplinaNombre: '',
    capacidadMaxima: 25,
    horarios: [] as Array<{
      id: string;
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      turno: string;
      cupoDisponible: number;
    }>,
  };

  eliminarTarget = {
    tipo: '' as 'plan' | 'disciplina' | 'tarifa',
    id: '',
    nombre: '',
    detalle: '',
  };

  // Modo manual de emergencia para cliente (cuando se desea tipear UUID directo)
  modoManualCliente = signal<boolean>(false);

  // Boleta seleccionada para confirmar pago
  selectedBoletaPago = signal<BoletaPago | null>(null);

  // Método de pago para confirmar boleta existente
  metodoPagoConfirmacion = signal<MetodoPago>(MetodoPago.EFECTIVO);

  // Modelo de formulario: Nueva Inscripción
  nuevaInscripcion = {
    clienteId: '',
    planId: '',
    tarifaId: '',
    disciplinaId: '',
    disciplinaHorarioId: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    metodoPago: MetodoPago.EFECTIVO,
    codigoTransaccionExterna: '',
  };

  // Modelo de formulario: Confirmar Pago
  confirmarPagoForm = {
    boletaPagoId: '',
    codigoTransaccionExterna: '',
  };

  // Estado del Patrón Estrategia de Pagos
  pagoEstrategia = {
    // 1. Modo Efectivo: Solo requiere ingresar el monto recibido y calcula el cambio
    montoRecibido: null as number | null,

    // 2. Modo QR: Requiere subir un comprobante de transferencia / QR
    comprobanteUrl: '',
    comprobanteNombre: '',
    comprobantePreview: null as string | null,
    codigoTransaccionQr: '',

    // 3. Modo Tarjeta: Pasarela Stripe
    numeroTarjeta: '',
    expiracionMes: '12',
    expiracionAnio: '2028',
    cvc: '',
    titular: '',
    stripeCargando: false,
    stripeTokenSimulado: '',
  };

  // Modelo de formulario: Crear Disciplina
  nuevaDisciplina = {
    codigo: '',
    nombre: '',
    descripcion: '',
    capacidadMaxima: 25,
    colorHex: '#3B82F6',
  };

  // Gestión de Horarios y Turnos de Disciplinas
  showGestionHorariosModal = signal<boolean>(false);
  disciplinaSeleccionadaHorarios = signal<Disciplina | null>(null);

  nuevoHorarioDisciplinaForm = {
    diaSemana: 'LUN-MIE-VIE',
    horaInicio: '08:00',
    horaFin: '09:30',
    turno: 'MAÑANA',
    cupoDisponible: 25,
  };

  horarioEnEdicionId = signal<string | null>(null);
  editarHorarioForm = {
    horarioId: '',
    disciplinaHorarioId: '',
    diaSemana: '',
    horaInicio: '',
    horaFin: '',
    turno: '',
    capacidadAforo: 25,
    cupoDisponible: 25,
  };

  // Modelo de formulario: Crear Plan
  nuevoPlan = {
    codigo: '',
    nombre: '',
    descripcion: '',
    duracionDias: 30,
    sesionesTotales: null as number | null,
    tipoAcceso: 'ILIMITADO',
    precioTarifa: 250,
  };

  // Simulador de Torniquete y Escáner QR
  modoTorniquete = signal<'qr' | 'manual'>('qr');
  camaraActiva = signal<boolean>(false);
  camaraError = signal<string | null>(null);
  dispositivosCamara = signal<Array<{ id: string; label: string }>>([]);
  camaraSeleccionadaId = signal<string>('');
  private html5QrCode: Html5Qrcode | null = null;
  private escaneoEnPausa = false;
  private jsQrFrameTimer: any = null;

  // Notificaciones Dinámicas de Escaneo QR (valido, invalido, analizando, no_analizable)
  qrNotificacionEstado = signal<'idle' | 'analizando' | 'valido' | 'invalido' | 'no_analizable'>('idle');
  qrNotificacionTitulo = signal<string>('Esperando código QR frente a la cámara...');
  qrNotificacionDetalle = signal<string | null>(null);
  codigoQrManual = '';
  private qrFeedbackTimer: any = null;

  // Modal Pase Digital QR
  showPaseQrModal = signal<boolean>(false);
  paseQrInscripcion = signal<BoletaInscripcion | null>(null);
  paseQrSvg = signal<SafeHtml | null>(null);
  paseQrCargando = signal<boolean>(false);
  paseQrError = signal<string | null>(null);

  torniqueteForm = {
    clienteId: '',
    dispositivoTorniquete: 'TORNIQUETE-ACCESO-PRINCIPAL',
    tipoMovimiento: 'AUTO' as ('AUTO' | TipoMovimientoAcceso),
  };
  torniqueteResult = signal<ValidacionAccesoResult | null>(null);

  alternarTipoMovimiento(): void {
    if (this.torniqueteForm.tipoMovimiento === 'AUTO' || this.torniqueteForm.tipoMovimiento === TipoMovimientoAcceso.ENTRADA) {
      this.torniqueteForm.tipoMovimiento = TipoMovimientoAcceso.SALIDA;
    } else {
      this.torniqueteForm.tipoMovimiento = TipoMovimientoAcceso.ENTRADA;
    }
  }

  /**
   * Determina de forma inteligente el siguiente movimiento del socio analizando su historial:
   * Si su último acceso permitido fue ENTRADA (está adentro), le corresponde SALIDA.
   * Si su último acceso permitido fue SALIDA (o no ha entrado hoy), le corresponde ENTRADA.
   */
  determinarProximoMovimientoSocio(clienteId?: string, inscripcionId?: string): TipoMovimientoAcceso {
    if (!clienteId && !inscripcionId) return TipoMovimientoAcceso.ENTRADA;
    const cid = clienteId ? clienteId.trim().toLowerCase() : null;
    const iid = inscripcionId ? inscripcionId.trim().toLowerCase() : null;
    const ultimoPermitido = this.accesos().find((a) => {
      const matchCli = cid && a.clienteId && a.clienteId.toLowerCase() === cid;
      const matchIns = iid && (a as any).boletaInscripcionId && (a as any).boletaInscripcionId.toLowerCase() === iid;
      const esPermitido = a.estadoAcceso === EstadoAcceso.PERMITIDO || (a.estadoAcceso as any) === 'PERMITIDO';
      return (matchCli || matchIns) && esPermitido;
    });
    if (!ultimoPermitido) {
      return TipoMovimientoAcceso.ENTRADA;
    }
    return ultimoPermitido.tipoMovimiento === TipoMovimientoAcceso.ENTRADA
      ? TipoMovimientoAcceso.SALIDA
      : TipoMovimientoAcceso.ENTRADA;
  }

  // Modal de Verificación de Boleta de Inscripción y Estado de Habilitación
  showModalVerificacionQr = signal<boolean>(false);
  verificacionQrData = signal<{
    resultado: ValidacionAccesoResult;
    inscripcion: BoletaInscripcion | null;
    cliente: Cliente | null;
    qrPayloadDecoded: any;
    tipoMovimiento: TipoMovimientoAcceso;
    rawPayload: string;
  } | null>(null);

  cerrarModalVerificacionQr(): void {
    this.showModalVerificacionQr.set(false);
    this.verificacionQrData.set(null);
  }

  formatearFechaQr(exp: any): string {
    if (!exp) return 'N/A';
    if (Array.isArray(exp) && exp.length >= 3) {
      const year = exp[0];
      const month = String(exp[1]).padStart(2, '0');
      const day = String(exp[2]).padStart(2, '0');
      return `${day}/${month}/${year}`;
    }
    return String(exp);
  }

  async cambiarMovimientoYReintentar(nuevoMovimiento: TipoMovimientoAcceso | 'ENTRADA' | 'SALIDA'): Promise<void> {
    const data = this.verificacionQrData();
    this.torniqueteForm.tipoMovimiento = nuevoMovimiento as TipoMovimientoAcceso;
    this.cerrarModalVerificacionQr();
    if (data?.rawPayload) {
      this.escaneoEnPausa = false;
      await this.procesarQrEscaneado(data.rawPayload);
    }
  }

  ngOnInit(): void {
    const queryRole = new URLSearchParams(window.location.search).get('role');
    if (queryRole) {
      this.userRole.set(queryRole.toUpperCase());
    }

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'SSO_USER_INFO' && event.data.role) {
        this.userRole.set(String(event.data.role).toUpperCase());
      }
    });

    this.cargarDatosIniciales();
  }

  async cargarDatosIniciales(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [ins, pls, discs, logs, cls] = await Promise.all([
        this.listarInscripcionesUC.execute(),
        this.listarPlanesUC.execute(),
        this.listarDisciplinasUC.execute(),
        this.listarAuditoriaUC.execute(undefined, 25),
        this.listarClientesUC.execute(),
      ]);
      this.inscripciones.set(ins);
      this.planes.set(pls);
      this.disciplinas.set(discs);
      this.accesos.set(logs);
      this.clientes.set(cls);

      // Preseleccionar primer cliente en formularios si está disponible
      if (cls.length > 0) {
        if (!this.nuevaInscripcion.clienteId) {
          this.nuevaInscripcion.clienteId = cls[0].id;
        }
        if (!this.torniqueteForm.clienteId) {
          this.torniqueteForm.clienteId = cls[0].id;
        }
      } else if (ins.length > 0 && !this.torniqueteForm.clienteId) {
        this.torniqueteForm.clienteId = ins[0].clienteId;
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al conectar con el microservicio MS2');
    } finally {
      this.isLoading.set(false);
    }
  }

  setActiveTab(tab: 'inscripciones' | 'pagos' | 'planes' | 'disciplinas' | 'torniquete'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  // Flujo: Nueva Inscripción
  // Flujo: Nueva Inscripción
  abrirModalInscripcion(): void {
    if (this.planes().length > 0) {
      this.nuevaInscripcion.planId = this.planes()[0].id;
      this.onPlanSeleccionado();
    }
    if (this.disciplinas().length > 0 && !this.nuevaInscripcion.disciplinaId) {
      this.nuevaInscripcion.disciplinaId = this.disciplinas()[0].id;
      this.onDisciplinaSeleccionada();
    }
    if (this.clientes().length > 0 && !this.nuevaInscripcion.clienteId) {
      this.nuevaInscripcion.clienteId = this.clientes()[0].id;
    }
    this.modoManualCliente.set(false);
    this.resetPagoEstrategia();
    // Sugerir el importe exacto para efectivo por defecto
    const total = this.getMontoTotalInscripcion();
    this.pagoEstrategia.montoRecibido = total;
    this.showInscripcionModal.set(true);
  }

  toggleModoManualCliente(): void {
    this.modoManualCliente.update((val) => !val);
  }

  /**
   * Resuelve el nombre formateado del socio a partir de su ID para visualizarlo en tablas y tarjetas.
   */
  obtenerNombreCliente(clienteId: string): string {
    if (!clienteId) return 'Socio no especificado';
    const socio = this.clientes().find((c) => c.id === clienteId);
    if (socio) {
      return `${socio.nombre} ${socio.apellido} (${socio.codigo || socio.ci})`;
    }
    // Si no está en catálogo o es UUID de prueba
    if (clienteId.length > 18) {
      return `Socio: ${clienteId.substring(0, 8)}...${clienteId.substring(clienteId.length - 4)}`;
    }
    return clienteId;
  }

  /**
   * Resuelve el nombre del plan a partir de su ID para visualizarlo en credenciales y tarjetas.
   */
  obtenerNombrePlan(planId?: string): string {
    if (!planId) return 'Plan Estándar';
    const plan = this.planes().find((p) => p.id === planId);
    return plan ? plan.nombre : 'Plan de Acceso';
  }

  /**
   * Resuelve el nombre de la disciplina a partir de su ID o relación.
   */
  obtenerNombreDisciplina(disciplinaId?: string): string {
    if (!disciplinaId) return 'Musculación General / Libre';
    const disc = this.disciplinas().find((d) => d.id === disciplinaId);
    return disc ? disc.nombre : 'Disciplina Asignada';
  }

  onPlanSeleccionado(): void {
    const plan = this.planes().find((p) => p.id === this.nuevaInscripcion.planId);
    if (plan && plan.tarifas && plan.tarifas.length > 0) {
      this.nuevaInscripcion.tarifaId = plan.tarifas[0].id;
    } else {
      this.nuevaInscripcion.tarifaId = '';
    }
    // Actualizar monto recibido sugerido si está en efectivo
    if (this.nuevaInscripcion.metodoPago === MetodoPago.EFECTIVO) {
      this.pagoEstrategia.montoRecibido = this.getMontoTotalInscripcion();
    }
  }

  onDisciplinaSeleccionada(): void {
    const horarios = this.getHorariosDisciplinaSeleccionada();
    if (horarios.length > 0) {
      this.nuevaInscripcion.disciplinaHorarioId = horarios[0].id;
    } else {
      this.nuevaInscripcion.disciplinaHorarioId = '';
    }
  }

  getHorariosDisciplinaSeleccionada(): DisciplinaHorario[] {
    if (!this.nuevaInscripcion.disciplinaId) return [];
    const disc = this.disciplinas().find((d) => d.id === this.nuevaInscripcion.disciplinaId);
    return disc?.horarios || [];
  }

  onMetodoPagoInscripcionChanged(): void {
    if (this.nuevaInscripcion.metodoPago === MetodoPago.EFECTIVO) {
      this.pagoEstrategia.montoRecibido = this.getMontoTotalInscripcion();
    }
  }

  onMetodoPagoConfirmacionChanged(): void {
    if (this.metodoPagoConfirmacion() === MetodoPago.EFECTIVO && this.selectedBoletaPago()) {
      this.pagoEstrategia.montoRecibido = this.selectedBoletaPago()!.montoTotal;
    }
  }

  // Cálculos y Helpers del Patrón Estrategia
  getMontoTotalInscripcion(): number {
    const plan = this.planes().find((p) => p.id === this.nuevaInscripcion.planId);
    if (!plan || !plan.tarifas) return 0;
    const tarifa = plan.tarifas.find((t) => t.id === this.nuevaInscripcion.tarifaId);
    if (!tarifa) return 0;
    return Number(tarifa.monto || 0) + Number(tarifa.matriculaInscripcion || 0);
  }

  getCambioEfectivoInscripcion(): number {
    const total = this.getMontoTotalInscripcion();
    const recibido = Number(this.pagoEstrategia.montoRecibido || 0);
    return Math.max(0, recibido - total);
  }

  getCambioEfectivoConfirmarPago(): number {
    const total = this.selectedBoletaPago()?.montoTotal || 0;
    const recibido = Number(this.pagoEstrategia.montoRecibido || 0);
    return Math.max(0, recibido - total);
  }

  establecerMontoEfectivoRapido(monto: number, modal: 'inscripcion' | 'confirmar'): void {
    if (monto === 0) {
      // Importe exacto
      this.pagoEstrategia.montoRecibido = modal === 'inscripcion'
        ? this.getMontoTotalInscripcion()
        : (this.selectedBoletaPago()?.montoTotal || 0);
    } else {
      this.pagoEstrategia.montoRecibido = Number(monto);
    }
  }

  onComprobanteFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.pagoEstrategia.comprobanteNombre = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.pagoEstrategia.comprobantePreview = base64;
        this.pagoEstrategia.comprobanteUrl = base64;
      };
      reader.readAsDataURL(file);
    }
  }

  removerComprobante(): void {
    this.pagoEstrategia.comprobanteUrl = '';
    this.pagoEstrategia.comprobanteNombre = '';
    this.pagoEstrategia.comprobantePreview = null;
  }

  llenarTarjetaPruebaStripe(): void {
    this.pagoEstrategia.numeroTarjeta = '4242 4242 4242 4242';
    this.pagoEstrategia.expiracionMes = '12';
    this.pagoEstrategia.expiracionAnio = '2028';
    this.pagoEstrategia.cvc = '888';
    this.pagoEstrategia.titular = 'Apex Member (Test Stripe)';
  }

  formatearTarjeta(event: any): void {
    let inputVal = event.target.value.replace(/\D/g, '').substring(0, 16);
    inputVal = inputVal.replace(/(\d{4})/g, '$1 ').trim();
    this.pagoEstrategia.numeroTarjeta = inputVal;
  }

  private resetPagoEstrategia(): void {
    this.pagoEstrategia.montoRecibido = null;
    this.pagoEstrategia.comprobanteUrl = '';
    this.pagoEstrategia.comprobanteNombre = '';
    this.pagoEstrategia.comprobantePreview = null;
    this.pagoEstrategia.codigoTransaccionQr = '';
    this.pagoEstrategia.numeroTarjeta = '';
    this.pagoEstrategia.expiracionMes = '12';
    this.pagoEstrategia.expiracionAnio = '2028';
    this.pagoEstrategia.cvc = '';
    this.pagoEstrategia.titular = '';
    this.pagoEstrategia.stripeCargando = false;
  }

  async guardarInscripcion(): Promise<void> {
    if (!this.nuevaInscripcion.clienteId.trim()) {
      this.errorMessage.set('Debe ingresar o seleccionar el socio / cliente.');
      return;
    }

    const total = this.getMontoTotalInscripcion();
    const metodo = this.nuevaInscripcion.metodoPago;

    // Validación según la estrategia
    if (metodo === MetodoPago.EFECTIVO) {
      if (this.pagoEstrategia.montoRecibido === null || this.pagoEstrategia.montoRecibido === undefined) {
        this.errorMessage.set('Para pago en efectivo debe ingresar el monto recibido.');
        return;
      }
      if (Number(this.pagoEstrategia.montoRecibido) < total) {
        this.errorMessage.set(`El monto recibido (${this.pagoEstrategia.montoRecibido} BOB) es inferior al total a pagar (${total} BOB).`);
        return;
      }
    } else if (metodo === MetodoPago.QR) {
      if (!this.pagoEstrategia.comprobanteUrl) {
        this.errorMessage.set('Para pagar con QR es obligatorio adjuntar el comprobante o captura de la transacción.');
        return;
      }
    } else if (metodo === MetodoPago.TARJETA) {
      if (!this.pagoEstrategia.numeroTarjeta.replace(/\s/g, '')) {
        this.errorMessage.set('Debe ingresar los datos de la tarjeta para procesar con Stripe.');
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      // Construir payload con datos de la estrategia
      const inputPayload: any = {
        clienteId: this.nuevaInscripcion.clienteId.trim(),
        planId: this.nuevaInscripcion.planId,
        tarifaId: this.nuevaInscripcion.tarifaId,
        disciplinaId: this.nuevaInscripcion.disciplinaId || undefined,
        disciplinaHorarioId: this.nuevaInscripcion.disciplinaHorarioId || undefined,
        fechaInicio: this.nuevaInscripcion.fechaInicio,
        metodoPago: this.nuevaInscripcion.metodoPago,
      };

      if (metodo === MetodoPago.EFECTIVO) {
        inputPayload.datosEfectivo = {
          montoRecibido: Number(this.pagoEstrategia.montoRecibido),
        };
      } else if (metodo === MetodoPago.QR) {
        inputPayload.datosQr = {
          comprobanteUrl: this.pagoEstrategia.comprobanteUrl,
          codigoTransaccion: this.pagoEstrategia.codigoTransaccionQr || undefined,
        };
        inputPayload.comprobanteUrl = this.pagoEstrategia.comprobanteUrl;
        inputPayload.codigoTransaccionExterna = this.pagoEstrategia.codigoTransaccionQr || undefined;
      } else if (metodo === MetodoPago.TARJETA) {
        inputPayload.datosStripe = {
          numeroTarjeta: this.pagoEstrategia.numeroTarjeta.replace(/\s/g, ''),
          expiracionMes: this.pagoEstrategia.expiracionMes,
          expiracionAnio: this.pagoEstrategia.expiracionAnio,
          cvc: this.pagoEstrategia.cvc,
          titular: this.pagoEstrategia.titular || 'Apex Member',
          stripePaymentMethodId: 'pm_card_' + Date.now(),
        };
      }

      await this.procesarInscripcionUC.execute(inputPayload);

      let msgExito = 'Inscripción y boleta de pago procesadas exitosamente.';
      if (metodo === MetodoPago.EFECTIVO) {
        msgExito += ` Cambio a devolver: ${this.getCambioEfectivoInscripcion().toFixed(2)} BOB.`;
      } else if (metodo === MetodoPago.TARJETA) {
        msgExito += ' Transacción autorizada mediante Stripe Gateway.';
      } else if (metodo === MetodoPago.QR) {
        msgExito += ' Comprobante QR verificado y adjuntado.';
      }

      this.successMessage.set(msgExito);
      this.showInscripcionModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al procesar la inscripción');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Flujo: Congelar y Reactivar
  async toggleEstadoInscripcion(inscripcion: BoletaInscripcion): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      if (inscripcion.estado === EstadoInscripcion.ACTIVA) {
        await this.congelarInscripcionUC.execute(inscripcion.id, 'Solicitud de congelamiento temporal');
        this.successMessage.set(`Inscripción ${inscripcion.codigoMatricula} congelada.`);
      } else if (inscripcion.estado === EstadoInscripcion.CONGELADA) {
        await this.congelarInscripcionUC.reactivar(inscripcion.id);
        this.successMessage.set(`Inscripción ${inscripcion.codigoMatricula} reactivada.`);
      }
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al cambiar estado de membresía');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Flujo: Confirmar Pago
  abrirModalConfirmarPago(pago: BoletaPago): void {
    this.selectedBoletaPago.set(pago);
    this.metodoPagoConfirmacion.set(pago.metodoPago || MetodoPago.EFECTIVO);
    this.confirmarPagoForm.boletaPagoId = pago.id;
    this.confirmarPagoForm.codigoTransaccionExterna = `TRANS-${Date.now().toString().slice(-6)}`;
    this.resetPagoEstrategia();
    // Sugerir importe exacto si es efectivo
    this.pagoEstrategia.montoRecibido = pago.montoTotal;
    this.showPagoModal.set(true);
  }

  async guardarConfirmarPago(): Promise<void> {
    const pago = this.selectedBoletaPago();
    if (!pago) return;

    const metodo = this.metodoPagoConfirmacion();
    const total = pago.montoTotal;

    // Validación según la estrategia
    if (metodo === MetodoPago.EFECTIVO) {
      if (this.pagoEstrategia.montoRecibido === null || this.pagoEstrategia.montoRecibido === undefined) {
        this.errorMessage.set('Para cobrar en efectivo debe ingresar el monto recibido.');
        return;
      }
      if (Number(this.pagoEstrategia.montoRecibido) < total) {
        this.errorMessage.set(`El monto recibido (${this.pagoEstrategia.montoRecibido} BOB) es insuficiente. El total es ${total} BOB.`);
        return;
      }
    } else if (metodo === MetodoPago.QR) {
      if (!this.pagoEstrategia.comprobanteUrl) {
        this.errorMessage.set('Para validar el pago QR es obligatorio subir la captura del comprobante.');
        return;
      }
    } else if (metodo === MetodoPago.TARJETA) {
      if (!this.pagoEstrategia.numeroTarjeta.replace(/\s/g, '')) {
        this.errorMessage.set('Debe ingresar los datos de la tarjeta para procesar con Stripe.');
        return;
      }
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const inputPayload: any = {
        boletaPagoId: this.confirmarPagoForm.boletaPagoId,
        metodoPago: metodo,
      };

      if (metodo === MetodoPago.EFECTIVO) {
        inputPayload.datosEfectivo = {
          montoRecibido: Number(this.pagoEstrategia.montoRecibido),
        };
      } else if (metodo === MetodoPago.QR) {
        inputPayload.datosQr = {
          comprobanteUrl: this.pagoEstrategia.comprobanteUrl,
          codigoTransaccion: this.pagoEstrategia.codigoTransaccionQr || this.confirmarPagoForm.codigoTransaccionExterna,
        };
        inputPayload.comprobanteUrl = this.pagoEstrategia.comprobanteUrl;
        inputPayload.codigoTransaccionExterna = this.pagoEstrategia.codigoTransaccionQr || this.confirmarPagoForm.codigoTransaccionExterna;
      } else if (metodo === MetodoPago.TARJETA) {
        inputPayload.datosStripe = {
          numeroTarjeta: this.pagoEstrategia.numeroTarjeta.replace(/\s/g, ''),
          expiracionMes: this.pagoEstrategia.expiracionMes,
          expiracionAnio: this.pagoEstrategia.expiracionAnio,
          cvc: this.pagoEstrategia.cvc,
          titular: this.pagoEstrategia.titular || 'Apex Member',
          stripePaymentMethodId: 'pm_card_' + Date.now(),
        };
      } else {
        inputPayload.codigoTransaccionExterna = this.confirmarPagoForm.codigoTransaccionExterna;
      }

      await this.confirmarPagoUC.execute(inputPayload);

      let msg = 'Pago confirmado y registrado exitosamente.';
      if (metodo === MetodoPago.EFECTIVO) {
        msg += ` Cambio a entregar: ${this.getCambioEfectivoConfirmarPago().toFixed(2)} BOB.`;
      } else if (metodo === MetodoPago.TARJETA) {
        msg += ' Cargo procesado correctamente en Stripe.';
      } else if (metodo === MetodoPago.QR) {
        msg += ' Comprobante QR verificado con éxito.';
      }

      this.successMessage.set(msg);
      this.showPagoModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al confirmar pago');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Flujo: Crear Disciplina
  async guardarDisciplina(): Promise<void> {
    if (!this.puedeEditarCatalogo()) {
      this.errorMessage.set('No cuentas con permisos para crear o modificar disciplinas.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.crearDisciplinaUC.execute(this.nuevaDisciplina);
      this.successMessage.set(`Disciplina ${this.nuevaDisciplina.nombre} creada con éxito.`);
      this.showCrearDisciplinaModal.set(false);
      this.nuevaDisciplina = {
        codigo: '',
        nombre: '',
        descripcion: '',
        capacidadMaxima: 25,
        colorHex: '#3B82F6',
      };
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al crear disciplina');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Flujo: Crear Plan
  async guardarPlan(): Promise<void> {
    if (!this.puedeEditarCatalogo()) {
      this.errorMessage.set('No cuentas con permisos para crear o modificar planes.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.crearPlanUC.execute(
        {
          codigo: this.nuevoPlan.codigo,
          nombre: this.nuevoPlan.nombre,
          descripcion: this.nuevoPlan.descripcion,
          duracionDias: Number(this.nuevoPlan.duracionDias),
          sesionesTotales: this.nuevoPlan.sesionesTotales ? Number(this.nuevoPlan.sesionesTotales) : undefined,
          tipoAcceso: this.nuevoPlan.tipoAcceso,
        },
        this.nuevoPlan.precioTarifa ? Number(this.nuevoPlan.precioTarifa) : undefined
      );
      this.successMessage.set(`Plan ${this.nuevoPlan.nombre} registrado correctamente.`);
      this.showCrearPlanModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al registrar plan');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== LECTURA Y ESCANEO QR TORNIQUETE ====================
  async toggleModoTorniquete(modo: 'qr' | 'manual'): Promise<void> {
    this.modoTorniquete.set(modo);
    if (modo === 'manual' && this.camaraActiva()) {
      await this.detenerCamara();
    }
  }

  async iniciarCamara(): Promise<void> {
    this.camaraError.set(null);
    try {
      if (this.html5QrCode && this.html5QrCode.isScanning) {
        try {
          await this.html5QrCode.stop();
        } catch (stopErr) {
          console.warn('Advertencia al detener escáner previo:', stopErr);
        }
      }

      if (!this.html5QrCode) {
        this.html5QrCode = new Html5Qrcode('torniquete-camera-reader', {
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true, // Aceleración nativa de detección de códigos en Chromium
          },
        });
      }

      // Enumerar cámaras físicas disponibles
      let cameraConfig: any = { facingMode: 'user' };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          this.dispositivosCamara.set(
            cameras.map((c, idx) => ({ id: c.id, label: c.label || `Cámara ${idx + 1}` }))
          );

          if (!this.camaraSeleccionadaId() || !cameras.some((c) => c.id === this.camaraSeleccionadaId())) {
            const backCamera = cameras.find((c) =>
              c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera')
            );
            this.camaraSeleccionadaId.set(backCamera ? backCamera.id : cameras[0].id);
          }
          cameraConfig = this.camaraSeleccionadaId();
        }
      } catch (enumErr) {
        console.warn('Enumeración de dispositivos de video no permitida o no disponible:', enumErr);
      }

      // Iniciar escaneo sin qrbox restrictivo para permitir máxima área de detección
      await this.html5QrCode.start(
        cameraConfig,
        {
          fps: 15,
        },
        (decodedText) => this.procesarQrEscaneado(decodedText),
        () => {} // Ignorar frames sin decodificación
      );
      this.camaraActiva.set(true);
      this.iniciarFrameLoopJsQr();
    } catch (err: any) {
      console.error('Error al inicializar cámara de garita:', err);
      this.camaraError.set(err.message || 'No se pudo acceder a la cámara. Verifique los permisos en el navegador.');
      this.camaraActiva.set(false);
    }
  }

  private iniciarFrameLoopJsQr(): void {
    this.detenerFrameLoopJsQr();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    this.jsQrFrameTimer = setInterval(() => {
      if (!this.camaraActiva() || this.escaneoEnPausa || !ctx) return;
      const videoEl = document.querySelector('#torniquete-camera-reader video') as HTMLVideoElement;
      if (!videoEl || videoEl.readyState < videoEl.HAVE_CURRENT_DATA || videoEl.videoWidth === 0) return;

      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imgData.data, imgData.width, imgData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (code && code.data && code.data.trim()) {
        this.procesarQrEscaneado(code.data.trim());
      }
    }, 200);
  }

  private detenerFrameLoopJsQr(): void {
    if (this.jsQrFrameTimer) {
      clearInterval(this.jsQrFrameTimer);
      this.jsQrFrameTimer = null;
    }
  }

  async cambiarCamara(deviceId: string): Promise<void> {
    this.camaraSeleccionadaId.set(deviceId);
    if (this.camaraActiva()) {
      await this.detenerCamara();
      await this.iniciarCamara();
    }
  }

  async detenerCamara(): Promise<void> {
    this.detenerFrameLoopJsQr();
    if (this.html5QrCode && this.html5QrCode.isScanning) {
      try {
        await this.html5QrCode.stop();
      } catch (e) {
        console.warn('Error al detener cámara:', e);
      }
    }
    this.camaraActiva.set(false);
  }

  setQrFeedback(
    estado: 'idle' | 'analizando' | 'valido' | 'invalido' | 'no_analizable',
    titulo: string,
    detalle: string | null = null,
    duracionMs: number = 7000
  ): void {
    if (this.qrFeedbackTimer) {
      clearTimeout(this.qrFeedbackTimer);
      this.qrFeedbackTimer = null;
    }

    this.qrNotificacionEstado.set(estado);
    this.qrNotificacionTitulo.set(titulo);
    this.qrNotificacionDetalle.set(detalle);

    if (estado !== 'idle' && estado !== 'analizando' && duracionMs > 0) {
      this.qrFeedbackTimer = setTimeout(() => {
        this.qrNotificacionEstado.set('idle');
        this.qrNotificacionTitulo.set('Esperando código QR frente a la cámara...');
        this.qrNotificacionDetalle.set(null);
      }, duracionMs);
    }
  }

  cerrarNotificacionQr(): void {
    if (this.qrFeedbackTimer) {
      clearTimeout(this.qrFeedbackTimer);
      this.qrFeedbackTimer = null;
    }
    this.qrNotificacionEstado.set('idle');
    this.qrNotificacionTitulo.set('Esperando código QR frente a la cámara...');
    this.qrNotificacionDetalle.set(null);
  }

  procesarQrManual(): void {
    if (!this.codigoQrManual.trim()) return;
    this.escaneoEnPausa = false;
    this.procesarQrEscaneado(this.codigoQrManual.trim());
    this.codigoQrManual = '';
  }

  async procesarQrEscaneado(payload: string): Promise<void> {
    if (this.escaneoEnPausa) return;
    this.escaneoEnPausa = true;
    this.torniqueteResult.set(null);
    this.errorMessage.set(null);

    // 1. Estado: No se puede analizar (cadena vacía, excesivamente corta o nula)
    if (!payload || typeof payload !== 'string' || payload.trim().length < 8) {
      this.setQrFeedback(
        'no_analizable',
        'NO SE PUEDE ANALIZAR EL CÓDIGO QR',
        'El código capturado está vacío o no contiene suficiente información legible.'
      );
      this.reproducirSonido('warning');
      setTimeout(() => {
        this.escaneoEnPausa = false;
      }, 3500);
      return;
    }

    const payloadLimpio = payload.trim();

    // 2. Validación: ¿El código contiene una carga JSON o Base64 analizable?
    let esCandidatoValido = false;
    if (payloadLimpio.startsWith('{') && payloadLimpio.endsWith('}')) {
      esCandidatoValido = true;
    } else {
      try {
        const base64Std = payloadLimpio.replace(/-/g, '+').replace(/_/g, '/');
        const padLen = (4 - (base64Std.length % 4)) % 4;
        const padded = base64Std + '='.repeat(padLen);
        const decoded = atob(padded);
        JSON.parse(decoded);
        esCandidatoValido = true;
      } catch {
        esCandidatoValido = false;
      }
    }

    if (!esCandidatoValido) {
      this.setQrFeedback(
        'no_analizable',
        'NO SE PUEDE ANALIZAR EL CÓDIGO QR',
        'El código capturado no corresponde a un pase digital ni es decodificable por ApexFitness.'
      );
      this.reproducirSonido('warning');
      setTimeout(() => {
        this.escaneoEnPausa = false;
      }, 3500);
      return;
    }

    // Extraer datos preliminares del payload para identificar al socio y calcular el movimiento
    let qrPayloadDecoded: any = null;
    try {
      if (payloadLimpio.startsWith('{')) {
        qrPayloadDecoded = JSON.parse(payloadLimpio);
      } else {
        const base64Std = payloadLimpio.replace(/-/g, '+').replace(/_/g, '/');
        const padLen = (4 - (base64Std.length % 4)) % 4;
        const padded = base64Std + '='.repeat(padLen);
        qrPayloadDecoded = JSON.parse(atob(padded));
      }
    } catch {
      qrPayloadDecoded = null;
    }

    const insIdPrelim = qrPayloadDecoded?.ins || qrPayloadDecoded?.inscripcionId;
    const matPrelim = qrPayloadDecoded?.mat || qrPayloadDecoded?.codigoMatricula;
    const inscripcionPrelim = this.inscripciones().find(
      (i) => (insIdPrelim && i.id?.toLowerCase() === insIdPrelim.toLowerCase()) ||
             (matPrelim && i.codigoMatricula?.toLowerCase() === matPrelim.toLowerCase())
    );
    const cliIdPrelim = inscripcionPrelim?.clienteId || qrPayloadDecoded?.cli || qrPayloadDecoded?.clienteId;

    // Determinar movimiento efectivo (Auto-alternar según si el socio está adentro o afuera)
    let movimientoEfectivo: TipoMovimientoAcceso;
    if (this.torniqueteForm.tipoMovimiento === 'AUTO') {
      movimientoEfectivo = this.determinarProximoMovimientoSocio(cliIdPrelim, insIdPrelim || inscripcionPrelim?.id);
    } else {
      movimientoEfectivo = this.torniqueteForm.tipoMovimiento as TipoMovimientoAcceso;
    }

    // 3. Estado: Está analizando
    this.setQrFeedback(
      'analizando',
      'ANALIZANDO CÓDIGO QR...',
      `Validando ${movimientoEfectivo === TipoMovimientoAcceso.ENTRADA ? 'ingreso (ENTRADA)' : 'egreso (SALIDA)'} y firma criptográfica HMAC...`,
      0
    );
    this.reproducirSonido('scan');

    try {
      const res = await this.validarAccesoQrUC.execute({
        qrPayload: payloadLimpio,
        dispositivoTorniquete: this.torniqueteForm.dispositivoTorniquete,
        tipoMovimiento: movimientoEfectivo,
      });
      this.torniqueteResult.set(res);

      if (res.registroAcceso) {
        this.accesos.update((curr) => [
          res.registroAcceso!,
          ...curr.filter((x) => x.id !== res.registroAcceso!.id),
        ]);
      }

      if (res.permitido) {
        // Alternar el selector automáticamente tras un acceso exitoso para el siguiente movimiento
        if (this.torniqueteForm.tipoMovimiento !== 'AUTO') {
          this.torniqueteForm.tipoMovimiento = movimientoEfectivo === TipoMovimientoAcceso.ENTRADA
            ? TipoMovimientoAcceso.SALIDA
            : TipoMovimientoAcceso.ENTRADA;
        }

        // 4. Estado: QR Válido
        let detalle = res.mensaje || 'Acceso concedido al gimnasio.';
        if (res.planNombre) {
          detalle += ` • Plan: ${res.planNombre}`;
        }
        if (res.codigoMatricula) {
          detalle += ` (${res.codigoMatricula})`;
        }
        if (res.diasRestantes !== undefined && res.diasRestantes !== null) {
          detalle += ` • ${res.diasRestantes} días de vigencia`;
        }
        if (res.sesionesRestantes !== undefined && res.sesionesRestantes !== null) {
          detalle += ` • ${res.sesionesRestantes} sesiones restantes`;
        }
        this.setQrFeedback('valido', 'QR VÁLIDO • ACCESO AUTORIZADO', detalle, 7000);
        this.reproducirSonido('ok');
      } else {
        // 5. Estado: QR No Válido
        const motivo = res.registroAcceso?.motivoDenegacion || res.mensaje || 'Acceso denegado por política de membresía.';
        this.setQrFeedback('invalido', 'QR NO VÁLIDO • ACCESO DENEGADO', motivo, 7500);
        this.reproducirSonido('error');
      }

      const insId = qrPayloadDecoded?.ins || qrPayloadDecoded?.inscripcionId;
      const mat = res.codigoMatricula || qrPayloadDecoded?.mat || qrPayloadDecoded?.codigoMatricula;
      const inscripcionEncontrada = this.inscripciones().find(
        (i) => (insId && i.id === insId) || (mat && i.codigoMatricula === mat)
      ) || inscripcionPrelim || null;

      const cliId = res.clienteId && res.clienteId !== '00000000-0000-0000-0000-000000000000'
        ? res.clienteId
        : (inscripcionEncontrada?.clienteId || cliIdPrelim);

      const clienteEncontrado = this.clientes().find((c) => c.id === cliId) || null;

      // Abrir modal con la información de la Boleta de Inscripción y el mensaje de Habilitado / No Habilitado
      this.verificacionQrData.set({
        resultado: res,
        inscripcion: inscripcionEncontrada,
        cliente: clienteEncontrado,
        qrPayloadDecoded,
        tipoMovimiento: movimientoEfectivo,
        rawPayload: payloadLimpio,
      });
      this.showModalVerificacionQr.set(true);

      // Refrescar registros de auditoría
      const logs = await this.listarAuditoriaUC.execute(undefined, 25);
      this.accesos.set(logs);
    } catch (err: any) {
      // 6. Estado: No se puede analizar (error de red o payload incomprensible por el servidor)
      this.setQrFeedback(
        'no_analizable',
        'NO SE PUEDE ANALIZAR EL CÓDIGO QR',
        err.message || 'Error de comunicación o el código no pudo ser procesado por el servidor.'
      );
      this.reproducirSonido('warning');

      const fakeResult: ValidacionAccesoResult = {
        permitido: false,
        mensaje: err.message || 'Código QR no reconocido o error en el microservicio.',
        clienteId: '00000000-0000-0000-0000-000000000000',
        registroAcceso: {
          id: 'error-' + Date.now(),
          clienteId: '00000000-0000-0000-0000-000000000000',
          tipoMovimiento: movimientoEfectivo,
          estadoAcceso: EstadoAcceso.DENEGADO,
          fechaHora: new Date().toISOString(),
          motivoDenegacion: err.message || 'Error al validar el código QR',
        },
      };
      this.verificacionQrData.set({
        resultado: fakeResult,
        inscripcion: inscripcionPrelim || null,
        cliente: null,
        qrPayloadDecoded,
        tipoMovimiento: movimientoEfectivo,
        rawPayload: payloadLimpio,
      });
      this.showModalVerificacionQr.set(true);
    } finally {
      // Pausa de 3.5 segundos para evitar re-lecturas accidentales continuas
      setTimeout(() => {
        this.escaneoEnPausa = false;
      }, 3500);
    }
  }

  private async decodificarImagenConJsQr(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
              resolve(null);
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
            if (code && code.data && code.data.trim()) {
              resolve(code.data.trim());
              return;
            }

            // Fallback con escalado x1.5 para QRs de alta densidad o con márgenes
            const scaleCanvas = document.createElement('canvas');
            scaleCanvas.width = Math.round(w * 1.5);
            scaleCanvas.height = Math.round(h * 1.5);
            const scaleCtx = scaleCanvas.getContext('2d', { willReadFrequently: true });
            if (scaleCtx) {
              scaleCtx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
              const scaleData = scaleCtx.getImageData(0, 0, scaleCanvas.width, scaleCanvas.height);
              const codeScaled = jsQR(scaleData.data, scaleData.width, scaleData.height, {
                inversionAttempts: 'attemptBoth',
              });
              if (codeScaled && codeScaled.data && codeScaled.data.trim()) {
                resolve(codeScaled.data.trim());
                return;
              }
            }

            resolve(null);
          } catch (err) {
            console.warn('Error al decodificar imagen con jsQR:', err);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  async escanearArchivoQr(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.setQrFeedback(
      'analizando',
      'ANALIZANDO IMAGEN DE CÓDIGO QR...',
      'Extrayendo código óptico del archivo subido...',
      0
    );
    this.reproducirSonido('scan');

    try {
      // 1. Intentar primero con jsQR (alta tolerancia a temas oscuros, bordes y reflejos)
      let decodedText = await this.decodificarImagenConJsQr(file);

      // 2. Si no se detectó, intentar con html5QrCode sin modificar el DOM (showImage = false)
      if (!decodedText) {
        if (!this.html5QrCode) {
          this.html5QrCode = new Html5Qrcode('torniquete-camera-reader');
        }
        try {
          decodedText = await this.html5QrCode.scanFile(file, false);
        } catch (zxingErr) {
          console.warn('Html5Qrcode no pudo extraer el QR:', zxingErr);
        }
      }

      if (!decodedText || !decodedText.trim()) {
        throw new Error('No se detectó un código QR legible en la imagen.');
      }

      this.escaneoEnPausa = false;
      await this.procesarQrEscaneado(decodedText.trim());
    } catch (err: any) {
      console.warn('Error procesando imagen QR:', err);
      this.reproducirSonido('warning');
      this.setQrFeedback(
        'no_analizable',
        'NO SE PUEDE ANALIZAR EL CÓDIGO QR',
        'No se pudo detectar ningún código QR legible en la imagen seleccionada. Verifique que no esté borrosa ni recortada.'
      );
    } finally {
      input.value = '';
    }
  }

  async simularPruebaQr(tipo: 'valido' | 'invalido' | 'no_analizable'): Promise<void> {
    this.escaneoEnPausa = false;

    if (tipo === 'no_analizable') {
      await this.procesarQrEscaneado('TEXTO_ILEGIBLE_SIN_FORMATO_QR');
      return;
    }

    if (tipo === 'invalido') {
      const payloadInvalidoDto = {
        ins: '00000000-0000-0000-0000-000000000000',
        cli: '00000000-0000-0000-0000-000000000000',
        mat: 'MAT-FALSA-000',
        exp: '2026-12-31',
        iat: 1793112000,
        sig: 'firma_adulterada_o_falsa_1234567890abcdef',
      };
      const rawBase64 = btoa(JSON.stringify(payloadInvalidoDto)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await this.procesarQrEscaneado(rawBase64);
      return;
    }

    if (tipo === 'valido') {
      const ins = this.inscripciones().find((i) => i.estado === EstadoInscripcion.ACTIVA) || this.inscripciones()[0];
      if (ins) {
        try {
          this.setQrFeedback('analizando', 'ANALIZANDO CÓDIGO QR...', 'Obteniendo pase digital firmado del servidor...', 0);
          const tokenReal = await this.obtenerQrPaseDigitalUC.execute(ins.id);
          this.escaneoEnPausa = false;
          await this.procesarQrEscaneado(tokenReal);
        } catch (err: any) {
          this.setQrFeedback('no_analizable', 'NO SE PUEDE ANALIZAR EL CÓDIGO QR', 'Error al obtener pase para simulación: ' + err.message);
        }
      } else {
        this.setQrFeedback('no_analizable', 'NO SE PUEDE ANALIZAR EL CÓDIGO QR', 'No existen inscripciones disponibles en el sistema para la prueba.');
      }
    }
  }

  private reproducirSonido(tipo: 'ok' | 'error' | 'warning' | 'scan'): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (tipo === 'ok') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (tipo === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(165, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (tipo === 'warning') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(460, ctx.currentTime);
        osc.frequency.setValueAtTime(320, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else if (tipo === 'scan') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio no soportado o bloqueado por política de autoplay
    }
  }

  // ==================== PASE DIGITAL QR DEL SOCIO ====================
  async abrirPaseDigital(ins: BoletaInscripcion): Promise<void> {
    this.paseQrInscripcion.set(ins);
    this.showPaseQrModal.set(true);
    this.paseQrCargando.set(true);
    this.paseQrSvg.set(null);
    this.paseQrError.set(null);
    try {
      const payload = await this.obtenerQrPaseDigitalUC.execute(ins.id);
      const svgRaw = await this.qrRendererService.generarSvg(payload);
      this.paseQrSvg.set(this.sanitizer.bypassSecurityTrustHtml(svgRaw));
    } catch (err: any) {
      console.error('Error al generar Pase Digital QR:', err);
      const msg = err.message || 'Error al generar Pase Digital QR';
      this.paseQrError.set(msg);
      this.errorMessage.set(msg);
    } finally {
      this.paseQrCargando.set(false);
    }
  }

  imprimirPaseDigital(): void {
    window.print();
  }

  ngOnDestroy(): void {
    this.detenerFrameLoopJsQr();
    if (this.qrFeedbackTimer) {
      clearTimeout(this.qrFeedbackTimer);
      this.qrFeedbackTimer = null;
    }
    this.detenerCamara();
  }

  // Flujo: Simulador Manual de Torniquete
  async ejecutarPasoTorniquete(): Promise<void> {
    if (!this.torniqueteForm.clienteId.trim()) {
      this.errorMessage.set('Debe ingresar el ID del socio para validar en el torniquete.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.torniqueteResult.set(null);
    const cliId = this.torniqueteForm.clienteId.trim();
    let movimientoEfectivo: TipoMovimientoAcceso;
    if (this.torniqueteForm.tipoMovimiento === 'AUTO') {
      movimientoEfectivo = this.determinarProximoMovimientoSocio(cliId);
    } else {
      movimientoEfectivo = this.torniqueteForm.tipoMovimiento as TipoMovimientoAcceso;
    }

    try {
      const res = await this.validarAccesoUC.execute({
        clienteId: cliId,
        dispositivoTorniquete: this.torniqueteForm.dispositivoTorniquete,
        tipoMovimiento: movimientoEfectivo,
      });
      this.torniqueteResult.set(res);
      this.reproducirSonido(res.permitido ? 'ok' : 'error');

      if (res.registroAcceso) {
        this.accesos.update((curr) => [
          res.registroAcceso!,
          ...curr.filter((x) => x.id !== res.registroAcceso!.id),
        ]);
      }

      if (res.permitido && this.torniqueteForm.tipoMovimiento !== 'AUTO') {
        this.torniqueteForm.tipoMovimiento = movimientoEfectivo === TipoMovimientoAcceso.ENTRADA
          ? TipoMovimientoAcceso.SALIDA
          : TipoMovimientoAcceso.ENTRADA;
      }
      // Refrescar registros de auditoría
      const logs = await this.listarAuditoriaUC.execute(undefined, 25);
      this.accesos.set(logs);
    } catch (err: any) {
      this.reproducirSonido('error');
      this.errorMessage.set(err.message || 'Fallo de comunicación con torniquete');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== GESTIÓN DE PLANES: EDITAR Y ELIMINAR ====================
  abrirModalEditarPlan(plan: Plan): void {
    if (!this.puedeEditarCatalogo()) return;
    this.editarPlanForm = {
      id: plan.id,
      codigo: plan.codigo,
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      duracionDias: plan.duracionDias,
      sesionesTotales: plan.sesionesTotales || null,
      tipoAcceso: plan.tipoAcceso || 'ILIMITADO',
      activo: plan.activo !== undefined ? plan.activo : true,
    };
    this.showEditarPlanModal.set(true);
  }

  async guardarEditarPlan(): Promise<void> {
    if (!this.puedeEditarCatalogo()) {
      this.errorMessage.set('No cuentas con permisos para editar planes.');
      return;
    }
    if (!this.editarPlanForm.nombre.trim()) {
      this.errorMessage.set('El nombre del plan es obligatorio.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.actualizarPlanUC.execute(this.editarPlanForm.id, {
        nombre: this.editarPlanForm.nombre.trim(),
        descripcion: this.editarPlanForm.descripcion || undefined,
        duracionDias: Number(this.editarPlanForm.duracionDias),
        sesionesTotales: this.editarPlanForm.sesionesTotales ? Number(this.editarPlanForm.sesionesTotales) : undefined,
        tipoAcceso: this.editarPlanForm.tipoAcceso,
        activo: this.editarPlanForm.activo,
      });
      this.successMessage.set(`Plan "${this.editarPlanForm.nombre}" actualizado correctamente.`);
      this.showEditarPlanModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al actualizar plan');
    } finally {
      this.isLoading.set(false);
    }
  }

  abrirModalEliminarPlan(plan: Plan): void {
    if (!this.puedeEditarCatalogo()) return;
    this.eliminarTarget = {
      tipo: 'plan',
      id: plan.id,
      nombre: plan.nombre,
      detalle: `Código: ${plan.codigo} (${plan.duracionDias} días). La desactivación ocultará este plan de nuevas inscripciones manteniendo el historial de socios.`,
    };
    this.showConfirmarEliminarModal.set(true);
  }

  // ==================== GESTIÓN DE TARIFAS: CREAR, EDITAR Y ELIMINAR ====================
  abrirModalCrearTarifa(plan: Plan): void {
    if (!this.puedeEditarCatalogo()) return;
    this.editarTarifaForm = {
      id: '',
      planId: plan.id,
      planNombre: plan.nombre,
      nombre: 'Tarifa Estándar',
      monto: 250,
      moneda: 'BOB',
      matriculaInscripcion: 30,
      esNueva: true,
    };
    this.showEditarTarifaModal.set(true);
  }

  abrirModalEditarTarifa(tarifa: Tarifa, plan: Plan): void {
    if (!this.puedeEditarCatalogo()) return;
    this.editarTarifaForm = {
      id: tarifa.id,
      planId: plan.id,
      planNombre: plan.nombre,
      nombre: tarifa.nombre,
      monto: Number(tarifa.monto),
      moneda: tarifa.moneda || 'BOB',
      matriculaInscripcion: Number(tarifa.matriculaInscripcion || 0),
      esNueva: false,
    };
    this.showEditarTarifaModal.set(true);
  }

  async guardarTarifa(): Promise<void> {
    if (!this.puedeEditarCatalogo()) {
      this.errorMessage.set('No cuentas con permisos para modificar tarifas.');
      return;
    }
    if (!this.editarTarifaForm.nombre.trim()) {
      this.errorMessage.set('El nombre de la tarifa es obligatorio.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      if (this.editarTarifaForm.esNueva) {
        await this.crearTarifaUC.execute({
          planId: this.editarTarifaForm.planId,
          nombre: this.editarTarifaForm.nombre.trim(),
          monto: Number(this.editarTarifaForm.monto),
          moneda: this.editarTarifaForm.moneda,
          matriculaInscripcion: Number(this.editarTarifaForm.matriculaInscripcion),
          fechaInicio: new Date().toISOString().split('T')[0],
        });
        this.successMessage.set(`Nueva tarifa añadida al plan.`);
      } else {
        await this.actualizarTarifaUC.execute(this.editarTarifaForm.id, {
          nombre: this.editarTarifaForm.nombre.trim(),
          monto: Number(this.editarTarifaForm.monto),
          moneda: this.editarTarifaForm.moneda,
          matriculaInscripcion: Number(this.editarTarifaForm.matriculaInscripcion),
          activa: true,
        });
        this.successMessage.set(`Tarifa "${this.editarTarifaForm.nombre}" actualizada.`);
      }
      this.showEditarTarifaModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al guardar tarifa');
    } finally {
      this.isLoading.set(false);
    }
  }

  abrirModalEliminarTarifa(tarifa: Tarifa, plan: Plan): void {
    if (!this.puedeEditarCatalogo()) return;
    this.eliminarTarget = {
      tipo: 'tarifa',
      id: tarifa.id,
      nombre: `${tarifa.nombre} (${tarifa.monto} ${tarifa.moneda})`,
      detalle: `Asociada al plan "${plan.nombre}". La desactivación impedirá que se use para nuevos cobros.`,
    };
    this.showConfirmarEliminarModal.set(true);
  }

  // ==================== GESTIÓN DE DISCIPLINAS: EDITAR Y ELIMINAR ====================
  abrirModalEditarDisciplina(disc: Disciplina): void {
    if (!this.puedeEditarCatalogo()) return;
    this.editarDisciplinaForm = {
      id: disc.id,
      codigo: disc.codigo,
      nombre: disc.nombre,
      descripcion: disc.descripcion || '',
      capacidadMaxima: disc.capacidadMaxima,
      colorHex: disc.colorHex || '#3B82F6',
      activo: disc.activo !== undefined ? disc.activo : true,
    };
    this.showEditarDisciplinaModal.set(true);
  }

  async guardarEditarDisciplina(): Promise<void> {
    if (!this.puedeEditarCatalogo()) {
      this.errorMessage.set('No cuentas con permisos para editar disciplinas.');
      return;
    }
    if (!this.editarDisciplinaForm.nombre.trim()) {
      this.errorMessage.set('El nombre de la disciplina es obligatorio.');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.actualizarDisciplinaUC.execute(this.editarDisciplinaForm.id, {
        nombre: this.editarDisciplinaForm.nombre.trim(),
        descripcion: this.editarDisciplinaForm.descripcion || undefined,
        capacidadMaxima: Number(this.editarDisciplinaForm.capacidadMaxima),
        colorHex: this.editarDisciplinaForm.colorHex,
        activo: this.editarDisciplinaForm.activo,
      });
      this.successMessage.set(`Disciplina "${this.editarDisciplinaForm.nombre}" actualizada.`);
      this.showEditarDisciplinaModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al actualizar disciplina');
    } finally {
      this.isLoading.set(false);
    }
  }

  abrirModalEliminarDisciplina(disc: Disciplina): void {
    if (!this.puedeEditarCatalogo()) return;
    this.eliminarTarget = {
      tipo: 'disciplina',
      id: disc.id,
      nombre: disc.nombre,
      detalle: `Código: ${disc.codigo} (Aforo actual: ${disc.capacidadMaxima} personas). Desactivará el acceso a nuevos turnos para esta disciplina.`,
    };
    this.showConfirmarEliminarModal.set(true);
  }

  // ==================== CONTROL DE AFORO Y CUPOS ====================
  abrirHorariosDesdeAforo(): void {
    if (!this.puedeEditarCatalogo()) return;
    const d = this.disciplinas().find((x) => x.id === this.ajustarAforoForm.disciplinaId);
    if (d) {
      this.showAjustarAforoModal.set(false);
      this.abrirModalGestionHorarios(d);
    }
  }

  abrirModalAforo(disc: Disciplina): void {
    if (!this.puedeEditarCatalogo()) return;
    this.ajustarAforoForm = {
      disciplinaId: disc.id,
      disciplinaNombre: disc.nombre,
      capacidadMaxima: disc.capacidadMaxima,
      horarios: (disc.horarios || []).map((h) => ({
        id: h.id,
        diaSemana: h.horario?.diaSemana || 'Lunes a Viernes',
        horaInicio: h.horario?.horaInicio || '08:00',
        horaFin: h.horario?.horaFin || '09:00',
        turno: h.horario?.turno || 'Mañana',
        cupoDisponible: h.cupoDisponible,
      })),
    };
    this.showAjustarAforoModal.set(true);
  }

  async guardarAforoGeneral(): Promise<void> {
    if (!this.puedeEditarCatalogo()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.actualizarAforoDisciplinaUC.execute(
        this.ajustarAforoForm.disciplinaId,
        Number(this.ajustarAforoForm.capacidadMaxima)
      );
      this.successMessage.set(`Aforo general de ${this.ajustarAforoForm.disciplinaNombre} ajustado a ${this.ajustarAforoForm.capacidadMaxima} personas.`);
      this.showAjustarAforoModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al actualizar aforo');
    } finally {
      this.isLoading.set(false);
    }
  }

  async ajustarCupoTurno(dhId: string, delta: number): Promise<void> {
    if (!this.puedeEditarCatalogo()) return;
    const item = this.ajustarAforoForm.horarios.find((h) => h.id === dhId);
    if (!item) return;
    const nuevoCupo = Math.max(0, item.cupoDisponible + delta);
    item.cupoDisponible = nuevoCupo;

    try {
      await this.actualizarCupoHorarioUC.execute(dhId, nuevoCupo);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al actualizar cupo de horario');
    }
  }

  // ==================== CONFIRMACIÓN GENÉRICA DE ELIMINACIÓN ====================
  async ejecutarEliminacionConfirmada(): Promise<void> {
    if (!this.puedeEditarCatalogo()) return;
    if (!this.eliminarTarget.id) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      if (this.eliminarTarget.tipo === 'plan') {
        await this.eliminarPlanUC.execute(this.eliminarTarget.id);
        this.successMessage.set(`Plan "${this.eliminarTarget.nombre}" eliminado / desactivado.`);
      } else if (this.eliminarTarget.tipo === 'disciplina') {
        await this.eliminarDisciplinaUC.execute(this.eliminarTarget.id);
        this.successMessage.set(`Disciplina "${this.eliminarTarget.nombre}" eliminada / archivada.`);
      } else if (this.eliminarTarget.tipo === 'tarifa') {
        await this.eliminarTarifaUC.execute(this.eliminarTarget.id);
        this.successMessage.set(`Tarifa "${this.eliminarTarget.nombre}" eliminada.`);
      }
      this.showConfirmarEliminarModal.set(false);
      await this.cargarDatosIniciales();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al procesar la eliminación');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==================== GESTIÓN DE HORARIOS / TURNOS ====================
  abrirModalGestionHorarios(disc: Disciplina): void {
    if (!this.puedeEditarCatalogo()) return;
    this.disciplinaSeleccionadaHorarios.set(disc);
    this.horarioEnEdicionId.set(null);
    this.nuevoHorarioDisciplinaForm = {
      diaSemana: 'LUN-MIE-VIE',
      horaInicio: '08:00',
      horaFin: '09:30',
      turno: 'MAÑANA',
      cupoDisponible: disc.capacidadMaxima || 25,
    };
    this.showGestionHorariosModal.set(true);
  }

  iniciarEdicionHorario(dh: DisciplinaHorario): void {
    if (!this.puedeEditarCatalogo()) return;
    if (!dh.horario) return;
    this.horarioEnEdicionId.set(dh.id);
    this.editarHorarioForm = {
      horarioId: dh.horario.id,
      disciplinaHorarioId: dh.id,
      diaSemana: dh.horario.diaSemana || 'LUN-MIE-VIE',
      horaInicio: dh.horario.horaInicio || '08:00',
      horaFin: dh.horario.horaFin || '09:30',
      turno: dh.horario.turno || 'MAÑANA',
      capacidadAforo: dh.horario.capacidadAforo || 25,
      cupoDisponible: dh.cupoDisponible !== undefined ? dh.cupoDisponible : 25,
    };
  }

  cancelarEdicionHorario(): void {
    this.horarioEnEdicionId.set(null);
  }

  async guardarEdicionHorario(): Promise<void> {
    if (!this.editarHorarioForm.diaSemana.trim() || !this.editarHorarioForm.horaInicio || !this.editarHorarioForm.horaFin) {
      this.errorMessage.set('Por favor completa todos los campos del horario (días y horas).');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.actualizarHorarioUC.execute(this.editarHorarioForm.horarioId, {
        diaSemana: this.editarHorarioForm.diaSemana.trim(),
        horaInicio: this.editarHorarioForm.horaInicio,
        horaFin: this.editarHorarioForm.horaFin,
        turno: this.editarHorarioForm.turno,
        capacidadAforo: Number(this.editarHorarioForm.capacidadAforo),
      });

      if (this.editarHorarioForm.disciplinaHorarioId) {
        await this.actualizarCupoHorarioUC.execute(
          this.editarHorarioForm.disciplinaHorarioId,
          Number(this.editarHorarioForm.cupoDisponible)
        );
      }

      this.successMessage.set('Horario actualizado con éxito.');
      this.horarioEnEdicionId.set(null);
      await this.cargarDatosIniciales();
      const disc = this.disciplinas().find((d) => d.id === this.disciplinaSeleccionadaHorarios()?.id);
      if (disc) {
        this.disciplinaSeleccionadaHorarios.set(disc);
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al actualizar el horario');
    } finally {
      this.isLoading.set(false);
    }
  }

  async agregarNuevoHorarioDisciplina(): Promise<void> {
    const disc = this.disciplinaSeleccionadaHorarios();
    if (!disc) return;

    if (!this.nuevoHorarioDisciplinaForm.diaSemana.trim() || !this.nuevoHorarioDisciplinaForm.horaInicio || !this.nuevoHorarioDisciplinaForm.horaFin) {
      this.errorMessage.set('Por favor completa los días, hora de inicio y hora de fin del horario.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const horario = await this.crearHorarioUC.execute({
        diaSemana: this.nuevoHorarioDisciplinaForm.diaSemana.trim(),
        horaInicio: this.nuevoHorarioDisciplinaForm.horaInicio,
        horaFin: this.nuevoHorarioDisciplinaForm.horaFin,
        turno: this.nuevoHorarioDisciplinaForm.turno,
        capacidadAforo: Number(this.nuevoHorarioDisciplinaForm.cupoDisponible),
      });

      await this.asignarDisciplinaHorarioUC.execute({
        disciplinaId: disc.id,
        horarioId: horario.id,
        cupoDisponible: Number(this.nuevoHorarioDisciplinaForm.cupoDisponible),
      });

      this.successMessage.set(`Nuevo horario (${horario.diaSemana} • ${horario.horaInicio} - ${horario.horaFin}) asignado a ${disc.nombre}.`);
      await this.cargarDatosIniciales();
      const discActual = this.disciplinas().find((d) => d.id === disc.id);
      if (discActual) {
        this.disciplinaSeleccionadaHorarios.set(discActual);
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al agregar horario a la disciplina');
    } finally {
      this.isLoading.set(false);
    }
  }

  async eliminarTurnoDisciplina(dhId: string): Promise<void> {
    if (!confirm('¿Estás seguro de desvincular o eliminar este horario de la disciplina?')) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      await this.eliminarDisciplinaHorarioUC.execute(dhId);
      this.successMessage.set('Horario desvinculado con éxito.');
      await this.cargarDatosIniciales();
      const disc = this.disciplinaSeleccionadaHorarios();
      if (disc) {
        const discActual = this.disciplinas().find((d) => d.id === disc.id);
        if (discActual) {
          this.disciplinaSeleccionadaHorarios.set(discActual);
        }
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al eliminar horario');
    } finally {
      this.isLoading.set(false);
    }
  }
}
