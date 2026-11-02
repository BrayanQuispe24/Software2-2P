import type { GymDiscipline } from '../domain/GymDiscipline';
import type { GymPlan } from '../domain/GymPlan';
import type { EcosystemRole } from '../domain/EcosystemRole';

export const GYM_CONFIG = {
  name: 'APEX FITNESS CLUB',
  slogan: 'Salud, Deporte & Alto Rendimiento',
  description:
    'Centro integral de entrenamiento deportivo equipado con tecnología biomecánica de vanguardia, entrenadores certificados y acceso inteligente sin filas.',
  contact: {
    address: 'Av. Las Palmas #450, Zona Equipetrol Norte',
    city: 'Santa Cruz, Bolivia',
    phone: '+591 (3) 345-8899',
    whatsapp: '+591 780-99881',
    email: 'contacto@apexfitness.com',
  },
  schedule: [
    { days: 'Lunes a Viernes', hours: '06:00 - 23:00' },
    { days: 'Sábados', hours: '07:00 - 20:00' },
    { days: 'Domingos & Feriados', hours: '08:00 - 15:00' },
  ],
  stats: [
    { value: '+1,850', label: 'Socios Activos' },
    { value: '35+', label: 'Coaches Certificados' },
    { value: '6 Zonas', label: 'Áreas de Entrenamiento' },
    { value: '99.4%', label: 'Satisfacción y Retención' },
  ],
};

export const GYM_DISCIPLINES: GymDiscipline[] = [
  {
    id: 'musculacion',
    title: 'Musculación & Peso Libre',
    category: 'Fuerza e Hipertrofia',
    description:
      'Máquinas selectorizadas de última generación, racks olímpicos, mancuernas calibradas hasta 60 kg y zonas de levantamiento.',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    highlightBadge: 'Zona Principal',
    isPopular: true,
    benefits: ['Racks olímpicos de sentadilla', 'Mancuernas de alta gama', 'Biomecánica ergonométrica asistida'],
  },
  {
    id: 'cross-funcional',
    title: 'Cross Training & Funcional',
    category: 'Resistencia y Potencia',
    description:
      'Circuitos metabólicos de alta intensidad (HIIT), cuerdas de batalla, trineos, kettlebells, barras olímpicas y TRX.',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    highlightBadge: 'Alta Intensidad',
    isPopular: true,
    benefits: ['Entrenamiento guiado por coach', 'Circuitos diarios variables', 'Quema calórica acelerada'],
  },
  {
    id: 'boxeo-combate',
    title: 'Boxeo & Deportes de Contacto',
    category: 'Cardio y Coordinación',
    description:
      'Ring profesional reglamentario, sacos de golpeo, manoplas y trabajo técnico de combate para todos los niveles.',
    imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=800&q=80',
    highlightBadge: 'Ring Pro',
    benefits: ['Técnica de golpeo y defensa', 'Desarrollo de agilidad y reflejos', 'Descarga de estrés y enfoque'],
  },
  {
    id: 'spinning-ritmo',
    title: 'Spinning & Clases de Ritmo',
    category: 'Cardiovascular Grupal',
    description:
      'Salón insonorizado con iluminación inmersiva, bicicletas estáticas magnéticas y sesiones enérgicas de Zumba y Baile.',
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    highlightBadge: 'Studio Inmersivo',
    benefits: ['Bicicletas magnéticas de precisión', 'Audio envolvente motivacional', 'Monitoreo de frecuencia cardíaca'],
  },
  {
    id: 'yoga-movilidad',
    title: 'Yoga, Pilates & Movilidad',
    category: 'Flexibilidad y Bienestar',
    description:
      'Sesiones de respiración, corrección postural, estiramientos profundos y fortalecimiento de core en ambiente tranquilo.',
    imageUrl: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?auto=format&fit=crop&w=800&q=80',
    highlightBadge: 'Cuerpo & Mente',
    benefits: ['Prevención activa de lesiones', 'Corrección de postura lumbar', 'Alivio de tensión y relajación'],
  },
  {
    id: 'recovery-wellness',
    title: 'Zona Recovery & Sauna',
    category: 'Recuperación Muscular',
    description:
      'Sauna seco finlandés, área de descanso, pistolas de masaje percusivo y asesoría en suplementación deportiva.',
    imageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    highlightBadge: 'Wellness',
    benefits: ['Regeneración miofascial óptima', 'Desintoxicación y relajación', 'Lockers y duchas de confort'],
  },
];

export const HOW_IT_WORKS_STEPS = [
  {
    stepNumber: '01',
    title: 'Elige tu Meta y Disciplina',
    description:
      'Define tus metas físicas: hipertrofia, pérdida de grasa, resistencia o rendimiento deportivo. Nuestro catálogo cubre todas las disciplinas.',
    actionLabel: 'Ver Disciplinas',
    actionHref: '#disciplinas',
  },
  {
    stepNumber: '02',
    title: 'Selecciona tu Membresía',
    description:
      'Elige el plan que mejor se adapte a tu rutina: pase diario, membresía mensual libre, plan Black con acceso total o tarifa anual VIP.',
    actionLabel: 'Comparar Planes',
    actionHref: '#membresias',
  },
  {
    stepNumber: '03',
    title: 'Acceso Ágil con QR Digital',
    description:
      'Olvídate de tarjetas plásticas o filas en recepción. Escanea tu carnet digital desde el celular en el torniquete y entra en 3 segundos.',
    actionLabel: 'Conoce la App',
    actionHref: '#app-movil',
  },
  {
    stepNumber: '04',
    title: 'Entrena con Coaches Certificados',
    description:
      'Nuestros entrenadores supervisan tu técnica en sala, estructuran tus rutinas de acondicionamiento y guían tus clases grupales.',
    actionLabel: 'Ver Ecosistema',
    actionHref: '#ecosistema',
  },
];

export const GYM_PLANS: GymPlan[] = [
  {
    id: 'plan-diario',
    name: 'Pase Diario',
    tag: 'Acceso Ocasional',
    price: 'Bs. 25',
    period: '/ sesión',
    description: 'Acceso total de una jornada ideal para viajeros o entrenamientos específicos.',
    features: [
      'Acceso libre por todo el día',
      'Uso de sala de musculación & cardio',
      'Participación en 1 clase grupal del día',
      'Uso de casillero y duchas',
      'Supervisión básica de instructores en sala',
    ],
    ctaText: 'Comprar Pase Diario',
  },
  {
    id: 'plan-classic',
    name: 'Plan Classic',
    tag: 'Membresía Mensual',
    price: 'Bs. 190',
    period: '/ mes',
    description: 'Entrena todos los días en la sala de fuerza, máquinas y zona cardiovascular.',
    features: [
      'Acceso ilimitado de Lunes a Domingo',
      'Sala completa de musculación & peso libre',
      'Zona cardiovascular & estiramientos',
      'Carnet digital QR en tu smartphone',
      'Evaluación física inicial y rutina sugerida',
    ],
    ctaText: 'Inscribirme al Plan Classic',
  },
  {
    id: 'plan-pro-black',
    name: 'Plan Pro Black',
    tag: 'Acceso Total Ilimitado',
    price: 'Bs. 280',
    period: '/ mes',
    isPopular: true,
    highlightText: 'MÁS ELEGIDO',
    description: 'La experiencia definitiva con acceso a todas las disciplinas, clases y zona recovery.',
    features: [
      'Acceso ilimitado a todas las 6 disciplinas',
      'Clases dirigidas: Spinning, Boxeo, Cross y Yoga',
      'Acceso libre a Sauna seco & Recovery',
      'Rutina personalizada actualizada mensualmente',
      'Pase de invitado gratis al mes para un amigo',
      'Lockers preferenciales y toallas',
    ],
    ctaText: 'Comenzar con Plan Pro',
  },
  {
    id: 'plan-anual-vip',
    name: 'Plan Anual VIP',
    tag: 'Mayor Ahorro & Compromiso',
    price: 'Bs. 2,400',
    period: '/ año',
    highlightText: 'AHORRA 28%',
    description: 'El mejor costo-beneficio para quienes asumen un compromiso total con su salud y estado físico.',
    features: [
      'Todo lo incluido en el Plan Pro Black',
      'Tarifa fija garantizada por 12 meses',
      'Evaluación nutricional y bioimpedancia trimestral',
      'Kit de bienvenida exclusivo Apex (Shaker + Camiseta)',
      'Congelamiento de membresía hasta por 30 días al año',
      'Invitados ilimitados los fines de semana',
    ],
    ctaText: 'Adquirir Plan Anual VIP',
  },
];

export const ECOSYSTEM_ROLES: EcosystemRole[] = [
  {
    id: 'socio',
    tabLabel: 'Socio / Miembro',
    badge: 'Experiencia del Atleta',
    title: 'Libertad, motivación y herramientas para transformar tu cuerpo',
    subtitle: 'Todo lo que necesitas para una experiencia fitness de primer nivel',
    description:
      'Como socio de Apex Fitness Club, disfrutas de instalaciones premium con equipamiento de competición, un carnet digital en tu celular que agiliza tu ingreso y la asesoría constante de profesionales comprometidos con tu progreso.',
    features: [
      {
        title: 'Carnet Digital & Control QR:',
        description: 'Ingreso inmediato en torniquetes y validación de membresía en tiempo real.',
      },
      {
        title: 'Reserva de Clases Grupales:',
        description: 'Asegura tu cupo en spinning, boxeo, cross training o yoga con un solo clic.',
      },
      {
        title: 'Supervisión Técnica:',
        description: 'Coaches de sala dispuestos a explicarte la ejecución correcta de cada ejercicio.',
      },
    ],
    visualCard: {
      tag: 'PORTAL DEL SOCIO',
      headline: 'Bienvenido de nuevo, Carlos M.',
      statNumber: '18 entrenamientos',
      statLabel: 'este mes (Racha activa)',
      highlightTitle: 'MEMBRESÍA PRO BLACK ACTIVA',
      highlightSubtitle: 'Vigencia hasta: 15 de Noviembre | Acceso Total Permitido',
    },
  },
  {
    id: 'instructor',
    tabLabel: 'Entrenador / Coach',
    badge: 'Supervisión Deportiva',
    title: 'Acompañamiento profesional en cada repetición y clase',
    subtitle: 'Entrenadores certificados en biomecánica y preparación física',
    description:
      'Nuestros entrenadores no solo supervisan la seguridad en las salas de peso libre, sino que guían las sesiones grupales de alta energía y diseñan planes adaptados a principiantes, intermedios y atletas avanzados.',
    features: [
      {
        title: 'Prescripción de Ejercicios:',
        description: 'Diseño de rutinas de empuje, tracción, fuerza de piernas y acondicionamiento aeróbico.',
      },
      {
        title: 'Supervisión de Biomecánica:',
        description: 'Corrección postural en sentadillas, peso muerto y ejercicios con cargas libres.',
      },
      {
        title: 'Liderazgo en Clases:',
        description: 'Dirección dinámica de grupos en spinning, circuitos funcionales y técnica de boxeo.',
      },
    ],
    visualCard: {
      tag: 'MÓDULO DE COACHING',
      headline: 'Coach Lic. Andrés Morales',
      statNumber: '4 Clases hoy',
      statLabel: 'CrossFit & Musculación',
      highlightTitle: 'RUTINA RECOMENDADA EN CURSO',
      highlightSubtitle: 'Fase de Fuerza: Sentadilla en Rack + Press Banca + Jalón dorsal',
    },
  },
  {
    id: 'recepcion',
    tabLabel: 'Recepción & Accesos',
    badge: 'Atención & Seguridad',
    title: 'Validación instantánea y atención cálida a cada visitante',
    subtitle: 'Flujo de entrada automatizado sin aglomeraciones en horario pico',
    description:
      'El equipo de recepción gestiona la bienvenida de los atletas, el control de aforo por torniquetes, la inscripción presencial de nuevos clientes y la resolución inmediata de dudas de pago o reservas.',
    features: [
      {
        title: 'Validación en Tiempo Real:',
        description: 'El sistema corrobora el estado de cuota y habilita el torniquete en menos de 1 segundo.',
      },
      {
        title: 'Gestión de Pases y Visitas:',
        description: 'Registro ágil de pases diarios, invitados y prospectos que vienen a su clase gratis.',
      },
      {
        title: 'Atención Personalizada:',
        description: 'Cobro por tarjeta, transferencia o efectivo y asignación de casilleros seguros.',
      },
    ],
    visualCard: {
      tag: 'CONTROL DE ENTRADA & SALIDA',
      headline: 'Punto de Control Principal - Torniquete A',
      statNumber: '142 personas',
      statLabel: 'Aforo actual en sala (64% capacidad)',
      highlightTitle: 'ACCESO CONCEDIDO - CARNET QR',
      highlightSubtitle: 'Socio: Mariana Peña | Plan Classic | Ingreso registrado: 18:32',
    },
  },
  {
    id: 'admin',
    tabLabel: 'Administración',
    badge: 'Gestión Integral',
    title: 'Visibilidad completa del rendimiento del club y satisfacción del socio',
    subtitle: 'Métricas, finanzas, aforos y control de staff en un solo panel',
    description:
      'La gerencia y administración cuentan con un panel centralizado donde supervisan renovaciones de membresías, reportes de asistencia en horas punta, mantenimiento de maquinaria e indicadores financieros.',
    features: [
      {
        title: 'Analítica de Aforo y Horarios:',
        description: 'Conoce los momentos de mayor demanda para optimizar turnos de entrenadores.',
      },
      {
        title: 'Control de Membresías y Cobranzas:',
        description: 'Reportes automáticos de ingresos, renovaciones activas y retención de clientes.',
      },
      {
        title: 'Gestión de Colaboradores:',
        description: 'Asignación de roles, horarios de guardia y permisos en la plataforma de gestión.',
      },
    ],
    visualCard: {
      tag: 'PANEL DE CONTROL ADMINISTRATIVO',
      headline: 'Apex Fitness Club - Sede Central',
      statNumber: 'Bs. 84,200',
      statLabel: 'Facturación del mes en curso',
      highlightTitle: 'INDICADORES DE CRECIMIENTO',
      highlightSubtitle: '+14% nuevas suscripciones | 94% tasa de retención de miembros',
    },
  },
];
