import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSessionQuery } from '../../../auth/presentation/hooks/useSessionQuery';
import {
  useUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
} from '../hooks/useUsersQuery';
import type { Role } from '../../../auth/domain/Role';
import type { ManagedUser, CreateUserParams } from '../../domain/ManagedUser';

interface DisciplinaInfo {
  id: string;
  nombre: string;
  codigo: string;
  colorHex?: string;
}

interface InscripcionInfo {
  id: string;
  clienteId: string;
  estado: string;
  codigoMatricula: string;
  disciplina?: DisciplinaInfo | null;
  disciplinaHorario?: {
    id: string;
    horario?: {
      diaSemana: string;
      horaInicio: string;
      horaFin: string;
      turno: string;
    } | null;
  } | null;
}

export function UsersManagementPage() {
  const { data: session } = useSessionQuery();
  const { data: users, isLoading, error } = useUsersQuery();
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const deactivateMutation = useDeactivateUserMutation();

  const currentUserRoles = session?.user.roles || [];
  const isAdmin = currentUserRoles.includes('ADMINISTRADOR');
  const isRecepcionista = currentUserRoles.includes('RECEPCIONISTA');
  const isInstructor = currentUserRoles.includes('INSTRUCTOR') && !isAdmin && !isRecepcionista;
  const canCreateUser = isAdmin || isRecepcionista;

  const defaultRole: Role = isAdmin ? 'INSTRUCTOR' : 'CLIENTE';

  const allowedRoles: Role[] = isAdmin
    ? ['INSTRUCTOR', 'RECEPCIONISTA', 'CLIENTE', 'ADMINISTRADOR']
    : ['CLIENTE'];

  // Tabs: 'list' | 'create'
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserParams>({
    nombre: '',
    apellido: '',
    ci: '',
    celular: '',
    email: '',
    password: '',
    role: defaultRole,
  });

  // Filtros de listado y disciplinas vinculadas
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Consulta de boletas de inscripción y disciplinas desde ms-gimnasio (GraphQL)
  const { data: catalogoData } = useQuery({
    queryKey: ['gimnasio', 'inscripciones-disciplinas-map'],
    queryFn: async () => {
      try {
        const res = await fetch('http://localhost:8082/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetInscripcionesYDisciplinas {
                inscripciones {
                  id
                  clienteId
                  estado
                  codigoMatricula
                  disciplina {
                    id
                    nombre
                    codigo
                    colorHex
                  }
                  disciplinaHorario {
                    id
                    horario {
                      diaSemana
                      horaInicio
                      horaFin
                      turno
                    }
                  }
                }
                disciplinas {
                  id
                  nombre
                  codigo
                  colorHex
                }
              }
            `,
          }),
        });
        const json = await res.json();
        return json.data as {
          inscripciones: InscripcionInfo[];
          disciplinas: DisciplinaInfo[];
        };
      } catch (err) {
        console.warn('[UsersManagement] No se pudo obtener catálogo de disciplinas:', err);
        return { inscripciones: [], disciplinas: [] };
      }
    },
    staleTime: 1000 * 60,
  });

  // Mapeo de última boleta de inscripción / disciplina por cada socio
  const inscripcionesPorCliente = useMemo(() => {
    const map = new Map<string, InscripcionInfo>();
    (catalogoData?.inscripciones || []).forEach((ins) => {
      const existing = map.get(ins.clienteId);
      if (!existing || ins.estado === 'ACTIVA') {
        map.set(ins.clienteId, ins);
      }
    });
    return map;
  }, [catalogoData?.inscripciones]);

  // Filtrado de usuarios según rol Instructor y disciplina de inscripción
  const filteredUsers = useMemo(() => {
    let list = users || [];

    // Si es instructor: SOLO podrá ver el listado de clientes
    if (isInstructor) {
      list = list.filter((u) => u.tipoUsuario === 'CLIENTE');
    }

    // Filtro por disciplina vinculada a su boleta de inscripción
    if (selectedDisciplinaId !== 'ALL') {
      list = list.filter((u) => {
        const ins = inscripcionesPorCliente.get(u.id);
        if (selectedDisciplinaId === 'SIN_DISCIPLINA') {
          return !ins || !ins.disciplina;
        }
        return ins?.disciplina?.id === selectedDisciplinaId;
      });
    }

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.ci.toLowerCase().includes(q) ||
        u.codigo.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, isInstructor, selectedDisciplinaId, searchTerm, inscripcionesPorCliente]);

  useEffect(() => {
    if (!isAdmin && createForm.role !== 'CLIENTE') {
      setCreateForm((prev) => ({ ...prev, role: 'CLIENTE' }));
    }
  }, [isAdmin]);

  // Modal Edit
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    nombre: '',
    apellido: '',
    celular: '',
    tipoUsuario: 'INSTRUCTOR' as Role,
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccessMsg(null);

    try {
      await createMutation.mutateAsync(createForm);
      setCreateSuccessMsg(`Usuario ${createForm.nombre} ${createForm.apellido} registrado exitosamente.`);
      setCreateForm({
        nombre: '',
        apellido: '',
        ci: '',
        celular: '',
        email: '',
        password: '',
        role: defaultRole,
      });
      setActiveTab('list');
    } catch (err: any) {
      setCreateError(err.response?.data?.message || err.message || 'Error al crear usuario.');
    }
  };

  const openEditModal = (u: ManagedUser) => {
    if (!isAdmin) return;
    setEditingUser(u);
    setEditError(null);
    setEditForm({
      nombre: u.nombre,
      apellido: u.apellido,
      celular: u.celular,
      tipoUsuario: (u.tipoUsuario as Role) || 'CLIENTE',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    try {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        params: editForm,
      });
      setEditingUser(null);
    } catch (err: any) {
      setEditError(err.response?.data?.message || err.message || 'Error al actualizar usuario.');
    }
  };

  const handleDeactivate = async (u: ManagedUser) => {
    if (u.id === session?.user.sub) {
      alert('No puedes desactivar tu propia cuenta activa.');
      return;
    }
    const confirm = window.confirm(`¿Estás seguro de que deseas desactivar la cuenta de ${u.nombre} ${u.apellido}?`);
    if (!confirm) return;

    try {
      await deactivateMutation.mutateAsync(u.id);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error al desactivar usuario.');
    }
  };

  return (
    <div className="users-management-view">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--palette-cream)', fontSize: '1.55rem', fontWeight: 800 }}>
          {isInstructor ? 'Directorio de Clientes Asignados' : 'Directorio de Usuarios del Sistema'}
        </h2>
        <p className="text-muted" style={{ marginTop: '0.25rem' }}>
          {isInstructor
            ? 'Listado exclusivo de clientes y socios del club con filtro por disciplinas vinculadas a su boleta de inscripción.'
            : 'Alta, modificación y administración de personal (Instructores, Recepcionistas, Clientes)'}
        </p>
      </div>

      {isInstructor && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.85rem 1.25rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', color: '#bfdbfe', fontSize: '0.88rem' }}>
          <span style={{ fontSize: '1.3rem' }}>🏋️</span>
          <div>
            <strong style={{ color: '#93c5fd' }}>Perfil de Instructor:</strong> Solo tienes acceso para visualizar clientes/socios. Utiliza el selector de disciplinas vinculadas para filtrar según el entrenamiento asignado en su boleta de inscripción.
          </div>
        </div>
      )}

      {/* Pestañas internas de la vista */}
      <div className="users-tabs-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('list');
            setCreateError(null);
          }}
        >
          <span>{isInstructor ? 'Listado de Clientes' : 'Directorio de Usuarios'}</span>
          <span className="tab-count-badge">{filteredUsers.length}</span>
        </button>

        {canCreateUser && (
          <button
            type="button"
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setCreateSuccessMsg(null);
            }}
          >
            <span>+ Registrar Nuevo Usuario</span>
          </button>
        )}
      </div>

      {createSuccessMsg && (
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1.25rem', background: 'rgba(90, 120, 99, 0.2)', border: '1px solid rgba(144, 171, 139, 0.4)', borderRadius: '6px', color: '#ebf4dd', fontSize: '0.9rem' }}>
          {createSuccessMsg}
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '6px', color: '#fca5a5' }}>
          Error al consultar usuarios: {String((error as any)?.message || 'No autorizado')}
        </div>
      )}

      {/* Barra de Filtros: Búsqueda y Disciplina */}
      {activeTab === 'list' && !isLoading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.85rem 1rem', background: 'rgba(36, 46, 53, 0.6)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: '260px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🔍</span>
            <input
              type="text"
              placeholder={isInstructor ? "Buscar cliente por nombre, CI, correo o código..." : "Buscar usuario por nombre, CI, correo o código..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '0.5rem 0.8rem', background: 'rgba(22, 32, 38, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', fontSize: '0.85rem', outline: 'none' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem' }}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--palette-cream)', fontWeight: 600 }}>
              Disciplina (Boleta):
            </label>
            <select
              value={selectedDisciplinaId}
              onChange={(e) => setSelectedDisciplinaId(e.target.value)}
              style={{ padding: '0.5rem 0.8rem', background: 'rgba(22, 32, 38, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', fontSize: '0.85rem', outline: 'none', minWidth: '220px' }}
            >
              <option value="ALL">Todas las Disciplinas</option>
              {catalogoData?.disciplinas?.map((d) => {
                const count = (users || []).filter((u) => {
                  if (isInstructor && u.tipoUsuario !== 'CLIENTE') return false;
                  const ins = inscripcionesPorCliente.get(u.id);
                  return ins?.disciplina?.id === d.id;
                }).length;
                return (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({count})
                  </option>
                );
              })}
              <option value="SIN_DISCIPLINA">Sin Disciplina Asignada</option>
            </select>
          </div>
        </div>
      )}

      {/* Pestaña 1: Listado Directorio */}
      {activeTab === 'list' && (
        <>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
              <p className="text-muted">Cargando directorio de usuarios...</p>
            </div>
          ) : (
            <div className="card full-width" style={{ padding: '0', overflow: 'hidden', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(36, 46, 53, 0.7)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 0.85rem' }}>Código</th>
                    <th style={{ padding: '1rem 0.85rem' }}>Nombre Completo</th>
                    <th style={{ padding: '1rem 0.85rem' }}>Correo Electrónico</th>
                    <th style={{ padding: '1rem 0.85rem' }}>CI</th>
                    <th style={{ padding: '1rem 0.85rem' }}>Celular</th>
                    <th style={{ padding: '1rem 0.85rem' }}>Disciplina (Boleta)</th>
                    <th style={{ padding: '1rem 0.85rem' }}>Rol / Tipo</th>
                    <th style={{ padding: '1rem 0.85rem' }}>Estado</th>
                    <th style={{ padding: '1rem 0.85rem', textAlign: 'center' }}>
                      {isAdmin ? 'Acciones' : 'Permisos'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(144, 171, 139, 0.1)' }}>
                        <td style={{ padding: '0.85rem' }}><code>{u.codigo}</code></td>
                        <td style={{ padding: '0.85rem', fontWeight: 600, color: 'var(--palette-cream)' }}>{u.nombre} {u.apellido}</td>
                        <td style={{ padding: '0.85rem' }}>{u.email}</td>
                        <td style={{ padding: '0.85rem' }}>{u.ci}</td>
                        <td style={{ padding: '0.85rem' }}>{u.celular}</td>
                        <td style={{ padding: '0.85rem' }}>
                          {(() => {
                            const ins = inscripcionesPorCliente.get(u.id);
                            if (ins?.disciplina) {
                              const d = ins.disciplina;
                              const h = ins.disciplinaHorario?.horario;
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <span
                                    style={{
                                      background: `${d.colorHex || '#3B82F6'}22`,
                                      color: d.colorHex || '#60a5fa',
                                      border: `1px solid ${d.colorHex || '#3B82F6'}55`,
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: '4px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      width: 'fit-content',
                                    }}
                                  >
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.colorHex || '#60a5fa' }}></span>
                                    {d.nombre}
                                  </span>
                                  {h && (
                                    <span style={{ fontSize: '0.72rem', color: '#90ab8b' }}>
                                      {h.diaSemana} • {h.horaInicio}-{h.horaFin}
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                                Sin disciplina activa
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span className="badge badge-role" style={{ borderRadius: '4px' }}>{u.tipoUsuario}</span>
                        </td>
                        <td style={{ padding: '0.85rem' }}>
                          <span className="badge badge-perm" style={{ borderRadius: '4px', color: u.estado === 'ACTIVO' ? 'var(--palette-cream)' : '#fca5a5' }}>
                            {u.estado}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem', textAlign: 'center' }}>
                          {isAdmin ? (
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                              <button
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderRadius: '4px' }}
                                title="Editar usuario"
                                onClick={() => openEditModal(u)}
                              >
                                Editar
                              </button>
                              {u.estado === 'ACTIVO' && (
                                <button
                                  className="btn-secondary"
                                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: '4px' }}
                                  title="Desactivar usuario"
                                  onClick={() => handleDeactivate(u)}
                                  disabled={deactivateMutation.isPending}
                                >
                                  Desactivar
                                </button>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#90ab8b', background: 'rgba(144, 171, 139, 0.12)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600 }}>
                              Solo Consulta
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {isInstructor
                          ? 'No se encontraron clientes o socios registrados con los filtros seleccionados.'
                          : 'No se encontraron usuarios registrados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Pestaña 2: Formulario de Registro Embebido Centrado */}
      {activeTab === 'create' && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0.5rem 0 2rem 0' }}>
          <div className="card" style={{ maxWidth: '680px', width: '100%', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.35rem', color: 'var(--palette-cream)', fontSize: '1.25rem' }}>
              Alta de Nuevo Usuario en el Sistema
            </h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              {isAdmin
                ? 'Registra una nueva cuenta de personal o cliente asignando su rol correspondiente.'
                : 'Registra un nuevo socio / cliente en la plataforma.'}
            </p>

          {createError && (
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '5px', color: '#fca5a5', fontSize: '0.85rem' }}>
              {createError}
            </div>
          )}

          <form onSubmit={handleCreateSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan"
                  value={createForm.nombre}
                  onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>Apellido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pérez"
                  value={createForm.apellido}
                  onChange={(e) => setCreateForm({ ...createForm, apellido: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>C.I. *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1234567"
                  value={createForm.ci}
                  onChange={(e) => setCreateForm({ ...createForm, ci: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 70001234"
                  value={createForm.celular}
                  onChange={(e) => setCreateForm({ ...createForm, celular: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>Correo Electrónico *</label>
              <input
                type="email"
                required
                placeholder="juan.perez@apexfitness.com"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>Contraseña *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.35rem', fontWeight: 600 }}>Rol Asignado *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
                  style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r} style={{ background: '#242e35', color: '#ebf4dd' }}>{r}</option>
                  ))}
                </select>
                {!isAdmin && (
                  <span style={{ display: 'block', fontSize: '0.74rem', color: '#90ab8b', marginTop: '0.35rem' }}>
                    Como recepcionista puedes registrar nuevos socios y clientes.
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid rgba(144, 171, 139, 0.15)' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ borderRadius: '5px' }}
                onClick={() => setActiveTab('list')}
              >
                Cancelar y Volver al Listado
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: 'auto', borderRadius: '5px' }}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

        {/* Modal Edit */}
        {editingUser && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(24, 34, 40, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}>
            <div className="card" style={{ maxWidth: '520px', width: '100%', position: 'relative', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--palette-cream)' }}>
                Editar Usuario &bull; {editingUser.codigo}
              </h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                Actualiza los datos del usuario o reasigna su rol.
              </p>

              {editError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: '5px', color: '#fca5a5', fontSize: '0.85rem' }}>
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.25rem' }}>Nombre *</label>
                    <input
                      type="text"
                      required
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.25rem' }}>Apellido *</label>
                    <input
                      type="text"
                      required
                      value={editForm.apellido}
                      onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.25rem' }}>Celular *</label>
                    <input
                      type="text"
                      required
                      value={editForm.celular}
                      onChange={(e) => setEditForm({ ...editForm, celular: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--palette-cream)', marginBottom: '0.25rem' }}>Rol Asignado *</label>
                    <select
                      value={editForm.tipoUsuario}
                      onChange={(e) => setEditForm({ ...editForm, tipoUsuario: e.target.value as Role })}
                      style={{ width: '100%', padding: '0.65rem 0.8rem', background: 'rgba(36, 46, 53, 0.8)', border: '1px solid var(--border-color)', borderRadius: '5px', color: 'var(--palette-cream)', outline: 'none' }}
                    >
                      {allowedRoles.map((r) => (
                        <option key={r} value={r} style={{ background: '#242e35', color: '#ebf4dd' }}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Guardando...' : 'Actualizar Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
