import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList, Globe, Edit2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

function Row({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '12px 24px', gap: 12,
      borderBottom: '1px solid #f0f3fb',
    }}>
      <span style={{ fontSize: 14.5, color: '#5a6480', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontSize: 15.5, fontWeight: 700, color: highlight ? '#4f6ef7' : '#0d1630', textAlign: 'right', maxWidth: '60%' }}>
        {value || '—'}
      </span>
    </div>
  );
}

export default function FormSuccess() {
  const { state } = useLocation();
  const f = state?.formData;
  const [showData, setShowData] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const rows = f ? [
    ['👤 ' + t('lbl_fullname'),   f.nombreCompleto, true],
    ...(f.telefono ? [['📱 ' + t('lbl_phone'), f.telefono]] : []),
    ...(f.direccion ? [['📍 ' + t('lbl_address'), f.direccion]] : []),
    ['👥 ' + t('lbl_people'),          f.numPersonas],
    ['🛏 ' + t('lbl_rooms'),      f.numHabitaciones],
    ['🎂 ' + t('lbl_ages'),            f.edades],
    ['🐾 ' + t('lbl_pets'),          f.mascotas],
    ['🪪 ' + t('lbl_id_type'),        t('val_' + f.tipoIdentificacion, { defaultValue: f.tipoIdentificacion }) + (f.tipoIdOtro ? ` (${f.tipoIdOtro})` : '')],
    ...(f.numeroIdentificacion ? [['🔢 ' + t('lbl_id_number', { type: 'ID' }),   f.numeroIdentificacion]] : []),
    ['🔐 ' + t('lbl_tax_id'),        t('val_' + f.tipoSocial, { defaultValue: f.tipoSocial })],
    ...(f.numeroSocial ? [['🔢 ' + t('lbl_tax_number', { type: 'Tax' }),          `***-**-${String(f.numeroSocial).slice(-4)}`]] : []),
    ['📊 ' + t('lbl_credit_score'),      f.creditScore || '—'],
    ['🏦 ' + t('lbl_bank'),   t('val_' + f.cuentaBanco, { defaultValue: f.cuentaBanco })],
    ['💵 ' + t('lbl_payment_form'),    t('val_' + f.formaCobro, { defaultValue: f.formaCobro })],
    ['📑 ' + t('lbl_taxes_last_year'),    f.presentoTaxes === 'Sí' ? `${t('opt_yes')} ($${Number(f.montoTaxes||0).toLocaleString()})` : t('opt_no')],
    ['🏢 ' + t('lbl_workplace'),        f.lugarTrabajo],
    ['💳 ' + t('lbl_rent_payment'),     t('val_' + f.cashOPrograma, { defaultValue: f.cashOPrograma })],
    ...(f.programaAsistencia ? [['🤝 ' + t('lbl_program'),         t('val_' + f.programaAsistencia, { defaultValue: f.programaAsistencia })]] : []),
    ['💰 ' + t('lbl_monthly_income'),      `$${Number(f.ingresosMensuales||0).toLocaleString()}`, true],
  ] : [];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif",
      overflow: 'auto',
    }}>
      <motion.div
        className="form-success-card"
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        style={{
          background: '#fff', borderRadius: 24,
          padding: '56px 48px', maxWidth: 580, width: '100%',
          textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <button 
            type="button"
            onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
        <style>{`
          @media (max-width: 600px) {
            .form-success-card { 
              padding: 40px 20px !important; 
              border-radius: 20px !important; 
              box-shadow: none !important;
              max-width: 100% !important;
            }
            h2 { font-size: 24px !important; }
            .success-msg { font-size: 14.5px !important; }
            button { font-size: 15px !important; padding: 14px 20px !important; }
          }
          @media (max-width: 400px) {
            .form-success-card { padding: 32px 16px !important; }
            h2 { font-size: 20px !important; }
            div[style*="font-size: 56"] { width: 80px !important; height: 80px !important; font-size: 44px !important; }
          }
        `}</style>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 18 }}
          style={{ 
            fontSize: 56, marginBottom: 20,
            width: 96, height: 96, borderRadius: '50%',
            background: '#f0fdf4', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}
        >🎉</motion.div>

        <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--t1)', marginBottom: 12, letterSpacing: '-0.03em' }}>
          {t('success_title')}
        </h2>
        <p style={{ fontSize: 16, color: 'var(--t3)', lineHeight: 1.7, marginBottom: 32, fontWeight: 500 }}>
          {t('success_desc1')}<br />
          {t('success_desc2')}<strong style={{ color: 'var(--accent)' }}>{t('brand_name')}</strong>{t('success_desc3')}
        </p>

        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 14, padding: '16px 20px', marginBottom: 36,
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span> {t('success_saved')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Ver Formulario — shows the filled data */}
          {f && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowData(true)}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none',
                background: 'var(--accent)',
                color: '#fff', fontFamily: 'inherit',
                fontSize: 16, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <ClipboardList size={20} /> {t('view_form_data')}
            </motion.button>
          )}

          {/* Edit Button */}
          {f && f.id && (
            <Link to="/form" state={{ editDato: f }} style={{ textDecoration: 'none' }}>
              <motion.button
                whileHover={{ scale: 1.02, background: '#e0e7ff' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 14, cursor: 'pointer',
                  background: '#f1f5f9', border: 'none',
                  color: 'var(--accent)', fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
              >
                <Edit2 size={20} /> {language === 'es' ? 'Editar Información' : 'Edit Information'}
              </motion.button>
            </Link>
          )}

          {/* Back to home */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02, background: '#f8fafc' }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 14, cursor: 'pointer',
                background: 'transparent', border: '2px solid #e2e8f0',
                color: 'var(--t2)', fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
              }}
            >
              🏠 {t('back_to_home')}
            </motion.button>
          </Link>
        </div>
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 32, fontWeight: 700 }}>
          {t('developed_by_text')}
        </p>
      </motion.div>

      {/* ── Data modal ─────────────────────────────── */}
      <AnimatePresence>
        {showData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowData(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 24,
                width: '100%', maxWidth: 650,
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              }}
            >
              {/* Modal header */}
              <div style={{
                background: '#f8fafc',
                padding: '24px 32px', borderBottom: '1px solid #f1f5f9',
                display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 10,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 20, color: '#fff',
                }}>
                  {(f?.nombreCompleto || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--t1)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>{f?.nombreCompleto}</div>
                  <div style={{ color: 'var(--t3)', fontSize: 12, marginTop: 2, fontWeight: 500 }}>
                    {t('modal_form_title')}
                  </div>
                </div>
                <button onClick={() => setShowData(false)} style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#fff', border: '1px solid #e2e8f0',
                  color: 'var(--t2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#fff'}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Rows */}
              <div style={{ padding: '8px 0' }}>
                {rows.map(([lbl, val, hi], i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                  >
                    <Row label={lbl} value={val} highlight={hi} />
                  </motion.div>
                ))}
              </div>

              <div style={{ padding: '24px 32px 32px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <button onClick={() => setShowData(false)} style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                  background: 'var(--accent)',
                  color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 800,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                }}>
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
