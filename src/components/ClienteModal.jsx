import { motion, AnimatePresence } from 'framer-motion';

export default function ClienteModal({ cliente: c, onClose }) {
  if (!c) return null;

  const ROWS = [
    ['👤 Nombre Completo',   c.nombreCompleto, true],
    ...(c.telefono ? [['📱 Teléfono', c.telefono]] : []),
    ...(c.direccion ? [['📍 Dirección', c.direccion]] : []),
    ['👥 Personas',          c.numPersonas],
    ['🛏 Habitaciones',      c.numHabitaciones],
    ['🎂 Edades',            c.edades],
    ['🐾 Mascotas',          c.mascotas],
    ['🪪 Tipo de ID',        c.tipoIdentificacion + (c.tipoIdOtro ? ` (${c.tipoIdOtro})` : '')],
    ...(c.numeroIdentificacion ? [['🔢 Número de ID', c.numeroIdentificacion]] : []),
    ['🔐 No. Fiscal',        c.tipoSocial],
    ...(c.numeroSocial ? [['🔢 Número Fiscal', `***-**-${String(c.numeroSocial).slice(-4)}`]] : []),
    ['📊 Credit Score',      c.creditScore || 'No indicado'],
    ['🏦 Cuenta de Banco',   c.cuentaBanco],
    ['💵 Cobra',             c.formaCobro],
    ['📑 Taxes',             c.presentoTaxes === 'Sí' ? `Sí ($${Number(c.montoTaxes||0).toLocaleString()})` : 'No'],
    ['🏢 Trabaja en',        c.lugarTrabajo || '—'],
    ['💳 Pago de renta',     c.cashOPrograma],
    ...(c.programaAsistencia ? [['🤝 Programa', c.programaAsistencia]] : []),
    ['💰 Ingresos/mes',      `$${Number(c.ingresosMensuales||0).toLocaleString()}`, true],
    ['📅 Registro',          c.createdAt ? new Date(c.createdAt).toLocaleString('es-DO') : '—'],
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-box"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-hdr" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 18, color: '#fff',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)', flexShrink: 0
            }}>
              {(c.nombreCompleto || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ marginLeft: 16, flex: 1 }}>
              <div className="modal-hdr-name" style={{ color: 'var(--t1)' }}>{c.nombreCompleto}</div>
              <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 600 }}>
                {c.numPersonas} personas · {c.numHabitaciones} hab. · ${Number(c.ingresosMensuales||0).toLocaleString()}/mes
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: '#f1f5f9', color: 'var(--t2)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >✕</button>
          </div>

          {/* Rows */}
          <div style={{ padding: '4px 0' }}>
            {ROWS.map(([lbl, val, hi], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', gap: 12,
                  borderBottom: i === ROWS.length - 1 ? 'none' : '1px solid #f1f5f9',
                  background: i % 2 === 0 ? '#fff' : '#fcfdfe',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600, flexShrink: 0 }}>{lbl}</span>
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: hi ? 'var(--accent)' : 'var(--t1)',
                  textAlign: 'right', maxWidth: '70%',
                  wordBreak: 'break-word'
                }}>
                  {val || '—'}
                </span>
              </motion.div>
            ))}
          </div>

          <div style={{ padding: '24px 32px 32px' }}>
            <motion.button
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
            >
              Cerrar Detalle
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
