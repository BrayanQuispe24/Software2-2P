import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EJERCICIO_REPOSITORY,
  RUTINA_REPOSITORY,
  PLAN_REPOSITORY,
  NUTRICION_REPOSITORY,
  ANTROPOMETRIA_REPOSITORY,
} from '../../core/tokens/injection-tokens';
import { Ejercicio, TipoEjercicio, GrupoMuscular } from '../ejercicios/domain/models/ejercicio.model';
import { Rutina } from '../rutinas/domain/models/rutina.model';
import { PlanEntrenamiento } from '../planes/domain/models/plan.model';
import { PlanAlimentacion } from '../nutricion/domain/models/nutricion.model';
import { Historial, DetalleHistorial } from '../antropometria/domain/models/antropometria.model';

export type TabType = 'ejercicios' | 'rutinas' | 'planes' | 'nutricion' | 'antropometria';

@Component({
  selector: 'app-entrenamiento-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './entrenamiento-dashboard.component.html',
  styleUrl: './entrenamiento-dashboard.component.css',
})
export class EntrenamientoDashboardComponent implements OnInit {
  private readonly ejercicioRepo = inject(EJERCICIO_REPOSITORY);
  private readonly rutinaRepo = inject(RUTINA_REPOSITORY);
  private readonly planRepo = inject(PLAN_REPOSITORY);
  private readonly nutricionRepo = inject(NUTRICION_REPOSITORY);
  private readonly antropometriaRepo = inject(ANTROPOMETRIA_REPOSITORY);

  // Socio Activo y catálogo de clientes (cargados dinámicamente desde la API)
  readonly socioId = signal<string>('');
  readonly sociosDisponibles = signal<Array<{ id: string; nombre: string }>>([]);

  // Pestaña Activa
  readonly activeTab = signal<TabType>('ejercicios');

  // Estados reactivos (Signals)
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // Datos
  readonly ejercicios = signal<Ejercicio[]>([]);
  readonly tiposEjercicio = signal<TipoEjercicio[]>([]);
  readonly gruposMusculares = signal<GrupoMuscular[]>([]);
  readonly rutinas = signal<Rutina[]>([]);
  readonly planActivo = signal<PlanEntrenamiento | null>(null);
  readonly planNutricion = signal<PlanAlimentacion | null>(null);
  readonly historialClinico = signal<Historial | null>(null);

  // Filtros de Ejercicios
  readonly busquedaTexto = signal<string>('');
  readonly filtroTipoId = signal<string>('');
  readonly filtroNivel = signal<string>('');
  readonly filtroGrupoId = signal<string>('');
  readonly filtroFuerza = signal<string>('');

  // Paginación de Ejercicios
  readonly paginaActual = signal<number>(1);
  readonly tamanoPagina = signal<number>(12);
  readonly tamanosDisponibles = [6, 12, 24, 48];

  // Detalle Biomecánico & Modales
  readonly ejercicioSeleccionado = signal<Ejercicio | null>(null);
  readonly faseImagenModal = signal<number>(0);
  readonly showModalDetalleEjercicio = signal<boolean>(false);
  readonly showModalEjercicio = signal<boolean>(false);
  readonly showModalRutina = signal<boolean>(false);
  readonly showModalMedicion = signal<boolean>(false);
  readonly showModalPlan = signal<boolean>(false);
  readonly showModalNutricion = signal<boolean>(false);

  // Formulario Ejercicio
  nuevoEjercicio = {
    nombre: '',
    descripcion: '',
    urlVideo: '',
    equipamiento: '',
    nivelDificultad: 'INTERMEDIO',
    mecanica: 'COMPUESTO',
    patronMovimiento: 'EMPUJE',
    idTipoEjercicio: '',
    idGrupoMuscularPrimario: '',
  };

  // Formulario Rutina
  nuevaRutina = {
    nombre: '',
    descripcion: '',
    nivel: 'INTERMEDIO',
    ejerciciosSeleccionados: [] as Array<{
      idEjercicio: string;
      series: number;
      repeticiones: number;
      peso: number;
      descansoSegundos: number;
    }>,
  };

  // Formulario Medición
  nuevaMedicion = {
    peso: 78.5,
    altura: 1.76,
    porcentajeGrasa: 18.0,
    masaMuscular: 36.5,
    presion: '120/80',
  };

  // Formulario Plan Semanal
  nuevoPlan = {
    nombre: 'Plan de Recomposición Muscular',
    objetivo: 'Fuerza, hipertrofia y control de composición corporal',
    fechaInicio: new Date().toISOString().substring(0, 10),
    fechaFin: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    observacion: 'Descansar 48h entre sesiones del mismo grupo muscular.',
    dias: [
      { diaSemana: 'LUNES', idRutina: '' },
      { diaSemana: 'MIERCOLES', idRutina: '' },
      { diaSemana: 'VIERNES', idRutina: '' },
    ],
  };

  // Formulario Plan Nutrición
  nuevoPlanNutricion = {
    nombre: 'Pauta Hiperproteica Adaptada',
    objetivo: 'Mantenimiento con ganancia magra',
    fechaInicio: new Date().toISOString().substring(0, 10),
    fechaFin: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    comidas: [
      { diaSemana: 'LUNES', tipoComida: 'DESAYUNO', alimento: 'Omelette de 4 claras y 1 huevo entero con avena', cantidad: 300, unidad: 'g', hora: '08:00', calorias: 420, proteinas: 32, carbohidratos: 45, grasas: 10 },
      { diaSemana: 'LUNES', tipoComida: 'ALMUERZO', alimento: 'Pechuga de pollo a la plancha con quinoa y ensalada', cantidad: 450, unidad: 'g', hora: '13:00', calorias: 680, proteinas: 52, carbohidratos: 60, grasas: 14 },
      { diaSemana: 'LUNES', tipoComida: 'CENA', alimento: 'Pescado blanco con espárragos y batata al horno', cantidad: 380, unidad: 'g', hora: '20:30', calorias: 460, proteinas: 38, carbohidratos: 40, grasas: 8 },
    ],
  };

  // Computed: Ejercicios Filtrados
  readonly ejerciciosFiltrados = computed(() => {
    const list = this.ejercicios();
    const q = this.busquedaTexto().trim().toLowerCase();
    const tipo = this.filtroTipoId();
    const nivel = this.filtroNivel();
    const grupo = this.filtroGrupoId();
    const fuerza = this.filtroFuerza();

    return list.filter((e) => {
      // Búsqueda por texto (nombre, equipamiento, mecánica, descripción)
      const matchTexto =
        !q ||
        e.nombre.toLowerCase().includes(q) ||
        (e.equipamiento && e.equipamiento.toLowerCase().includes(q)) ||
        (e.mecanica && e.mecanica.toLowerCase().includes(q)) ||
        (e.patronMovimiento && e.patronMovimiento.toLowerCase().includes(q));

      const matchTipo = !tipo || e.tipoEjercicio?.id === tipo;
      const matchNivel = !nivel || e.nivelDificultad === nivel;
      const matchFuerza = !fuerza || e.fuerza === fuerza;
      const matchGrupo =
        !grupo ||
        (e.gruposMusculares &&
          e.gruposMusculares.some((gm) => gm.grupoMuscular?.id === grupo));

      return matchTexto && matchTipo && matchNivel && matchFuerza && matchGrupo;
    });
  });

  // Computed: Paginación
  readonly totalPaginas = computed(() => {
    const total = this.ejerciciosFiltrados().length;
    const size = this.tamanoPagina();
    return Math.max(1, Math.ceil(total / size));
  });

  readonly primerItem = computed(() => {
    const total = this.ejerciciosFiltrados().length;
    if (total === 0) return 0;
    return (this.paginaActual() - 1) * this.tamanoPagina() + 1;
  });

  readonly ultimoItem = computed(() => {
    return Math.min(this.paginaActual() * this.tamanoPagina(), this.ejerciciosFiltrados().length);
  });

  readonly paginasNumeradas = computed<(number | string)[]>(() => {
    const total = this.totalPaginas();
    const current = this.paginaActual();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push('...');
    }
    pages.push(total);
    return pages;
  });

  readonly ejerciciosPaginados = computed(() => {
    const list = this.ejerciciosFiltrados();
    const page = this.paginaActual();
    const size = this.tamanoPagina();
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  // Computed: Última Medición
  readonly ultimaMedicion = computed<DetalleHistorial | null>(() => {
    const h = this.historialClinico();
    if (!h || !h.detalles || h.detalles.length === 0) return null;
    return h.detalles[0];
  });

  // Computed: IMC Calculado en Vivo en el modal de medición
  readonly imcCalculado = computed(() => {
    const p = this.nuevaMedicion.peso;
    let a = this.nuevaMedicion.altura;
    if (a > 3.0) a = a / 100;
    if (a <= 0 || p <= 0) return 0;
    return Math.round((p / (a * a)) * 100) / 100;
  });

  // Computed: Resumen de Macronutrientes Diarios
  readonly totalesNutricion = computed(() => {
    const plan = this.planNutricion();
    if (!plan || !plan.comidas) return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };

    return plan.comidas.reduce(
      (acc, c) => {
        acc.calorias += c.calorias || 0;
        acc.proteinas += c.proteinas || 0;
        acc.carbohidratos += c.carbohidratos || 0;
        acc.grasas += c.grasas || 0;
        return acc;
      },
      { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
    );
  });

  async ngOnInit(): Promise<void> {
    await this.cargarSocios();
    await this.cargarCatalogos();
    await this.cargarDatosSocio();
  }

  async cargarSocios(): Promise<void> {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let users: any[] | null = null;
      try {
        const res = await fetch('http://localhost:3000/api/users', { headers });
        if (res.ok) users = await res.json();
      } catch {
        users = null;
      }

      if (!users || !Array.isArray(users)) {
        try {
          const res = await fetch('http://localhost:4000/users', { headers });
          if (res.ok) users = await res.json();
        } catch {
          users = null;
        }
      }

      if (users && Array.isArray(users)) {
        const clientesRemotos = users
          .filter((u: any) => u.tipoUsuario === 'CLIENTE' || (!u.tipoUsuario && !u.rol))
          .map((u: any) => ({
            id: u.id,
            nombre: `${u.nombre || ''} ${u.apellido || ''}${u.ci ? ` (CI: ${u.ci})` : ''}`.trim(),
          }));

        if (clientesRemotos.length > 0) {
          this.sociosDisponibles.set(clientesRemotos);
          if (!this.socioId() || !clientesRemotos.some((c) => c.id === this.socioId())) {
            this.socioId.set(clientesRemotos[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar socios desde API:', err);
    }
  }

  setTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  async cambiarSocio(id: string): Promise<void> {
    this.socioId.set(id);
    await this.cargarDatosSocio();
  }

  async cargarCatalogos(): Promise<void> {
    try {
      this.loading.set(true);
      const [ejercicios, tipos, grupos, rutinas] = await Promise.all([
        this.ejercicioRepo.listarEjercicios(),
        this.ejercicioRepo.listarTipos(),
        this.ejercicioRepo.listarGruposMusculares(),
        this.rutinaRepo.listarRutinas(),
      ]);
      this.ejercicios.set(ejercicios);
      this.tiposEjercicio.set(tipos);
      this.gruposMusculares.set(grupos);
      this.rutinas.set(rutinas);

      if (tipos.length > 0 && !this.nuevoEjercicio.idTipoEjercicio) {
        this.nuevoEjercicio.idTipoEjercicio = tipos[0].id;
      }
      if (grupos.length > 0 && !this.nuevoEjercicio.idGrupoMuscularPrimario) {
        this.nuevoEjercicio.idGrupoMuscularPrimario = grupos[0].id;
      }
      if (rutinas.length > 0) {
        this.nuevoPlan.dias.forEach((d) => (d.idRutina = rutinas[0].id));
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al cargar catálogos.');
    } finally {
      this.loading.set(false);
    }
  }

  async cargarDatosSocio(): Promise<void> {
    const id = this.socioId();
    if (!id) return;
    try {
      this.loading.set(true);
      const [plan, nutricion, historial] = await Promise.all([
        this.planRepo.obtenerPlanActivo(id),
        this.nutricionRepo.obtenerPlanActivo(id),
        this.antropometriaRepo.obtenerHistorial(id),
      ]);
      this.planActivo.set(plan);
      this.planNutricion.set(nutricion);
      this.historialClinico.set(historial);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al cargar datos del socio.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- Navegación y Paginación de Catálogo ---
  irAPagina(p: number): void {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual.set(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual() > 1) {
      this.paginaActual.update((p) => p - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual() < this.totalPaginas()) {
      this.paginaActual.update((p) => p + 1);
    }
  }

  cambiarTamanoPagina(tamano: number): void {
    this.tamanoPagina.set(tamano);
    this.paginaActual.set(1);
  }

  limpiarFiltros(): void {
    this.busquedaTexto.set('');
    this.filtroTipoId.set('');
    this.filtroNivel.set('');
    this.filtroGrupoId.set('');
    this.filtroFuerza.set('');
    this.paginaActual.set(1);
  }

  obtenerImagenPrincipal(e: Ejercicio): string | null {
    if (e.imagenes && e.imagenes.length > 0) {
      return `/exercises/${e.imagenes[0]}`;
    }
    return null;
  }

  obtenerImagenFase(e: Ejercicio, index: number): string | null {
    if (e.imagenes && e.imagenes.length > index) {
      return `/exercises/${e.imagenes[index]}`;
    }
    return null;
  }

  // --- Modal Biomecánico ---
  abrirModalDetalle(e: Ejercicio): void {
    this.ejercicioSeleccionado.set(e);
    this.faseImagenModal.set(0);
    this.showModalDetalleEjercicio.set(true);
  }

  cerrarModalDetalle(): void {
    this.showModalDetalleEjercicio.set(false);
    this.ejercicioSeleccionado.set(null);
  }

  cambiarFaseImagen(fase: number): void {
    this.faseImagenModal.set(fase);
  }

  // --- Acciones de Ejercicio ---
  abrirModalEjercicio(): void {
    this.showModalEjercicio.set(true);
  }

  cerrarModalEjercicio(): void {
    this.showModalEjercicio.set(false);
  }

  async guardarEjercicio(): Promise<void> {
    if (!this.nuevoEjercicio.nombre.trim()) {
      alert('Ingresa el nombre del ejercicio.');
      return;
    }
    try {
      this.loading.set(true);
      await this.ejercicioRepo.crearEjercicio({
        nombre: this.nuevoEjercicio.nombre,
        descripcion: this.nuevoEjercicio.descripcion,
        urlVideo: this.nuevoEjercicio.urlVideo,
        equipamiento: this.nuevoEjercicio.equipamiento,
        nivelDificultad: this.nuevoEjercicio.nivelDificultad,
        mecanica: this.nuevoEjercicio.mecanica,
        patronMovimiento: this.nuevoEjercicio.patronMovimiento,
        idTipoEjercicio: this.nuevoEjercicio.idTipoEjercicio,
        gruposMusculares: this.nuevoEjercicio.idGrupoMuscularPrimario
          ? [
              {
                idGrupoMuscular: this.nuevoEjercicio.idGrupoMuscularPrimario,
                tipoParticipacion: 'PRIMARIO',
              },
            ]
          : [],
      });
      this.cerrarModalEjercicio();
      this.successMessage.set('Ejercicio biomecánico creado con éxito.');
      await this.cargarCatalogos();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al crear ejercicio.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- Acciones de Rutina ---
  abrirModalRutina(): void {
    this.nuevaRutina.ejerciciosSeleccionados = [];
    if (this.ejercicios().length > 0) {
      this.agregarEjercicioARutina(this.ejercicios()[0].id);
    }
    this.showModalRutina.set(true);
  }

  cerrarModalRutina(): void {
    this.showModalRutina.set(false);
  }

  agregarEjercicioARutina(id?: string): void {
    const ejercicioId = id || (this.ejercicios().length > 0 ? this.ejercicios()[0].id : '');
    this.nuevaRutina.ejerciciosSeleccionados.push({
      idEjercicio: ejercicioId,
      series: 4,
      repeticiones: 10,
      peso: 40,
      descansoSegundos: 90,
    });
  }

  removerEjercicioDeRutina(index: number): void {
    this.nuevaRutina.ejerciciosSeleccionados.splice(index, 1);
  }

  async guardarRutina(): Promise<void> {
    if (!this.nuevaRutina.nombre.trim()) {
      alert('Ingresa el nombre de la rutina.');
      return;
    }
    if (this.nuevaRutina.ejerciciosSeleccionados.length === 0) {
      alert('Agrega al menos un ejercicio a la rutina.');
      return;
    }
    try {
      this.loading.set(true);
      await this.rutinaRepo.crearRutina({
        nombre: this.nuevaRutina.nombre,
        descripcion: this.nuevaRutina.descripcion,
        nivel: this.nuevaRutina.nivel,
        ejercicios: this.nuevaRutina.ejerciciosSeleccionados.map((item, idx) => ({
          idEjercicio: item.idEjercicio,
          series: Number(item.series),
          repeticiones: Number(item.repeticiones),
          peso: Number(item.peso),
          descansoSegundos: Number(item.descansoSegundos),
          orden: idx + 1,
        })),
      });
      this.cerrarModalRutina();
      this.successMessage.set('Rutina estructurada exitosamente.');
      await this.cargarCatalogos();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al guardar rutina.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- Acciones de Medición Antropométrica ---
  abrirModalMedicion(): void {
    const ult = this.ultimaMedicion();
    if (ult) {
      this.nuevaMedicion.peso = ult.peso;
      this.nuevaMedicion.altura = ult.altura;
      this.nuevaMedicion.porcentajeGrasa = ult.porcentajeGasa || 18.0;
      this.nuevaMedicion.masaMuscular = ult.masaMuscular || 36.5;
    }
    this.showModalMedicion.set(true);
  }

  cerrarModalMedicion(): void {
    this.showModalMedicion.set(false);
  }

  async guardarMedicion(): Promise<void> {
    try {
      this.loading.set(true);
      await this.antropometriaRepo.registrarMedicion({
        idUsuario: this.socioId(),
        peso: Number(this.nuevaMedicion.peso),
        altura: Number(this.nuevaMedicion.altura),
        porcentajeGrasa: Number(this.nuevaMedicion.porcentajeGrasa),
        masaMuscular: Number(this.nuevaMedicion.masaMuscular),
        presion: this.nuevaMedicion.presion,
      });
      this.cerrarModalMedicion();
      this.successMessage.set('Medición antropométrica e IMC calculados y registrados.');
      await this.cargarDatosSocio();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al guardar medición.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- Acciones de Plan de Entrenamiento ---
  abrirModalPlan(): void {
    this.showModalPlan.set(true);
  }

  cerrarModalPlan(): void {
    this.showModalPlan.set(false);
  }

  async guardarPlan(): Promise<void> {
    try {
      this.loading.set(true);
      await this.planRepo.asignarPlan({
        idUsuario: this.socioId(),
        nombre: this.nuevoPlan.nombre,
        objetivo: this.nuevoPlan.objetivo,
        fechaInicio: this.nuevoPlan.fechaInicio,
        fechaFin: this.nuevoPlan.fechaFin,
        observacion: this.nuevoPlan.observacion,
        rutinas: this.nuevoPlan.dias.map((d) => ({
          diaSemana: d.diaSemana,
          idRutina: d.idRutina,
        })),
      });
      this.cerrarModalPlan();
      this.successMessage.set('Plan semanal de entrenamiento asignado exitosamente.');
      await this.cargarDatosSocio();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al asignar plan.');
    } finally {
      this.loading.set(false);
    }
  }

  // --- Acciones de Plan de Nutrición ---
  abrirModalNutricion(): void {
    this.showModalNutricion.set(true);
  }

  cerrarModalNutricion(): void {
    this.showModalNutricion.set(false);
  }

  async guardarPlanNutricion(): Promise<void> {
    try {
      this.loading.set(true);
      await this.nutricionRepo.asignarPlan({
        idUsuario: this.socioId(),
        nombre: this.nuevoPlanNutricion.nombre,
        objetivo: this.nuevoPlanNutricion.objetivo,
        fechaInicio: this.nuevoPlanNutricion.fechaInicio,
        fechaFin: this.nuevoPlanNutricion.fechaFin,
        comidas: this.nuevoPlanNutricion.comidas,
      });
      this.cerrarModalNutricion();
      this.successMessage.set('Plan de alimentación y macronutrientes asignado.');
      await this.cargarDatosSocio();
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Error al asignar nutrición.');
    } finally {
      this.loading.set(false);
    }
  }

  obtenerClaseIMC(imc: number): string {
    if (imc < 18.5) return 'imc-bajo';
    if (imc <= 24.9) return 'imc-normal';
    if (imc <= 29.9) return 'imc-sobrepeso';
    return 'imc-obesidad';
  }

  obtenerTextoIMC(imc: number): string {
    if (imc < 18.5) return 'Bajo Peso';
    if (imc <= 24.9) return 'Normopeso (Óptimo)';
    if (imc <= 29.9) return 'Sobrepeso Grado I';
    return 'Obesidad';
  }
}
