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
          <div className="modal-hdr">
            <div className="modal-av">
              {(c.nombreCompleto || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="modal-hdr-name">{c.nombreCompleto}</div>
              <div className="modal-hdr-sub">
                {c.numPersonas} personas · {c.numHabitaciones} hab. · ${Number(c.ingresosMensuales||0).toLocaleString()}/mes
              </div>
            </div>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>

          {/* Rows */}
          <div style={{ padding: '6px 0' }}>
            {ROWS.map(([lbl, val, hi], i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '11px 22px', gap: 12,
                  borderBottom: '1px solid #f0f3fb',
                  background: i % 2 === 0 ? '#fff' : '#fafbff',
                }}
              >
                <span style={{ fontSize: 14.5, color: '#5a6480', fontWeight: 500 }}>{lbl}</span>
                <span style={{
                  fontSize: 15.5, fontWeight: 700,
                  color: hi ? '#4f6ef7' : '#0d1630',
                  textAlign: 'right', maxWidth: '60%',
                }}>
                  {val || '—'}
                </span>
              </motion.div>
            ))}
          </div>

          <div style={{ padding: '14px 22px 20px' }}>
            <motion.button
              className="btn btn-primary"
              style={{ width: '100%' }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
            >
              Cerrar
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
