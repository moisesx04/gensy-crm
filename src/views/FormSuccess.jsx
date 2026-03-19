import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ClipboardList } from 'lucide-react';

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

  const rows = f ? [
    ['👤 Nombre Completo',   f.nombreCompleto, true],
    ...(f.telefono ? [['📱 Teléfono', f.telefono]] : []),
    ...(f.direccion ? [['📍 Dirección', f.direccion]] : []),
    ['👥 Personas',          f.numPersonas],
    ['🛏 Habitaciones',      f.numHabitaciones],
    ['🎂 Edades',            f.edades],
    ['🐾 Mascotas',          f.mascotas],
    ['🪪 Tipo de ID',        f.tipoIdentificacion + (f.tipoIdOtro ? ` (${f.tipoIdOtro})` : '')],
    ...(f.numeroIdentificacion ? [['🔢 Número de ID',   f.numeroIdentificacion]] : []),
    ['🔐 No. Fiscal',        f.tipoSocial],
    ...(f.numeroSocial ? [['🔢 Número Fiscal',          `***-**-${String(f.numeroSocial).slice(-4)}`]] : []),
    ['📊 Credit Score',      f.creditScore || 'No indicado'],
    ['🏦 Cuenta de Banco',   f.cuentaBanco],
    ['💵 Forma de cobro',    f.formaCobro],
    ['📑 Presentó Taxes',    f.presentoTaxes === 'Sí' ? `Sí ($${Number(f.montoTaxes||0).toLocaleString()})` : 'No'],
    ['🏢 Trabaja en',        f.lugarTrabajo],
    ['💳 Pago de renta',     f.cashOPrograma],
    ...(f.programaAsistencia ? [['🤝 Programa',         f.programaAsistencia]] : []),
    ['💰 Ingresos/mes',      `$${Number(f.ingresosMensuales||0).toLocaleString()}`, true],
  ] : [];

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(145deg, #0a0f2e 0%, #0d1e5c 100%)',
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
          textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,.35)',
        }}
      >
        <style>{`
          @media (max-width: 600px) {
            .form-success-card { padding: 40px 24px !important; border-radius: 0 !important; }
            h2 { font-size: 24px !important; }
            .success-msg { font-size: 14.5px !important; }
          }
        `}</style>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 18 }}
          style={{ fontSize: 64, marginBottom: 16 }}
        >🎉</motion.div>

        <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0d1630', marginBottom: 12 }}>
          ¡Solicitud Enviada!
        </h2>
        <p style={{ fontSize: 16.5, color: '#5a6480', lineHeight: 1.7, marginBottom: 28 }}>
          Hemos recibido tu información correctamente.<br />
          Un agente de <strong style={{ color: '#0d1630' }}>GENSY Inmobiliario</strong> se pondrá en contacto contigo pronto.
        </p>

        <div style={{
          background: '#edf0ff', border: '1.5px solid rgba(79,110,247,.2)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 32,
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#4f6ef7' }}>
            ✅ Tu solicitud fue guardada exitosamente
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Ver Formulario — shows the filled data */}
          {f && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowData(true)}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                color: '#fff', fontFamily: 'inherit',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(79,110,247,.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              <ClipboardList size={20} /> Ver Formulario Completado
            </motion.button>
          )}

          {/* Back to home */}
          <Link to="/" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 12, cursor: 'pointer',
                background: 'transparent', border: '1.5px solid #e4e9f4',
                color: '#5a6480', fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
              }}
            >
              🏠 Volver a la Página Principal
            </motion.button>
          </Link>
        </div>
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
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(10,15,46,.65)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#fff', borderRadius: 20,
                width: '100%', maxWidth: 650,
                maxHeight: '88vh', overflowY: 'auto',
                boxShadow: '0 24px 64px rgba(0,0,0,.3)',
              }}
            >
              {/* Modal header */}
              <div style={{
                background: 'linear-gradient(135deg, #0d1630 0%, #1a296e 100%)',
                padding: '22px 24px', borderRadius: '20px 20px 0 0',
                display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 2,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                  background: 'linear-gradient(135deg, #4f6ef7, #e84f8c)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 20, color: '#fff',
                }}>
                  {(f?.nombreCompleto || '?').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{f?.nombreCompleto}</div>
                  <div style={{ color: 'rgba(255,255,255,.45)', fontSize: 11.5, marginTop: 2 }}>
                    Formulario de Pre-Calificación completado
                  </div>
                </div>
                <button onClick={() => setShowData(false)} style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'rgba(255,255,255,.1)', border: 'none',
                  color: '#fff', fontSize: 17, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={16} />
                </button>
              </div>

              {/* Rows */}
              <div>
                {rows.map(([lbl, val, hi], i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.025 * i }}
                    style={{ background: i % 2 === 0 ? '#fff' : '#fafbff' }}
                  >
                    <Row label={lbl} value={val} highlight={hi} />
                  </motion.div>
                ))}
              </div>

              <div style={{ padding: '20px 24px 24px' }}>
                <button onClick={() => setShowData(false)} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
                  color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
