import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, QrCode, ArrowRight } from 'lucide-react';
import { useLandingStore } from '../store/useLandingStore';
import { GYM_DISCIPLINES } from '../../infrastructure/landingCatalogData';

export const LeadBookingModal: React.FC = () => {
  const { isBookingModalOpen, closeBookingModal, selectedPlanTitle, selectedPlanPrice } = useLandingStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [discipline, setDiscipline] = useState(GYM_DISCIPLINES[0].title);
  const [preferredTime, setPreferredTime] = useState('07:00 - 09:00 (Mañana)');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  if (!isBookingModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomCode = 'APX-' + Math.floor(100000 + Math.random() * 900000);
    setConfirmationCode(randomCode);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setFullName('');
    setPhone('');
    setEmail('');
    closeBookingModal();
  };

  return (
    <div className="modal-overlay" onClick={handleResetAndClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleResetAndClose}
          aria-label="Cerrar modal"
        >
          <X size={18} />
        </button>

        <div className="modal-header-banner">
          <div className="modal-selected-badge">
            <Sparkles size={13} />
            <span>{selectedPlanTitle} ({selectedPlanPrice})</span>
          </div>
          <h3 className="modal-title">
            {isSubmitted ? '¡Solicitud Confirmada!' : 'Solicita tu Pase de Entrenamiento'}
          </h3>
        </div>

        <div className="modal-body">
          {isSubmitted ? (
            <div className="modal-success-screen">
              <div className="success-icon-bubble">
                <CheckCircle2 size={36} />
              </div>

              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                ¡Excelente, {fullName}!
              </h4>

              <p style={{ fontSize: '0.9rem', color: 'var(--gym-text-muted)', lineHeight: 1.6 }}>
                Tu pase para <strong>{selectedPlanTitle}</strong> ha sido pre-registrado con éxito. Presenta este código en recepción para ingresar:
              </p>

              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px dashed var(--gym-primary)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={24} style={{ color: 'var(--gym-accent)' }} />
                <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.1em', color: '#ffffff' }}>
                  {confirmationCode}
                </span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--gym-text-dim)' }}>
                Nos comunicaremos al <strong>{phone}</strong> para coordinar tu horario y resolver cualquier inquietud previa.
              </p>

              <button
                type="button"
                className="gym-btn gym-btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={handleResetAndClose}
              >
                Entendido, ¡gracias!
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-form-group">
                <label className="modal-label">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="modal-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="modal-form-group">
                  <label className="modal-label">WhatsApp / Celular *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+591 7XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="modal-input"
                  />
                </div>

                <div className="modal-form-group">
                  <label className="modal-label">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Disciplina Principal de Interés</label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="modal-select"
                >
                  {GYM_DISCIPLINES.map((d) => (
                    <option key={d.id} value={d.title}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label className="modal-label">Horario Preferido</label>
                <select
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="modal-select"
                >
                  <option value="06:00 - 08:30 (Madrugadores)">06:00 - 08:30 (Madrugadores)</option>
                  <option value="09:00 - 12:00 (Mañana)">09:00 - 12:00 (Mañana)</option>
                  <option value="14:00 - 17:00 (Tarde)">14:00 - 17:00 (Tarde)</option>
                  <option value="18:00 - 22:00 (Noche / Horario Pico)">18:00 - 22:00 (Noche / Horario Pico)</option>
                </select>
              </div>

              <button
                type="submit"
                className="gym-btn gym-btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
              >
                <span>Generar Pase de Cortesía</span>
                <ArrowRight size={18} />
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--gym-text-dim)' }}>
                Tus datos están protegidos. Sin cargos ocultos ni compromiso obligatorio.
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
