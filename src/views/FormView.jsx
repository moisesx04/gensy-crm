import { useState } from 'react';
import { addCliente, updateCliente } from '../lib/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, FileText, DollarSign, Briefcase, ClipboardList, Shield, Clock, Star, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';

/* ─── Constants ─────────────────────────────────────────── */
const TIPO_ID = [
  { label: 'Pasaporte',           emoji: '🛂' },
  { label: 'ID de NY',            emoji: '🗽' },
  { label: 'ID de NJ',            emoji: '🌿' },
  { label: 'ID de FL',            emoji: '🌴' },
  { label: 'Driver License USA',  emoji: '🚗' },
  { label: 'Cédula Dominicana',   emoji: '🇩🇴' },
  { label: 'Matrícula Consular',  emoji: '🏛️' },
  { label: 'Otro',                emoji: '📄' },
];
const SOCIAL_OPTS = [
  { label: 'Social Security (SSN)', emoji: '🔵' },
  { label: 'ITIN Number',           emoji: '🟡' },
  { label: 'Ninguno',               emoji: '⭕' },
];
const COBRO_OPTS = [
  { label: 'Cheque de nómina',       emoji: '📑' },
  { label: 'Depósito directo (ACH)', emoji: '🏦' },
  { label: 'Efectivo (Cash)',         emoji: '💵' },
];
const PAGO_OPTS = [
  { label: 'Cash',                    emoji: '💰' },
  { label: 'Programas de asistencia', emoji: '🤝' },
  { label: 'Ambos (Cash + Programa)', emoji: '🔀' },
];
const PROGRAMAS = ['Sección 8 / Voucher', 'CityFHEPS', 'LINC', 'FHEPS', 'SOTA', 'HomeBase', 'Otro'];

const STEPS = [
  { icon: User,          label: 'form_step_personal',   title: 'form_title_personal',        sub: 'form_sub_personal' },
  { icon: FileText,      label: 'form_step_docs', title: 'form_title_docs', sub: 'form_sub_docs' },
  { icon: DollarSign,    label: 'form_step_finances',   title: 'form_title_finances',        sub: 'form_sub_finances' },
  { icon: Briefcase,     label: 'form_step_job',     title: 'form_title_job',       sub: 'form_sub_job' },
  { icon: ClipboardList, label: 'form_step_review',   title: 'form_title_review',              sub: 'form_sub_review' },
];

const EMPTY = {
  nombreCompleto:'', numPersonas:'', numHabitaciones:'', edades:'', mascotas:'',
  telefono:'', direccion:'',
  tipoIdentificacion:'', tipoIdOtro:'', numeroIdentificacion:'', tipoSocial:'', numeroSocial:'', creditScore:'',
  cuentaBanco:'', formaCobro:'', presentoTaxes:'', montoTaxes:'', ingresosMensuales:'',
  lugarTrabajo:'', cashOPrograma:'', programaAsistencia:'',
};

const slideRight = { initial:{opacity:0,x:40},  animate:{opacity:1,x:0}, exit:{opacity:0,x:-40} };
const slideLeft  = { initial:{opacity:0,x:-40}, animate:{opacity:1,x:0}, exit:{opacity:0,x:40} };

/* ─── Sub-components ─────────────────────────────────────── */
function OptBtn({ label, emoji, selected, onClick }) {
  return (
    <motion.button type="button"
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(79,110,247,.18)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 20px', borderRadius: 12,
        border: `2px solid ${selected ? '#2563eb' : '#e4e9f4'}`,
        background: selected ? 'linear-gradient(135deg,#edf0ff,#f3f1ff)' : '#fafbff',
        fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
        color: selected ? '#2563eb' : '#5a6480',
        cursor: 'pointer', transition: 'border-color .15s, background .15s',
        textAlign: 'left', position: 'relative',
      }}
    >
      {emoji && <span style={{ fontSize: 20 }}>{emoji}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {selected && (
        <span style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={11} color="#fff" strokeWidth={3} />
        </span>
      )}
    </motion.button>
  );
}

function FInput({ label, hint, required, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: '#0d1630', marginBottom: 8 }}>
        {label}
        {required && <span style={{ color: '#e84f8c', marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <span style={{ fontSize: 13, color: '#9aa3be', display: 'block', marginTop: 6 }}>{hint}</span>}
    </div>
  );
}

const INP = {
  width: '100%', padding: '14px 18px',
  border: '2px solid #e4e9f4', borderRadius: 12,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: 16, color: '#0d1630', outline: 'none',
  background: '#fafbff', transition: 'border-color .2s, box-shadow .2s',
};

function SRow({ label, value, hi }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '12px 0', borderBottom: '1px solid #f0f3fb', gap: 12,
    }}>
      <span style={{ fontSize: 14.5, color: '#5a6480', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15.5, fontWeight: 700, color: hi ? '#2563eb' : '#0d1630', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function FormView() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const editDato   = location.state?.editDato;
  
  const { t, language, setLanguage } = useLanguage();
  const { showNotification } = useNotification();
  const [step, setStep]           = useState(0);
  const [dir, setDir]             = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF]                 = useState(editDato || EMPTY);
  const [focused, setFocused]     = useState(null);

  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  const handleEdadesChange = (e) => {
    let val = e.target.value;
    // Auto-comma logic: if space is added after a number
    if (val.endsWith(' ') && !val.endsWith(', ') && val.length > 1) {
      const lastChar = val[val.length - 2];
      if (/[0-9]/.test(lastChar)) {
        val = val.substring(0, val.length - 1) + ', ';
      }
    }
    set('edades', val);
  };

  const canAdvance = () => {
    if (step === 0) return f.nombreCompleto.trim() && f.numPersonas && f.numHabitaciones && f.edades.trim() && f.mascotas;
    if (step === 1) return f.tipoIdentificacion && f.tipoSocial;
    if (step === 2) return f.cuentaBanco && f.formaCobro && f.presentoTaxes && f.ingresosMensuales;
    if (step === 3) return f.lugarTrabajo.trim() && f.cashOPrograma;
    return true;
  };

  function goNext() { setDir(1);  setStep(s => s + 1); window.scrollTo(0, 0); }
  function goBack() { setDir(-1); setStep(s => s - 1); window.scrollTo(0, 0); }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    const saved = {
      ...f,
      numPersonas:       Number(f.numPersonas),
      numHabitaciones:   Number(f.numHabitaciones),
      creditScore:       f.creditScore ? Number(f.creditScore) : null,
      ingresosMensuales: Number(f.ingresosMensuales),
      montoTaxes:        f.montoTaxes ? Number(f.montoTaxes) : 0,
    };
    try {
      if (editDato?.id) {
        await updateCliente({ ...saved, id: editDato.id });
        showNotification(t('success_saved'), 'success');
        if (location.state?.isAdminEdit) {
          navigate('/clientes');
        } else {
          navigate('/form/gracias', { state: { formData: { ...saved, id: editDato.id } } });
        }
      } else {
        const result = await addCliente(saved);
        showNotification(t('notif_client_success'), 'success');
        navigate('/form/gracias', { state: { formData: { ...saved, id: result.id } } });
      }
    } catch {
      alert(t('err_submit'));
      setSubmitting(false);
    }
  }

  const S = STEPS[step];
  const Icon = S.icon;
  const variant = dir === 1 ? slideRight : slideLeft;

  /* Focus styles helper */
  const inp = (name) => ({
    ...INP,
    borderColor: focused === name ? '#2563eb' : '#e4e9f4',
    boxShadow: focused === name ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
  });

  return (
    <div style={{ flex: 1, width: '100%' }}>
      <div style={{
        minHeight: '100vh', width: '100%',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        <div className="form-main-card" style={{
          display: 'flex', width: '100%', maxWidth: 1300,
          background: '#fff', borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
          minHeight: 'clamp(600px, 80vh, 850px)',
        }}>

          {/* ══ LEFT PANEL ══════════════════════════════════ */}
          <div style={{
            width: 360, flexShrink: 0,
            background: '#f8fafc',
            padding: '48px 40px',
            display: 'flex', flexDirection: 'column',
            borderRight: '1px solid #f1f5f9'
          }}
          className="form-left-panel"
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)', flexShrink: 0,
              }}>🏡</div>
              <div>
                <div style={{ color: 'var(--t1)', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', lineHeight: 1.2 }}>My agenda<br/>personalizada</div>
                <div style={{ color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800, marginTop: 4 }}>G A FRIAS REAL ESTATE</div>
              </div>
            </div>

            {/* Steps sidebar */}
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800, marginBottom: 20 }}>
                {t('form_progress')}
              </p>
              {STEPS.map((s, i) => {
                const SIcon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8, position: 'relative' }}>
                    {/* Connector line */}
                    {i < STEPS.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 16, top: 32, width: 2, height: 16,
                        background: done ? 'var(--accent)' : '#e2e8f0',
                        transition: 'background .3s',
                      }} />
                    )}
                    <motion.div
                      animate={{
                        background: done ? 'var(--accent)' : active ? 'var(--accent)' : '#fff',
                        scale: active ? 1.1 : 1,
                        border: active || done ? '2px solid var(--accent)' : '2px solid #e2e8f0'
                      }}
                      style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {done
                        ? <Check size={16} color="#fff" strokeWidth={3} />
                        : <SIcon size={16} color={active ? '#fff' : '#94a3b8'} />
                      }
                    </motion.div>
                      <div>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          color: active ? 'var(--t1)' : done ? 'var(--t2)' : '#94a3b8',
                          transition: 'color .25s',
                        }}>{t(s.label)}</div>
                        {active && (
                          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>{t(s.sub)}</div>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>

            {/* Trust badges */}
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
              {[
                { icon: Shield,  text: t('form_badge_confidential') },
                { icon: Clock,   text: t('form_badge_step', { step: step + 1, total: STEPS.length }) },
                { icon: Star,    text: t('form_badge_free') },
              ].map(({ icon: Ic, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Ic size={14} color="var(--t3)" />
                  <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══ RIGHT PANEL ══════════════════════════════════ */}
          <div className="form-right-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Header bar */}
            <div className="form-header-bar" style={{
              padding: '24px 40px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: 15,
            }}>
              <div className="hidden-mobile" style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color="var(--accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>{t(S.title)}</h2>
                <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, marginTop: 2, fontWeight: 500 }}>{t(S.sub)}</p>
              </div>

              {/* Language Switcher */}
              <button 
                type="button"
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
              </button>

              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    height: 6, borderRadius: 99,
                    width: i === step ? 24 : 6,
                    background: i < step ? 'var(--accent)' : i === step ? 'var(--accent)' : '#e2e8f0',
                    transition: 'all .4s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                ))}
              </div>
            </div>

            {/* Form body */}
            <form onSubmit={submit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    variants={dir === 1 ? slideRight : slideLeft}
                    initial="initial" animate="animate" exit="exit"
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >

                    {/* ── STEP 0: Personal ── */}
                    {step === 0 && (<div>
                      <FInput label={t('lbl_fullname')} required hint={t('hint_fullname')}>
                        <input autoFocus required value={f.nombreCompleto}
                          onChange={e => set('nombreCompleto', e.target.value)}
                          onFocus={() => setFocused('nc')} onBlur={() => setFocused(null)}
                          style={inp('nc')} placeholder="Ej: Juan Carlos Pérez Rodríguez" />
                      </FInput>

                      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <FInput label={t('lbl_people')} required>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>👥</span>
                            <input required type="number" min="1" max="20" value={f.numPersonas}
                              onChange={e => set('numPersonas', e.target.value)}
                              onFocus={() => setFocused('np')} onBlur={() => setFocused(null)}
                              style={{ ...inp('np'), paddingLeft: 46 }} placeholder="Ej: 4" />
                          </div>
                        </FInput>
                        <FInput label={t('lbl_rooms')} required>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>🛏</span>
                            <input required type="number" min="0" max="10" value={f.numHabitaciones}
                              onChange={e => set('numHabitaciones', e.target.value)}
                              onFocus={() => setFocused('nh')} onBlur={() => setFocused(null)}
                              style={{ ...inp('nh'), paddingLeft: 46 }} placeholder="Ej: 3" />
                          </div>
                        </FInput>
                      </div>

                      <FInput label={t('lbl_ages')} required hint={t('hint_ages')}>
                        <input required value={f.edades} onChange={handleEdadesChange}
                          onFocus={() => setFocused('ed')} onBlur={() => setFocused(null)}
                          style={inp('ed')} placeholder="Ej: 38, 35, 12, 8" />
                      </FInput>

                      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <FInput label={t('lbl_phone')}>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>📱</span>
                            <input value={f.telefono}
                              onChange={e => set('telefono', e.target.value)}
                              onFocus={() => setFocused('tel')} onBlur={() => setFocused(null)}
                              style={{ ...inp('tel'), paddingLeft: 46 }} placeholder="Celular o residencial" />
                          </div>
                        </FInput>
                        <FInput label={t('lbl_address')}>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>📍</span>
                            <input value={f.direccion}
                              onChange={e => set('direccion', e.target.value)}
                              onFocus={() => setFocused('dir')} onBlur={() => setFocused(null)}
                              style={{ ...inp('dir'), paddingLeft: 46 }} placeholder="Calle, apt, ciudad" />
                          </div>
                        </FInput>
                      </div>

                      <FInput label={t('lbl_pets')} required>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <OptBtn label={t('opt_yes')} emoji="🐾" selected={f.mascotas === 'Sí'} onClick={() => set('mascotas', 'Sí')} />
                          <OptBtn label={t('opt_no')}             selected={f.mascotas === 'No'} onClick={() => set('mascotas', 'No')} />
                        </div>
                      </FInput>
                    </div>)}

                    {/* ── STEP 1: Documentos ── */}
                    {step === 1 && (<div>
                      <FInput label={t('lbl_id_type')} required>
                        <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                          {TIPO_ID.map(({ label, emoji }) => (
                            <OptBtn key={label} label={t('val_' + label, { defaultValue: label })} emoji={emoji}
                              selected={f.tipoIdentificacion === label}
                              onClick={() => { set('tipoIdentificacion', label); set('tipoIdOtro', ''); set('numeroIdentificacion', ''); }} />
                          ))}
                        </div>
                      </FInput>

                      <AnimatePresence>
                        {f.tipoIdentificacion && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            {f.tipoIdentificacion === 'Otro' && (
                              <FInput label={t('lbl_id_specify')}>
                                <input value={f.tipoIdOtro} onChange={e => set('tipoIdOtro', e.target.value)}
                                  onFocus={() => setFocused('idotro')} onBlur={() => setFocused(null)}
                                  style={inp('idotro')} placeholder="Describe el tipo de ID..." />
                              </FInput>
                            )}
                            <FInput label={t('lbl_id_number', { type: t('val_' + f.tipoIdentificacion, { defaultValue: f.tipoIdentificacion }) })} hint={t('hint_id_number')}>
                              <input value={f.numeroIdentificacion} onChange={e => set('numeroIdentificacion', e.target.value)}
                                onFocus={() => setFocused('nid')} onBlur={() => setFocused(null)}
                                style={inp('nid')} placeholder="Ej: A12345678" />
                            </FInput>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FInput label={t('lbl_tax_id')} required>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {SOCIAL_OPTS.map(({ label, emoji }) => (
                            <OptBtn key={label} label={t('val_' + label, { defaultValue: label })} emoji={emoji}
                              selected={f.tipoSocial === label}
                              onClick={() => { set('tipoSocial', label); set('numeroSocial', ''); }} />
                          ))}
                        </div>
                      </FInput>

                      <AnimatePresence>
                        {f.tipoSocial && f.tipoSocial !== 'Ninguno' && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            <FInput label={t('lbl_tax_number', { type: t('val_' + f.tipoSocial, { defaultValue: f.tipoSocial }) })} hint={t('hint_tax_number')}>
                              <input value={f.numeroSocial} onChange={e => set('numeroSocial', e.target.value)}
                                onFocus={() => setFocused('ns')} onBlur={() => setFocused(null)}
                                style={inp('ns')} placeholder="123-45-6789" maxLength={11} />
                            </FInput>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FInput label={t('lbl_credit_score')} hint={t('hint_credit_score')}>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>📊</span>
                          <input type="number" min="300" max="850" value={f.creditScore}
                            onChange={e => set('creditScore', e.target.value)}
                            onFocus={() => setFocused('cs')} onBlur={() => setFocused(null)}
                            style={{ ...inp('cs'), paddingLeft: 46 }} placeholder="Ej: 680" />
                        </div>
                      </FInput>
                    </div>)}

                    {/* ── STEP 2: Finanzas ── */}
                    {step === 2 && (<div>
                      <FInput label={t('lbl_bank')} required>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[{label: t('opt_yes') + ' 🏦', v:'Sí'},{label: t('opt_no'), v:'No'}].map(({label, v}) => (
                            <OptBtn key={v} label={label} selected={f.cuentaBanco === v} onClick={() => set('cuentaBanco', v)} />
                          ))}
                        </div>
                      </FInput>
                      <FInput label={t('lbl_payment_form')} required>
                        <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          {COBRO_OPTS.map(({ label, emoji }) => (
                            <OptBtn key={label} label={t('val_' + label, { defaultValue: label })} emoji={emoji} selected={f.formaCobro === label} onClick={() => set('formaCobro', label)} />
                          ))}
                        </div>
                      </FInput>
                      <FInput label={t('lbl_taxes_last_year')} required>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[{label: t('opt_yes') + ' ✅', v:'Sí'},{label: t('opt_no'), v:'No'}].map(({label, v}) => (
                            <OptBtn key={v} label={label} selected={f.presentoTaxes === v} onClick={() => set('presentoTaxes', v)} />
                          ))}
                        </div>
                      </FInput>
                      <AnimatePresence>
                        {f.presentoTaxes === 'Sí' && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            <FInput label={t('lbl_taxes_amount')}>
                              <div style={{ position:'relative' }}>
                                <span style={{ position:'absolute',left:15,top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--t3)',pointerEvents:'none' }}>$</span>
                                <input type="number" value={f.montoTaxes} onChange={e => set('montoTaxes', e.target.value)}
                                  onFocus={() => setFocused('mt')} onBlur={() => setFocused(null)}
                                  style={{ ...inp('mt'), paddingLeft: 30 }} placeholder="Ej: 45000" />
                              </div>
                            </FInput>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <FInput label={t('lbl_monthly_income')} required hint={t('hint_monthly_income')}>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute',left:15,top:'50%',transform:'translateY(-50%)',fontWeight:700,color:'var(--t3)',pointerEvents:'none' }}>$</span>
                          <input required type="number" value={f.ingresosMensuales} onChange={e => set('ingresosMensuales', e.target.value)}
                            onFocus={() => setFocused('im')} onBlur={() => setFocused(null)}
                            style={{ ...inp('im'), paddingLeft: 30 }} placeholder="Ej: 3500" />
                        </div>
                      </FInput>
                    </div>)}

                    {/* ── STEP 3: Empleo ── */}
                    {step === 3 && (<div>
                      <FInput label={t('lbl_workplace')} required hint={t('hint_workplace')}>
                        <input required autoFocus value={f.lugarTrabajo} onChange={e => set('lugarTrabajo', e.target.value)}
                          onFocus={() => setFocused('lt')} onBlur={() => setFocused(null)}
                          style={inp('lt')} placeholder="Ej: Amazon, restaurante, empresa..." />
                      </FInput>
                      <FInput label={t('lbl_rent_payment')} required>
                        <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                          {PAGO_OPTS.map(({ label, emoji }) => (
                            <OptBtn key={label} label={t('val_' + label, { defaultValue: label })} emoji={emoji}
                              selected={f.cashOPrograma === label}
                              onClick={() => { set('cashOPrograma', label); set('programaAsistencia', ''); }} />
                          ))}
                        </div>
                      </FInput>
                      <AnimatePresence>
                        {(f.cashOPrograma === 'Programas de asistencia' || f.cashOPrograma === 'Ambos (Cash + Programa)') && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            <FInput label={t('lbl_program')}>
                              <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                                {PROGRAMAS.map(v => (
                                  <OptBtn key={v} label={t('val_' + v, { defaultValue: v })} selected={f.programaAsistencia === v} onClick={() => set('programaAsistencia', v)} />
                                ))}
                              </div>
                            </FInput>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>)}

                    {/* ── STEP 4: Revisión ── */}
                    {step === 4 && (<div>
                      <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', padding: '8px 24px' }}>
                        <SRow label={"👤 " + t('lbl_fullname')}         value={f.nombreCompleto} hi />
                        {f.telefono && <SRow label={"📱 " + t('lbl_phone')}      value={f.telefono} />}
                        {f.direccion && <SRow label={"📍 " + t('lbl_address')}     value={f.direccion} />}
                        <SRow label={"👥 " + t('lbl_people')}       value={f.numPersonas} />
                        <SRow label={"🛏 " + t('lbl_rooms')}   value={f.numHabitaciones} />
                        <SRow label={"🎂 " + t('lbl_ages')}          value={f.edades} />
                        <SRow label={"🐾 " + t('lbl_pets')}        value={t('val_' + f.mascotas, { defaultValue: f.mascotas })} />
                        <SRow label={"🪪 " + t('lbl_id_type')}     value={`${t('val_' + f.tipoIdentificacion, { defaultValue: f.tipoIdentificacion })}${f.tipoIdOtro ? ` (${f.tipoIdOtro})` : ''}`} />
                        {f.numeroIdentificacion && <SRow label={"🔢 " + t('lbl_id_number', { type: 'ID' })}     value={f.numeroIdentificacion} />}
                        <SRow label={"🔐 " + t('lbl_tax_id')}     value={t('val_' + f.tipoSocial, { defaultValue: f.tipoSocial })} />
                        {f.numeroSocial && <SRow label={"🔢 " + t('lbl_tax_number', { type: 'Tax' })}         value={`***-**-${String(f.numeroSocial).slice(-4)}`} />}
                        <SRow label={"📊 " + t('lbl_credit_score')}   value={f.creditScore || '—'} />
                        <SRow label={"🏦 " + t('lbl_bank')}          value={t('val_' + f.cuentaBanco, { defaultValue: f.cuentaBanco })} />
                        <SRow label={"💵 " + t('lbl_payment_form')}          value={t('val_' + f.formaCobro, { defaultValue: f.formaCobro })} />
                        <SRow label={"📑 " + t('lbl_taxes_last_year')}          value={f.presentoTaxes === 'Sí' ? `${t('opt_yes')} ($${Number(f.montoTaxes||0).toLocaleString()})` : t('opt_no')} />
                        <SRow label={"🏢 " + t('lbl_workplace')}     value={f.lugarTrabajo} />
                        <SRow label={"💳 " + t('lbl_rent_payment')}     value={t('val_' + f.cashOPrograma, { defaultValue: f.cashOPrograma })} />
                        {f.programaAsistencia && <SRow label={"🤝 " + t('lbl_program')}       value={t('val_' + f.programaAsistencia, { defaultValue: f.programaAsistencia })} />}
                        <SRow label={"💰 " + t('lbl_monthly_income')}   value={`$${Number(f.ingresosMensuales||0).toLocaleString()}`} hi />
                      </div>
                    </div>)}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer nav */}
              <div className="form-footer-nav" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '32px 60px',
                borderTop: '1px solid #f1f5f9',
                background: '#fff',
              }}>
                {step > 0 ? (
                  <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={goBack}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 28px', borderRadius: 12, border: '2px solid #e2e8f0',
                      background: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
                      color: 'var(--t2)', cursor: 'pointer',
                    }}>
                    <ChevronLeft size={18} /> {t('back')}
                  </motion.button>
                ) : <div />}

                {step < 4 ? (
                  <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={goNext}
                    disabled={!canAdvance()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 44px', borderRadius: 12, border: 'none',
                      background: canAdvance() ? 'var(--accent)' : '#e2e8f0',
                      fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
                      color: canAdvance() ? '#fff' : '#94a3b8',
                      cursor: canAdvance() ? 'pointer' : 'not-allowed',
                      boxShadow: canAdvance() ? '0 4px 16px rgba(79,70,229,.2)' : 'none',
                    }}>
                    {t('next')} <ChevronRight size={18} />
                  </motion.button>
                ) : (
                  <motion.button type="submit" whileTap={{ scale: 0.98 }} disabled={submitting}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 44px', borderRadius: 12, border: 'none',
                      background: submitting ? '#e2e8f0' : '#10b981',
                      fontFamily: 'inherit', fontSize: 16, fontWeight: 800, color: '#fff',
                      cursor: submitting ? 'wait' : 'pointer',
                      boxShadow: submitting ? 'none' : '0 4px 16px rgba(16,185,129,.3)',
                    }}>
                    {submitting ? '⏳ ' + t('sending') : <><Check size={20} /> {t('submit')}</>}
                  </motion.button>
                )}
              </div>
            </form>
            <footer style={{ padding: '16px 20px', textAlign: 'center', borderTop: '1px dotted #e2e8f0', background: '#fafbff' }}>
              <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, margin: 0 }}>
                {t('sys_footer')} <span style={{ color: 'var(--accent)' }}>{t('brand_name')}</span> · {t('developed_by_text')}
              </p>
            </footer>
          </div>
        </div>

        {/* Responsive CSS */}
        <style>{`
          @media (max-width: 950px) {
            .form-main-card { 
               flex-direction: column !important; 
               min-height: 100dvh !important; 
               border-radius: 0 !important; 
               box-shadow: none !important;
               margin: 0 !important;
               width: 100vw !important;
               position: fixed !important;
               inset: 0 !important;
               z-index: 1000 !important;
            }
            .form-left-panel { display: none !important; }
            .form-right-panel { padding: 0 !important; height: 100% !important; }
            .form-header-bar { padding: 12px 16px !important; height: 70px !important; background: #fff !important; }
            .form-footer-nav { 
              padding: 16px !important; 
              flex-direction: column-reverse !important; 
              gap: 8px !important;
              padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important;
            }
            .form-footer-nav button { width: 100% !important; justify-content: center; height: 50px; font-size: 15px !important; }
            .mobile-grid-1 { grid-template-columns: 1fr !important; gap: 8px !important; }
            .mobile-opt-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
            
            /* Body padding adjustment */
            div[style*="padding: '40px 60px'"] { 
              padding: 20px 16px !important; 
              padding-bottom: 40px !important;
              flex: 1 !important;
            }
            
            form { height: calc(100dvh - 70px) !important; display: flex !important; flex-direction: column !important; }
          }
          @media (max-width: 480px) {
             .mobile-opt-grid { grid-template-columns: 1fr !important; }
             h2 { font-size: 18px !important; }
             .form-header-bar { padding: 12px 16px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
