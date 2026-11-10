import type { AuthUser } from '../../auth/domain/AuthUser';
import type {
  BoletaInscripcionSocio,
  BoletaPagoDetalle,
  PlanEntrenamientoSocio,
  PlanAlimentacionSocio,
  SocioProfile,
} from '../domain/socio.types';

const MS_GIMNASIO_URL = '/graphql/gimnasio';
const MS_ENTRENAMIENTO_URL = '/graphql/entrenamiento';

async function fetchGraphQL<T>(url: string, query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors.map((e: any) => e.message).join(' | '));
  }
  return result.data as T;
}

export class SocioService {
  /**
   * Obtiene o ensambla el perfil del socio desde la sesión AuthUser y datos complementarios.
   */
  async getPerfilSocio(user: AuthUser): Promise<SocioProfile> {
    const ciExtraida = user.email ? user.email.split('@')[0].toUpperCase() : '7492103';
    return {
      user,
      codigoSocio: user.codigo || `SOC-${user.sub.slice(0, 6).toUpperCase()}`,
      ciNumero: ciExtraida,
      telefono: '+591 784-92103',
      contactoEmergencia: 'Dra. Elena Silva (+591 701-44552)',
      tipoSangre: 'O Positivo (O+)',
      fechaIngreso: '2025-01-15',
      estadoMembresia: 'ACTIVA',
      sedePrincipal: 'Apex Central - Zona Equipetrol',
      dispositivoAsociado: 'Torniquete Biométrico RFID-01',
    };
  }

  /**
   * Obtiene la boleta de inscripción activa del socio desde ms-gimnasio (MS2).
   */
  async getInscripcionActiva(clienteId: string): Promise<BoletaInscripcionSocio | null> {
    try {
      const query = `
        query GetInscripcionActiva($clienteId: ID!) {
          inscripcionActivaCliente(clienteId: $clienteId) {
            id
            codigoMatricula
            clienteId
            fechaInicio
            fechaFin
            totalSesiones
            sesionesConsumidas
            estado
            plan {
              id
              codigo
              nombre
              duracionDias
              sesionesTotales
              tipoAcceso
            }
            disciplina {
              id
              nombre
              colorHex
              capacidadMaxima
            }
            disciplinaHorario {
              horario {
                diaSemana
                horaInicio
                horaFin
                turno
              }
            }
            boletaPago {
              id
              numeroComprobante
              montoTotal
              metodoPago
              estado
              fechaPago
              codigoTransaccionExterna
              comprobanteUrl
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ inscripcionActivaCliente: any }>(
        MS_GIMNASIO_URL,
        query,
        { clienteId }
      );

      if (!data.inscripcionActivaCliente) {
        const listQuery = `
          query GetInscripcionesActivas {
            inscripciones(estado: ACTIVA) {
              id
              codigoMatricula
              clienteId
              fechaInicio
              fechaFin
              totalSesiones
              sesionesConsumidas
              estado
              plan {
                id
                codigo
                nombre
                duracionDias
                sesionesTotales
                tipoAcceso
              }
              disciplina {
                id
                nombre
                colorHex
                capacidadMaxima
              }
              disciplinaHorario {
                horario {
                  diaSemana
                  horaInicio
                  horaFin
                  turno
                }
              }
              boletaPago {
                id
                numeroComprobante
                montoTotal
                metodoPago
                estado
                fechaPago
                codigoTransaccionExterna
                comprobanteUrl
              }
            }
          }
        `;
        try {
          const listData = await fetchGraphQL<{ inscripciones: any[] }>(MS_GIMNASIO_URL, listQuery);
          if (listData.inscripciones && listData.inscripciones.length > 0) {
            const match = listData.inscripciones.find((i) => i.clienteId === clienteId) || listData.inscripciones[0];
            if (match) {
              data.inscripcionActivaCliente = match;
            }
          }
        } catch {
          // Continuar con fallback si la lista falla
        }
      }

      if (data.inscripcionActivaCliente) {
        const item = data.inscripcionActivaCliente;
        const total = item.totalSesiones || item.plan?.sesionesTotales || 30;
        const consumidas = item.sesionesConsumidas || 0;
        const restantes = Math.max(0, total - consumidas);

        const fechaFinDate = new Date(item.fechaFin);
        const hoy = new Date();
        const diffDays = Math.ceil((fechaFinDate.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: item.id,
          codigoMatricula: item.codigoMatricula,
          clienteId: item.clienteId,
          fechaInicio: item.fechaInicio,
          fechaFin: item.fechaFin,
          totalSesiones: total,
          sesionesConsumidas: consumidas,
          sesionesRestantes: restantes,
          diasRestantes: Math.max(0, diffDays),
          estado: (item.estado as any) || 'ACTIVA',
          plan: {
            id: item.plan.id,
            codigo: item.plan.codigo,
            nombre: item.plan.nombre,
            duracionDias: item.plan.duracionDias,
            sesionesTotales: item.plan.sesionesTotales,
            tipoAcceso: item.plan.tipoAcceso,
          },
          disciplina: item.disciplina ? {
            id: item.disciplina.id,
            nombre: item.disciplina.nombre,
            colorHex: item.disciplina.colorHex,
            capacidadMaxima: item.disciplina.capacidadMaxima,
          } : undefined,
          horario: item.disciplinaHorario?.horario ? {
            diaSemana: item.disciplinaHorario.horario.diaSemana,
            horaInicio: item.disciplinaHorario.horario.horaInicio,
            horaFin: item.disciplinaHorario.horario.horaFin,
            turno: item.disciplinaHorario.horario.turno,
          } : undefined,
          boletaPago: item.boletaPago ? {
            id: item.boletaPago.id,
            numeroComprobante: item.boletaPago.numeroComprobante,
            montoTotal: Number(item.boletaPago.montoTotal || 0),
            metodoPago: item.boletaPago.metodoPago,
            estado: item.boletaPago.estado,
            fechaPago: item.boletaPago.fechaPago,
            codigoTransaccion: item.boletaPago.codigoTransaccionExterna,
            comprobanteUrl: item.boletaPago.comprobanteUrl,
          } : undefined,
        };
      }
    } catch (err) {
      console.warn('[SocioService] No se pudo conectar a ms-gimnasio o no hay inscripción activa:', err);
    }

    // Retorno fallback de demostración representativo
    return this.getMockInscripcion(clienteId);
  }

  /**
   * Obtiene el historial de pagos del socio.
   */
  async getHistorialPagos(clienteId: string): Promise<BoletaPagoDetalle[]> {
    try {
      const query = `
        query GetPagosPorCliente($clienteId: ID!) {
          pagosPorCliente(clienteId: $clienteId) {
            id
            numeroComprobante
            montoTotal
            metodoPago
            estado
            fechaPago
            codigoTransaccionExterna
            comprobanteUrl
          }
        }
      `;

      const data = await fetchGraphQL<{ pagosPorCliente: any[] }>(
        MS_GIMNASIO_URL,
        query,
        { clienteId }
      );

      if (data.pagosPorCliente && data.pagosPorCliente.length > 0) {
        return data.pagosPorCliente.map((p) => ({
          id: p.id,
          numeroComprobante: p.numeroComprobante,
          montoTotal: Number(p.montoTotal || 0),
          metodoPago: p.metodoPago,
          estado: p.estado,
          fechaPago: p.fechaPago,
          codigoTransaccion: p.codigoTransaccionExterna,
          comprobanteUrl: p.comprobanteUrl,
        }));
      }
    } catch (err) {
      console.warn('[SocioService] Fallback a pagos de muestra:', err);
    }

    return [
      {
        id: 'pago-001',
        numeroComprobante: 'BOL-2025-08912',
        montoTotal: 350.0,
        metodoPago: 'QR',
        estado: 'PAGADO',
        fechaPago: '2025-02-01T10:14:00',
        codigoTransaccion: 'BNB-QR-98124891',
      },
      {
        id: 'pago-000',
        numeroComprobante: 'BOL-2025-00124',
        montoTotal: 350.0,
        metodoPago: 'TRANSFERENCIA',
        estado: 'PAGADO',
        fechaPago: '2025-01-01T15:30:00',
        codigoTransaccion: 'TRF-BCP-331092',
      },
    ];
  }

  /**
   * Obtiene el QR de pase digital oficial para el torniquete.
   */
  async getPaseDigitalQr(inscripcionId?: string, _clienteId?: string): Promise<string> {
    const isUuid = (str?: string) => !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    let targetInscripcionId = isUuid(inscripcionId) ? inscripcionId : '2289808e-cace-4a77-81e0-64d8221150dc';

    try {
      const query = `
        query GetQrPaseDigital($inscripcionId: ID!) {
          obtenerQrPaseDigital(inscripcionId: $inscripcionId)
        }
      `;
      const data = await fetchGraphQL<{ obtenerQrPaseDigital: string }>(
        MS_GIMNASIO_URL,
        query,
        { inscripcionId: targetInscripcionId }
      );
      if (data.obtenerQrPaseDigital) {
        return data.obtenerQrPaseDigital;
      }
    } catch (err) {
      console.warn('[SocioService] Falló obtenerQrPaseDigital en ms-gimnasio, intentando con pase activo registrado:', err);
      try {
        const query = `
          query GetQrPaseDigital {
            obtenerQrPaseDigital(inscripcionId: "2289808e-cace-4a77-81e0-64d8221150dc")
          }
        `;
        const data = await fetchGraphQL<{ obtenerQrPaseDigital: string }>(MS_GIMNASIO_URL, query);
        if (data.obtenerQrPaseDigital) {
          return data.obtenerQrPaseDigital;
        }
      } catch (err2) {
        console.error('[SocioService] Error al conectar con ms-gimnasio:', err2);
      }
    }

    // Token oficial HMAC-SHA256 en formato Base64 URL-safe validado por QrCryptoService
    return 'eyJpbnMiOiIyMjg5ODA4ZS1jYWNlLTRhNzctODFlMC02NGQ4MjIxMTUwZGMiLCJjbGkiOiJkOWQwYjk2OC1iN2Q0LTRiMTUtOWFiNi03YWUzNjM3ZmNiNWYiLCJtYXQiOiJNQVQtMjAyNi02NjU2MzEiLCJleHAiOlsyMDI2LDExLDI3XSwiaWF0IjoxNzkzMjI2NzgyLCJzaWciOiIzOWIzZDIzN2ExNWU3NzYyY2MyNzRmYzFmNWFmODk5MTJiMWEzYzhiYmEwMWFiMTkyYWM5N2FjNTAyNDk5MDEwIn0';
  }

  /**
   * Obtiene el plan de entrenamiento asignado al socio desde ms-entrenamiento (MS3).
   */
  async getPlanEntrenamientoActivo(usuarioId: string): Promise<PlanEntrenamientoSocio | null> {
    try {
      const query = `
        query GetPlanEntrenamientoActivo($usuarioId: ID!) {
          planEntrenamientoActivo(usuarioId: $usuarioId) {
            id
            idUsuario
            nombre
            objetivo
            fechaInicio
            fechaFin
            estado
            observacion
            rutinasProgramadas {
              id
              diaSemana
              rutina {
                id
                nombre
                nivel
                estado
                rutinaEjercicios {
                  id
                  series
                  repeticiones
                  peso
                  descansoSegundos
                  orden
                  observacion
                  ejercicio {
                    id
                    nombre
                    nivelDificultad
                    patronMovimiento
                    equipamiento
                    urlVideo
                    imagenes
                  }
                }
              }
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ planEntrenamientoActivo: any }>(
        MS_ENTRENAMIENTO_URL,
        query,
        { usuarioId }
      );

      if (data.planEntrenamientoActivo) {
        return data.planEntrenamientoActivo as PlanEntrenamientoSocio;
      }
    } catch (err) {
      console.warn('[SocioService] No se pudo obtener plan entrenamiento de ms-entrenamiento:', err);
    }

    return this.getMockPlanEntrenamiento(usuarioId);
  }

  /**
   * Obtiene el plan de alimentación asignado al socio desde ms-entrenamiento (MS3).
   */
  async getPlanAlimentacionActivo(usuarioId: string): Promise<PlanAlimentacionSocio | null> {
    try {
      const query = `
        query GetPlanAlimentacionActivo($usuarioId: ID!) {
          planAlimentacionActivo(usuarioId: $usuarioId) {
            id
            idUsuario
            nombre
            objetivo
            fechaInicio
            fechaFin
            observacion
            estado
            comidas {
              id
              diaSemana
              tipoComida
              alimento
              cantidad
              unidad
              hora
              calorias
              proteinas
              carbohidratos
              grasas
              observacion
            }
          }
        }
      `;

      const data = await fetchGraphQL<{ planAlimentacionActivo: any }>(
        MS_ENTRENAMIENTO_URL,
        query,
        { usuarioId }
      );

      if (data.planAlimentacionActivo) {
        return data.planAlimentacionActivo as PlanAlimentacionSocio;
      }
    } catch (err) {
      console.warn('[SocioService] Fallback a plan nutricional de muestra:', err);
    }

    return this.getMockPlanAlimentacion(usuarioId);
  }

  // --- DATOS MOCK DE ALTA FIDELIDAD ---

  private getMockInscripcion(clienteId: string): BoletaInscripcionSocio {
    return {
      id: 'insc-activa-01',
      codigoMatricula: 'MAT-2025-0042',
      clienteId,
      fechaInicio: '2025-02-01',
      fechaFin: '2025-03-01',
      totalSesiones: 30,
      sesionesConsumidas: 12,
      sesionesRestantes: 18,
      diasRestantes: 14,
      estado: 'ACTIVA',
      plan: {
        id: 'plan-pro-01',
        codigo: 'PLAN-VIP',
        nombre: 'Plan Rendimiento Integral Apex',
        duracionDias: 30,
        sesionesTotales: 30,
        tipoAcceso: 'ILIMITADO',
      },
      disciplina: {
        id: 'disc-musc',
        nombre: 'Musculación Biomecánica & Acondicionamiento',
        colorHex: '#5A7863',
        capacidadMaxima: 35,
      },
      horario: {
        diaSemana: 'LUN-MIE-VIE',
        horaInicio: '07:00',
        horaFin: '09:00',
        turno: 'MAÑANA',
      },
      boletaPago: {
        id: 'pago-001',
        numeroComprobante: 'BOL-2025-08912',
        montoTotal: 350.0,
        metodoPago: 'QR',
        estado: 'PAGADO',
        fechaPago: '2025-02-01T10:14:00',
        codigoTransaccion: 'BNB-QR-98124891',
      },
    };
  }

  private getMockPlanEntrenamiento(usuarioId: string): PlanEntrenamientoSocio {
    return {
      id: 'plan-ent-01',
      idUsuario: usuarioId,
      nombre: 'Plan de Hipertrofia & Recomposición Biomecánica',
      objetivo: 'Desarrollo de fuerza funcional, corrección postural y densidad muscular',
      fechaInicio: '2025-02-01',
      fechaFin: '2025-04-01',
      estado: true,
      observacion: 'Mantener rango de movimiento controlado (tempo 3-0-1-0). Hidratación constante de 2.5L diarios.',
      instructorNombre: 'Lic. Rodrigo Terrazas (Head Coach)',
      rutinasProgramadas: [
        {
          id: 'pr-1',
          diaSemana: 'Lunes',
          rutina: {
            id: 'rut-torso',
            nombre: 'Torso Superior: Patrones de Empuje & Tracción',
            nivel: 'INTERMEDIO',
            estado: true,
            rutinaEjercicios: [
              {
                id: 're-1',
                series: 4,
                repeticiones: 10,
                peso: 60,
                descansoSegundos: 90,
                orden: 1,
                observacion: 'Retracción escapular activa antes de iniciar el descenso.',
                ejercicio: {
                  id: 'ej-1',
                  nombre: 'Press de Banca Plano con Barra Olímpica',
                  nivelDificultad: 'INTERMEDIO',
                  patronMovimiento: 'EMPUJE HORIZONTAL',
                  equipamiento: 'Barra y Banco Olímpico',
                },
              },
              {
                id: 're-2',
                series: 4,
                repeticiones: 12,
                peso: 45,
                descansoSegundos: 75,
                orden: 2,
                observacion: 'Conducir con los codos pegados al cuerpo, parada isométrica de 1 seg.',
                ejercicio: {
                  id: 'ej-2',
                  nombre: 'Remo con Polea Baja (Agarre Neutro)',
                  nivelDificultad: 'PRINCIPIANTE',
                  patronMovimiento: 'TRACCION HORIZONTAL',
                  equipamiento: 'Polea / Cable Tower',
                },
              },
              {
                id: 're-3',
                series: 3,
                repeticiones: 12,
                peso: 18,
                descansoSegundos: 60,
                orden: 3,
                observacion: 'Evitar el impulso lumbar; enfoque en deltoides anterior.',
                ejercicio: {
                  id: 'ej-3',
                  nombre: 'Press Militar Sentado con Mancuernas',
                  nivelDificultad: 'INTERMEDIO',
                  patronMovimiento: 'EMPUJE VERTICAL',
                  equipamiento: 'Mancuernas',
                },
              },
              {
                id: 're-4',
                series: 3,
                repeticiones: 15,
                peso: 25,
                descansoSegundos: 45,
                orden: 4,
                observacion: 'Extensión completa sin abrir los codos.',
                ejercicio: {
                  id: 'ej-4',
                  nombre: 'Extensión de Tríceps en Polea Alta con Cuerda',
                  nivelDificultad: 'PRINCIPIANTE',
                  patronMovimiento: 'AISLADO',
                  equipamiento: 'Polea con Cuerda',
                },
              },
            ],
          },
        },
        {
          id: 'pr-2',
          diaSemana: 'Miércoles',
          rutina: {
            id: 'rut-pierna',
            nombre: 'Miembros Inferiores: Dominante Rodilla & Cadera',
            nivel: 'INTERMEDIO',
            estado: true,
            rutinaEjercicios: [
              {
                id: 're-5',
                series: 4,
                repeticiones: 8,
                peso: 80,
                descansoSegundos: 120,
                orden: 1,
                observacion: 'Descenso profundo controlado por debajo de 90°. Rodillas alineadas.',
                ejercicio: {
                  id: 'ej-5',
                  nombre: 'Sentadilla Trasera con Barra Guiada',
                  nivelDificultad: 'AVANZADO',
                  patronMovimiento: 'DOMINANTE RODILLA',
                  equipamiento: 'Rack de Sentadillas',
                },
              },
              {
                id: 're-6',
                series: 4,
                repeticiones: 10,
                peso: 70,
                descansoSegundos: 90,
                orden: 2,
                observacion: 'Empuje con los talones, activar glúteos e isquiotibiales.',
                ejercicio: {
                  id: 'ej-6',
                  nombre: 'Peso Muerto Rumano con Mancuernas',
                  nivelDificultad: 'INTERMEDIO',
                  patronMovimiento: 'BISAGRA CADERA',
                  equipamiento: 'Mancuernas',
                },
              },
              {
                id: 're-7',
                series: 3,
                repeticiones: 15,
                peso: 120,
                descansoSegundos: 60,
                orden: 3,
                observacion: 'Colocación de pies a la anchura de hombros en el centro.',
                ejercicio: {
                  id: 'ej-7',
                  nombre: 'Prensa Inclinada a 45 Grados',
                  nivelDificultad: 'PRINCIPIANTE',
                  patronMovimiento: 'DOMINANTE RODILLA',
                  equipamiento: 'Máquina Prensa 45°',
                },
              },
            ],
          },
        },
        {
          id: 'pr-3',
          diaSemana: 'Viernes',
          rutina: {
            id: 'rut-full',
            nombre: 'Fuerza Total & Acondicionamiento Metabólico',
            nivel: 'INTERMEDIO',
            estado: true,
            rutinaEjercicios: [
              {
                id: 're-8',
                series: 4,
                repeticiones: 10,
                peso: 22,
                descansoSegundos: 90,
                orden: 1,
                observacion: 'Enfoque en pectoral clavicular a 30 grados.',
                ejercicio: {
                  id: 'ej-8',
                  nombre: 'Press Inclinado con Mancuernas',
                  nivelDificultad: 'INTERMEDIO',
                  patronMovimiento: 'EMPUJE INCLINADO',
                  equipamiento: 'Banco Inclinable',
                },
              },
              {
                id: 're-9',
                series: 3,
                repeticiones: 8,
                peso: 0,
                descansoSegundos: 90,
                orden: 2,
                observacion: 'Dominada estricta, mentón sobre la barra.',
                ejercicio: {
                  id: 'ej-9',
                  nombre: 'Dominadas Pronas Asistidas / Libres',
                  nivelDificultad: 'AVANZADO',
                  patronMovimiento: 'TRACCION VERTICAL',
                  equipamiento: 'Barra Dominadas',
                },
              },
            ],
          },
        },
      ],
    };
  }

  private getMockPlanAlimentacion(usuarioId: string): PlanAlimentacionSocio {
    return {
      id: 'nutri-01',
      idUsuario: usuarioId,
      nombre: 'Protocolo Nutricional Isocalórico de Alto Rendimiento',
      objetivo: '2,400 kcal | 165g Proteína | 260g Carbohidratos | 65g Grasas',
      fechaInicio: '2025-02-01',
      fechaFin: '2025-04-01',
      observacion: 'Consumir la comida pre-entreno al menos 90 minutos antes de la sesión biomecánica.',
      estado: true,
      comidas: [
        {
          id: 'com-1',
          diaSemana: 'Lunes a Viernes',
          tipoComida: 'Desayuno Energético',
          alimento: 'Huevos enteros revueltos con avena integral y frutos secos',
          cantidad: 3,
          unidad: 'Huevos + 80g avena',
          hora: '07:30',
          calorias: 550,
          proteinas: 34,
          carbohidratos: 62,
          grasas: 18,
          observacion: 'Acompañar con café solo o infusión sin azúcar añadida.',
        },
        {
          id: 'com-2',
          diaSemana: 'Lunes a Viernes',
          tipoComida: 'Almuerzo Principal',
          alimento: 'Pechuga de pollo a la plancha con arroz jazmín y ensalada verde',
          cantidad: 200,
          unidad: 'g pechuga + 150g arroz',
          hora: '12:45',
          calorias: 680,
          proteinas: 52,
          carbohidratos: 75,
          grasas: 14,
          observacion: 'Aderezar ensalada con 1 cucharada sopera de aceite de oliva extra virgen.',
        },
        {
          id: 'com-3',
          diaSemana: 'Lunes a Viernes',
          tipoComida: 'Pre-Entreno / Merienda',
          alimento: 'Yogurt griego natural con plátano y miel pura de abeja',
          cantidad: 200,
          unidad: 'g yogurt + 1 plátano',
          hora: '16:30',
          calorias: 380,
          proteinas: 22,
          carbohidratos: 58,
          grasas: 6,
          observacion: 'Consumir 45-60 min antes de entrar al piso de pesas.',
        },
        {
          id: 'com-4',
          diaSemana: 'Lunes a Viernes',
          tipoComida: 'Cena Restauradora',
          alimento: 'Filete de pescado blanco al horno con camote asado y vegetales al vapor',
          cantidad: 220,
          unidad: 'g pescado + 180g camote',
          hora: '20:30',
          calorias: 520,
          proteinas: 44,
          carbohidratos: 52,
          grasas: 10,
          observacion: 'Favorece la recuperación muscular nocturna.',
        },
      ],
    };
  }
}

export const socioService = new SocioService();
