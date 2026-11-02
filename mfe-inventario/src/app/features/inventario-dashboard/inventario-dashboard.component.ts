import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EQUIPO_REPOSITORY, MANTENIMIENTO_REPOSITORY, MOVIMIENTO_REPOSITORY } from '../../core/tokens/injection-tokens';
import { ListarEquiposUseCase } from '../equipos/application/listar-equipos.use-case';
import { CrearEquipoUseCase } from '../equipos/application/crear-equipo.use-case';
import { CambiarEstadoEquipoUseCase } from '../equipos/application/cambiar-estado-equipo.use-case';
import { ConsultarAlertasMantenimientoUseCase } from '../mantenimientos/application/consultar-alertas.use-case';
import { ProgramarMantenimientoUseCase } from '../mantenimientos/application/programar-mantenimiento.use-case';
import { CompletarMantenimientoUseCase } from '../mantenimientos/application/completar-mantenimiento.use-case';
import { RegistrarMovimientoUseCase } from '../inventario/application/registrar-movimiento.use-case';
import { ConsultarKardexUseCase } from '../inventario/application/consultar-kardex.use-case';
import { Equipo, AmbienteRef, MarcaRef, TipoEquipoRef } from '../equipos/domain/models/equipo.model';
import { EstadoEquipo } from '../equipos/domain/enums/estado-equipo.enum';
import { Mantenimiento } from '../mantenimientos/domain/models/mantenimiento.model';
import { TipoMantenimiento, EstadoMantenimiento } from '../mantenimientos/domain/enums/mantenimiento.enums';
import { MovimientoInventario, TipoMovimientoRef } from '../inventario/domain/models/movimiento.model';

@Component({
  selector: 'app-inventario-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario-dashboard.component.html',
  styleUrls: ['./inventario-dashboard.component.css'],
})
export class InventarioDashboardComponent implements OnInit {
  // Inyección de dependencias de puertos
  private readonly equipoRepo = inject(EQUIPO_REPOSITORY);
  private readonly mantenimientoRepo = inject(MANTENIMIENTO_REPOSITORY);
  private readonly movimientoRepo = inject(MOVIMIENTO_REPOSITORY);

  // Casos de uso
  private readonly listarEquiposUC = new ListarEquiposUseCase(this.equipoRepo);
  private readonly crearEquipoUC = new CrearEquipoUseCase(this.equipoRepo);
  private readonly cambiarEstadoUC = new CambiarEstadoEquipoUseCase(this.equipoRepo);
  private readonly consultarAlertasUC = new ConsultarAlertasMantenimientoUseCase(this.mantenimientoRepo);
  private readonly programarMantenimientoUC = new ProgramarMantenimientoUseCase(this.mantenimientoRepo);
  private readonly completarMantenimientoUC = new CompletarMantenimientoUseCase(this.mantenimientoRepo);
  private readonly registrarMovimientoUC = new RegistrarMovimientoUseCase(this.movimientoRepo);
  private readonly consultarKardexUC = new ConsultarKardexUseCase(this.movimientoRepo);

  // Signals de estado
  activeTab = signal<'equipos' | 'crear-equipo' | 'mantenimientos' | 'ambientes' | 'marcas' | 'kardex'>('equipos');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Colecciones reactivas
  equipos = signal<Equipo[]>([]);
  alertas = signal<Mantenimiento[]>([]);
  kardex = signal<MovimientoInventario[]>([]);
  ambientes = signal<AmbienteRef[]>([]);
  marcas = signal<MarcaRef[]>([]);
  tiposEquipo = signal<TipoEquipoRef[]>([]);
  tiposMovimiento = signal<TipoMovimientoRef[]>([]);

  // Modales
  showCrearEquipoModal = signal<boolean>(false);
  showMantenimientoModal = signal<boolean>(false);
  showMovimientoModal = signal<boolean>(false);
  showKardexModal = signal<boolean>(false);
  showCrearAmbienteModal = signal<boolean>(false);
  showCrearMarcaModal = signal<boolean>(false);

  // Formularios para Ambientes y Marcas
  nuevoAmbiente = {
    nombre: '',
    descripcion: '',
  };

  nuevaMarca = {
    nombre: '',
  };

  // Equipo seleccionado para acciones
  selectedEquipo = signal<Equipo | null>(null);

  // Modelos de formulario
  nuevoEquipo = {
    codigo: '',
    nombre: '',
    modelo: '',
    fechaAdquisicion: '',
    precioCompra: null as number | null,
    cantidadInicial: 1,
    ambienteId: '',
    marcaId: '',
    tipoEquipoId: '',
  };

  nuevoMantenimiento = {
    tipo: TipoMantenimiento.PREVENTIVO,
    fechaInicio: new Date().toISOString().slice(0, 16),
    descripcion: '',
    costoEstimado: 0,
    proximoMantenimiento: '',
    observacion: '',
  };

  nuevoMovimiento = {
    tipoMovimientoId: '',
    cantidad: 1,
    motivo: '',
    observacion: '',
  };

  completarData = {
    costoFinal: 0,
    observacion: '',
  };

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  async cargarDatosIniciales(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const [equiposData, alertasData, ambData, marcasData, tiposData, tiposMovData] = await Promise.all([
        this.listarEquiposUC.execute(),
        this.consultarAlertasUC.execute(15),
        this.equipoRepo.listarAmbientes(),
        this.equipoRepo.listarMarcas(),
        this.equipoRepo.listarTiposEquipo(),
        this.movimientoRepo.listarTiposMovimiento(),
      ]);

      this.equipos.set(equiposData);
      this.alertas.set(alertasData);
      this.ambientes.set(ambData);
      this.marcas.set(marcasData);
      this.tiposEquipo.set(tiposData);
      this.tiposMovimiento.set(tiposMovData);

      if (ambData.length > 0) this.nuevoEquipo.ambienteId = ambData[0].id;
      if (marcasData.length > 0) this.nuevoEquipo.marcaId = marcasData[0].id;
      if (tiposData.length > 0) this.nuevoEquipo.tipoEquipoId = tiposData[0].id;
      if (tiposMovData.length > 0) this.nuevoMovimiento.tipoMovimientoId = tiposMovData[0].id;
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al conectar con el microservicio de inventario');
    } finally {
      this.isLoading.set(false);
    }
  }

  setTab(tab: 'equipos' | 'crear-equipo' | 'mantenimientos' | 'ambientes' | 'marcas' | 'kardex'): void {
    this.activeTab.set(tab);
    if (tab === 'mantenimientos') {
      this.recargarAlertas();
    }
  }

  async recargarAlertas(): Promise<void> {
    try {
      const data = await this.consultarAlertasUC.execute(30);
      this.alertas.set(data);
    } catch (err: any) {
      this.errorMessage.set(err.message);
    }
  }

  // --- Acciones de Equipos ---
  openCrearEquipoModal(): void {
    this.activeTab.set('crear-equipo');
  }

  closeCrearEquipoModal(): void {
    this.activeTab.set('equipos');
  }

  async submitCrearEquipo(): Promise<void> {
    try {
      this.isLoading.set(true);
      await this.crearEquipoUC.execute({
        codigo: this.nuevoEquipo.codigo,
        nombre: this.nuevoEquipo.nombre,
        modelo: this.nuevoEquipo.modelo || undefined,
        fechaAdquisicion: this.nuevoEquipo.fechaAdquisicion || undefined,
        precioCompra: this.nuevoEquipo.precioCompra ?? undefined,
        cantidadInicial: this.nuevoEquipo.cantidadInicial,
        ambienteId: this.nuevoEquipo.ambienteId,
        marcaId: this.nuevoEquipo.marcaId,
        tipoEquipoId: this.nuevoEquipo.tipoEquipoId,
      });

      this.successMessage.set(`Equipo ${this.nuevoEquipo.nombre} registrado exitosamente.`);
      this.activeTab.set('equipos');
      const actualizados = await this.listarEquiposUC.execute();
      this.equipos.set(actualizados);
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Acciones de Mantenimiento ---
  openMantenimientoModal(equipo: Equipo): void {
    this.selectedEquipo.set(equipo);
    this.showMantenimientoModal.set(true);
  }

  closeMantenimientoModal(): void {
    this.showMantenimientoModal.set(false);
    this.selectedEquipo.set(null);
  }

  async submitProgramarMantenimiento(): Promise<void> {
    const eq = this.selectedEquipo();
    if (!eq) return;

    try {
      this.isLoading.set(true);
      await this.programarMantenimientoUC.execute({
        equipoId: eq.id,
        tipo: this.nuevoMantenimiento.tipo,
        fechaInicio: this.nuevoMantenimiento.fechaInicio,
        descripcion: this.nuevoMantenimiento.descripcion,
        costoEstimado: this.nuevoMantenimiento.costoEstimado,
        proximoMantenimiento: this.nuevoMantenimiento.proximoMantenimiento || undefined,
        observacion: this.nuevoMantenimiento.observacion || undefined,
      });

      this.successMessage.set('Mantenimiento programado exitosamente.');
      this.closeMantenimientoModal();
      await this.recargarAlertas();
      const actualizados = await this.listarEquiposUC.execute();
      this.equipos.set(actualizados);
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async completarMantenimiento(mant: Mantenimiento): Promise<void> {
    const costo = prompt('Ingrese el costo final del mantenimiento:', mant.costo.toString());
    if (costo === null) return;

    try {
      this.isLoading.set(true);
      await this.completarMantenimientoUC.execute(mant.id, parseFloat(costo) || 0, 'Completado desde el panel MFE');
      this.successMessage.set('Mantenimiento completado.');
      await this.recargarAlertas();
      const actualizados = await this.listarEquiposUC.execute();
      this.equipos.set(actualizados);
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Acciones de Movimientos / Kardex ---
  openMovimientoModal(equipo: Equipo): void {
    this.selectedEquipo.set(equipo);
    this.showMovimientoModal.set(true);
  }

  closeMovimientoModal(): void {
    this.showMovimientoModal.set(false);
    this.selectedEquipo.set(null);
  }

  async submitMovimiento(): Promise<void> {
    const eq = this.selectedEquipo();
    if (!eq) return;

    try {
      this.isLoading.set(true);
      await this.registrarMovimientoUC.execute({
        equipoId: eq.id,
        tipoMovimientoId: this.nuevoMovimiento.tipoMovimientoId,
        cantidad: this.nuevoMovimiento.cantidad,
        motivo: this.nuevoMovimiento.motivo,
        observacion: this.nuevoMovimiento.observacion || undefined,
      });

      this.successMessage.set('Movimiento de stock registrado y Kardex actualizado.');
      this.closeMovimientoModal();
      const actualizados = await this.listarEquiposUC.execute();
      this.equipos.set(actualizados);
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async verKardex(equipo: Equipo): Promise<void> {
    this.selectedEquipo.set(equipo);
    this.isLoading.set(true);
    try {
      const historial = await this.consultarKardexUC.execute(equipo.id);
      this.kardex.set(historial);
      this.showKardexModal.set(true);
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  closeKardexModal(): void {
    this.showKardexModal.set(false);
    this.selectedEquipo.set(null);
  }

  // --- Gestión de Ambientes ---
  openCrearAmbienteModal(): void {
    this.nuevoAmbiente = { nombre: '', descripcion: '' };
    this.showCrearAmbienteModal.set(true);
  }

  closeCrearAmbienteModal(): void {
    this.showCrearAmbienteModal.set(false);
  }

  async submitCrearAmbiente(): Promise<void> {
    if (!this.nuevoAmbiente.nombre.trim()) return;

    try {
      this.isLoading.set(true);
      await this.equipoRepo.crearAmbiente(this.nuevoAmbiente.nombre, this.nuevoAmbiente.descripcion || undefined);
      this.successMessage.set(`Ambiente "${this.nuevoAmbiente.nombre}" registrado exitosamente.`);
      this.closeCrearAmbienteModal();
      const actualizados = await this.equipoRepo.listarAmbientes();
      this.ambientes.set(actualizados);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al crear ambiente');
    } finally {
      this.isLoading.set(false);
    }
  }

  contarEquiposPorAmbiente(ambienteId: string): number {
    return this.equipos().filter((e) => e.ambiente?.id === ambienteId).length;
  }

  // --- Gestión de Marcas ---
  openCrearMarcaModal(): void {
    this.nuevaMarca = { nombre: '' };
    this.showCrearMarcaModal.set(true);
  }

  closeCrearMarcaModal(): void {
    this.showCrearMarcaModal.set(false);
  }

  async submitCrearMarca(): Promise<void> {
    if (!this.nuevaMarca.nombre.trim()) return;

    try {
      this.isLoading.set(true);
      await this.equipoRepo.crearMarca(this.nuevaMarca.nombre);
      this.successMessage.set(`Marca "${this.nuevaMarca.nombre}" registrada exitosamente.`);
      this.closeCrearMarcaModal();
      const actualizados = await this.equipoRepo.listarMarcas();
      this.marcas.set(actualizados);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al registrar marca');
    } finally {
      this.isLoading.set(false);
    }
  }

  contarEquiposPorMarca(marcaId: string): number {
    return this.equipos().filter((e) => e.marca?.id === marcaId).length;
  }
}
