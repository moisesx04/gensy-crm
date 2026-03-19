import { useState } from 'react';
import { addCliente } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, FileText, DollarSign, Briefcase, ClipboardList, Shield, Clock, Star } from 'lucide-react';

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
  { icon: User,          label: 'Personal',   title: 'Información Personal',        sub: 'Datos básicos de los aplicantes.' },
  { icon: FileText,      label: 'Documentos', title: 'Identificación y Documentos', sub: 'Tus documentos de identidad y fiscal.' },
  { icon: DollarSign,    label: 'Finanzas',   title: 'Situación Financiera',        sub: 'Ingresos, banco y taxes.' },
  { icon: Briefcase,     label: 'Empleo',     title: 'Empleo y Tipo de Pago',       sub: 'Trabajo y forma de pago de renta.' },
  { icon: ClipboardList, label: 'Revisión',   title: 'Revisión Final',              sub: 'Confirma antes de enviar.' },
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
        border: `2px solid ${selected ? '#4f6ef7' : '#e4e9f4'}`,
        background: selected ? 'linear-gradient(135deg,#edf0ff,#f3f1ff)' : '#fafbff',
        fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
        color: selected ? '#4f6ef7' : '#5a6480',
        cursor: 'pointer', transition: 'border-color .15s, background .15s',
        textAlign: 'left', position: 'relative',
      }}
    >
      {emoji && <span style={{ fontSize: 20 }}>{emoji}</span>}
      <span style={{ flex: 1 }}>{label}</span>
      {selected && (
        <span style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: '#4f6ef7', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
      <span style={{ fontSize: 15.5, fontWeight: 700, color: hi ? '#4f6ef7' : '#0d1630', textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────── */
export default function FormView() {
  const navigate   = useNavigate();
  const [step, setStep]           = useState(0);
  const [dir, setDir]             = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [f, setF]                 = useState(EMPTY);
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
      await addCliente(saved);
      navigate('/form/gracias', { state: { formData: saved } });
    } catch {
      alert('Error al enviar. Verifica tu conexión e intenta de nuevo.');
      setSubmitting(false);
    }
  }

  const S = STEPS[step];
  const Icon = S.icon;
  const variant = dir === 1 ? slideRight : slideLeft;

  /* Focus styles helper */
  const inp = (name) => ({
    ...INP,
    borderColor: focused === name ? '#4f6ef7' : '#e4e9f4',
    boxShadow: focused === name ? '0 0 0 3px rgba(79,110,247,.12)' : 'none',
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
          minHeight: 750,
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
                <div style={{ color: 'var(--t1)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>GENSY</div>
                <div style={{ color: 'var(--t3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Inmobiliario</div>
              </div>
            </div>

            {/* Steps sidebar */}
            <div style={{ flex: 1 }}>
              <p style={{ color: 'var(--t3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 800, marginBottom: 20 }}>
                Tu progreso
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
                        }}>{s.label}</div>
                        {active && (
                          <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>{s.sub}</div>
                        )}
                      </div>
                  </div>
                );
              })}
            </div>

            {/* Trust badges */}
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
              {[
                { icon: Shield,  text: '100% Confidencial' },
                { icon: Clock,   text: `Paso ${step + 1} de ${STEPS.length}` },
                { icon: Star,    text: 'Proceso 100% gratis' },
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
              padding: '32px 60px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', gap: 15,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color="var(--accent)" />
              </div>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', margin: 0, letterSpacing: '-0.03em' }}>{S.title}</h2>
                <p style={{ fontSize: 14, color: 'var(--t3)', margin: 0, marginTop: 2, fontWeight: 500 }}>{S.sub}</p>
              </div>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    height: 6, borderRadius: 99,
                    width: i === step ? 32 : 6,
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
                      <FInput label="Nombre Completo" required hint="Tal como aparece en su documento de identidad.">
                        <input autoFocus required value={f.nombreCompleto}
                          onChange={e => set('nombreCompleto', e.target.value)}
                          onFocus={() => setFocused('nc')} onBlur={() => setFocused(null)}
                          style={inp('nc')} placeholder="Ej: Juan Carlos Pérez Rodríguez" />
                      </FInput>

                      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <FInput label="¿Cuántas personas?" required>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>👥</span>
                            <input required type="number" min="1" max="20" value={f.numPersonas}
                              onChange={e => set('numPersonas', e.target.value)}
                              onFocus={() => setFocused('np')} onBlur={() => setFocused(null)}
                              style={{ ...inp('np'), paddingLeft: 46 }} placeholder="Ej: 4" />
                          </div>
                        </FInput>
                        <FInput label="Habitaciones requeridas" required>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>🛏</span>
                            <input required type="number" min="0" max="10" value={f.numHabitaciones}
                              onChange={e => set('numHabitaciones', e.target.value)}
                              onFocus={() => setFocused('nh')} onBlur={() => setFocused(null)}
                              style={{ ...inp('nh'), paddingLeft: 46 }} placeholder="Ej: 3" />
                          </div>
                        </FInput>
                      </div>

                      <FInput label="Edades de todos los ocupantes" required hint="Separa con comas (o usa espacio para añadir coma).">
                        <input required value={f.edades} onChange={handleEdadesChange}
                          onFocus={() => setFocused('ed')} onBlur={() => setFocused(null)}
                          style={inp('ed')} placeholder="Ej: 38, 35, 12, 8" />
                      </FInput>

                      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <FInput label="Teléfono (Opcional)">
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>📱</span>
                            <input value={f.telefono}
                              onChange={e => set('telefono', e.target.value)}
                              onFocus={() => setFocused('tel')} onBlur={() => setFocused(null)}
                              style={{ ...inp('tel'), paddingLeft: 46 }} placeholder="Celular o residencial" />
                          </div>
                        </FInput>
                        <FInput label="Dirección actual (Opcional)">
                          <div style={{ position: 'relative' }}>
                            <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',fontSize:18,pointerEvents:'none' }}>📍</span>
                            <input value={f.direccion}
                              onChange={e => set('direccion', e.target.value)}
                              onFocus={() => setFocused('dir')} onBlur={() => setFocused(null)}
                              style={{ ...inp('dir'), paddingLeft: 46 }} placeholder="Calle, apt, ciudad" />
                          </div>
                        </FInput>
                      </div>

                      <FInput label="¿Tendrá mascotas en la propiedad?" required>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <OptBtn label="Sí 🐾"  selected={f.mascotas === 'Sí'} onClick={() => set('mascotas', 'Sí')} />
                          <OptBtn label="No"     selected={f.mascotas === 'No'} onClick={() => set('mascotas', 'No')} />
                        </div>
                      </FInput>
                    </div>)}

                    {/* ── STEP 1: Documentos ── */}
                    {step === 1 && (<div>
                      <FInput label="Tipo de Identificación" required>
                        <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                          {TIPO_ID.map(({ label, emoji }) => (
                            <OptBtn key={label} label={label} emoji={emoji}
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
                              <FInput label="Especifique el tipo">
                                <input value={f.tipoIdOtro} onChange={e => set('tipoIdOtro', e.target.value)}
                                  onFocus={() => setFocused('idotro')} onBlur={() => setFocused(null)}
                                  style={inp('idotro')} placeholder="Describe el tipo de ID..." />
                              </FInput>
                            )}
                            <FInput label={`Número del ${f.tipoIdentificacion}`} hint="Ingrésalo exactamente como aparece en el documento.">
                              <input value={f.numeroIdentificacion} onChange={e => set('numeroIdentificacion', e.target.value)}
                                onFocus={() => setFocused('nid')} onBlur={() => setFocused(null)}
                                style={inp('nid')} placeholder="Ej: A12345678" />
                            </FInput>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FInput label="Número de identificación fiscal" required>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {SOCIAL_OPTS.map(({ label, emoji }) => (
                            <OptBtn key={label} label={label} emoji={emoji}
                              selected={f.tipoSocial === label}
                              onClick={() => { set('tipoSocial', label); set('numeroSocial', ''); }} />
                          ))}
                        </div>
                      </FInput>

                      <AnimatePresence>
                        {f.tipoSocial && f.tipoSocial !== 'Ninguno' && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            <FInput label={`Número de ${f.tipoSocial}`} hint="Formato: 123-45-6789">
                              <input value={f.numeroSocial} onChange={e => set('numeroSocial', e.target.value)}
                                onFocus={() => setFocused('ns')} onBlur={() => setFocused(null)}
                                style={inp('ns')} placeholder="123-45-6789" maxLength={11} />
                            </FInput>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <FInput label="Credit Score (opcional)" hint="Déjalo en blanco si no lo sabes.">
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
                      <FInput label="¿Tiene cuenta de banco?" required>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[{label:'Sí 🏦', v:'Sí'},{label:'No', v:'No'}].map(({label, v}) => (
                            <OptBtn key={v} label={label} selected={f.cuentaBanco === v} onClick={() => set('cuentaBanco', v)} />
                          ))}
                        </div>
                      </FInput>
                      <FInput label="¿Cómo cobra su salario?" required>
                        <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                          {COBRO_OPTS.map(({ label, emoji }) => (
                            <OptBtn key={label} label={label} emoji={emoji} selected={f.formaCobro === label} onClick={() => set('formaCobro', label)} />
                          ))}
                        </div>
                      </FInput>
                      <FInput label="¿Presentó Taxes el último año?" required>
                        <div style={{ display: 'flex', gap: 12 }}>
                          {[{label:'Sí ✅', v:'Sí'},{label:'No', v:'No'}].map(({label, v}) => (
                            <OptBtn key={v} label={label} selected={f.presentoTaxes === v} onClick={() => set('presentoTaxes', v)} />
                          ))}
                        </div>
                      </FInput>
                      <AnimatePresence>
                        {f.presentoTaxes === 'Sí' && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            <FInput label="Monto de ingresos en los taxes">
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
                      <FInput label="Ingresos mensuales totales del hogar" required hint="Suma de todos los ingresos de las personas que van a aplicar.">
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
                      <FInput label="¿Dónde trabaja actualmente?" required hint="Si tiene varios trabajos, mencione el principal.">
                        <input required autoFocus value={f.lugarTrabajo} onChange={e => set('lugarTrabajo', e.target.value)}
                          onFocus={() => setFocused('lt')} onBlur={() => setFocused(null)}
                          style={inp('lt')} placeholder="Ej: Amazon, restaurante, empresa..." />
                      </FInput>
                      <FInput label="¿Cómo planea pagar la renta?" required>
                        <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                          {PAGO_OPTS.map(({ label, emoji }) => (
                            <OptBtn key={label} label={label} emoji={emoji}
                              selected={f.cashOPrograma === label}
                              onClick={() => { set('cashOPrograma', label); set('programaAsistencia', ''); }} />
                          ))}
                        </div>
                      </FInput>
                      <AnimatePresence>
                        {(f.cashOPrograma === 'Programas de asistencia' || f.cashOPrograma === 'Ambos (Cash + Programa)') && (
                          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }}
                            exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                            <FInput label="¿Qué programa de asistencia utiliza?">
                              <div className="mobile-opt-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                                {PROGRAMAS.map(v => (
                                  <OptBtn key={v} label={v} selected={f.programaAsistencia === v} onClick={() => set('programaAsistencia', v)} />
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
                        <SRow label="👤 Nombre"         value={f.nombreCompleto} hi />
                        {f.telefono && <SRow label="📱 Teléfono"      value={f.telefono} />}
                        {f.direccion && <SRow label="📍 Dirección"     value={f.direccion} />}
                        <SRow label="👥 Personas"       value={f.numPersonas} />
                        <SRow label="🛏 Habitaciones"   value={f.numHabitaciones} />
                        <SRow label="🎂 Edades"          value={f.edades} />
                        <SRow label="🐾 Mascotas"        value={f.mascotas} />
                        <SRow label="🪪 Tipo de ID"     value={`${f.tipoIdentificacion}${f.tipoIdOtro ? ` (${f.tipoIdOtro})` : ''}`} />
                        {f.numeroIdentificacion && <SRow label="🔢 Número ID"     value={f.numeroIdentificacion} />}
                        <SRow label="🔐 No. Fiscal"     value={f.tipoSocial} />
                        {f.numeroSocial && <SRow label="🔢 Número Fiscal"         value={`***-**-${String(f.numeroSocial).slice(-4)}`} />}
                        <SRow label="📊 Credit Score"   value={f.creditScore || 'No indicado'} />
                        <SRow label="🏦 Banco"          value={f.cuentaBanco} />
                        <SRow label="💵 Cobra"          value={f.formaCobro} />
                        <SRow label="📑 Taxes"          value={f.presentoTaxes === 'Sí' ? `Sí ($${Number(f.montoTaxes||0).toLocaleString()})` : 'No'} />
                        <SRow label="🏢 Trabaja en"     value={f.lugarTrabajo} />
                        <SRow label="💳 Pago renta"     value={f.cashOPrograma} />
                        {f.programaAsistencia && <SRow label="🤝 Programa"       value={f.programaAsistencia} />}
                        <SRow label="💰 Ingresos/mes"   value={`$${Number(f.ingresosMensuales||0).toLocaleString()}`} hi />
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
                    <ChevronLeft size={18} /> Atrás
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
                    Siguiente <ChevronRight size={18} />
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
                    {submitting ? '⏳ Enviando...' : <><Check size={20} /> Enviar Solicitud</>}
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Responsive CSS */}
        <style>{`
          @media (max-width: 950px) {
            .form-main-card { 
               flex-direction: column !important; 
               min-height: auto !important; 
               border-radius: 0 !important; 
               box-shadow: none !important;
            }
            .form-left-panel { display: none !important; }
            .form-right-panel { padding: 0 !important; }
            .form-header-bar { padding: 30px 20px !important; }
            .form-footer-nav { padding: 24px 20px !important; flex-wrap: wrap; gap: 12px; }
            .form-footer-nav button { width: 100% !important; justify-content: center; }
            .mobile-grid-1 { grid-template-columns: 1fr !important; gap: 12px !important; }
            .mobile-opt-grid { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
            div[style*="padding: '40px 60px'"] { padding: 30px 20px !important; }
          }
          @media (max-width: 480px) {
             .mobile-opt-grid { grid-template-columns: 1fr !important; }
             h2 { font-size: 20px !important; }
          }
        `}</style>
      </div>
    </div>
  );
}
