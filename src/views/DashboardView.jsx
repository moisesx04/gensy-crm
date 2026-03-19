import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscribeClientes } from '../lib/api';
import { TrendingUp, Copy, ExternalLink } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  show:    { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

function StatCard({ icon, label, val, color, bg, sub }) {
  return (
    <motion.div className="stat-card" variants={fadeUp} whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(13,22,48,.10)' }}>
      <div className="stat-icon" style={{ background: bg }}>{icon}</div>
      <div className="stat-val" style={{ color }}>{val}</div>
      <div className="stat-lbl">{label}</div>
      <div className="stat-sub">{sub}</div>
    </motion.div>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return 'Ahora mismo';
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('es-DO');
}

const COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function DashboardView() {
  const [clientes, setClientes] = useState([]);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => subscribeClientes(setClientes), []);

  const total    = clientes.length;
  const hoy      = clientes.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).length;
  const conBanco = clientes.filter(c => c.cuentaBanco === 'Sí').length;
  const programas = clientes.filter(c => (c.cashOPrograma || '').toLowerCase().includes('programa') || c.cashOPrograma === 'Ambos (Cash + Programa)').length;

  const STATS = [
    { icon:'📋', label:'Solicitudes Totales',   val: total,    color:'var(--accent)', bg:'var(--accent-light)', sub:'Registros en el sistema' },
    { icon:'📅', label:'Registros Hoy',          val: hoy,      color:'var(--success)', bg:'#ecfdf5', sub:'Enviados hoy' },
    { icon:'🏦', label:'Con Cuenta Bancaria',    val: conBanco, color:'var(--warning)', bg:'#fffbeb', sub:`de ${total} clientes` },
    { icon:'🤝', label:'Con Programas',          val: programas,color:'var(--secondary)', bg:'#f5f3ff', sub:'Asistencia de vivienda' },
  ];

  const formLink = `${window.location.origin}/form`;

  function copyLink() {
    navigator.clipboard.writeText(formLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Financial summary
  const avgIncome = total > 0
    ? Math.round(clientes.reduce((a, c) => a + Number(c.ingresosMensuales || 0), 0) / total)
    : 0;
  const avgCredit = clientes.filter(c => c.creditScore).length > 0
    ? Math.round(clientes.filter(c => c.creditScore).reduce((a, c) => a + Number(c.creditScore), 0) / clientes.filter(c => c.creditScore).length)
    : null;

  return (
    <div className="page">
      <motion.div className="pg-head" initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration: 0.4 }}>
        <div>
          <h1>Dashboard</h1>
          <p>Resumen en tiempo real de todas las solicitudes.</p>
        </div>
        <div className="pg-actions">
          <motion.button className="btn btn-primary" whileTap={{ scale: 0.97 }} onClick={copyLink}>
            {copied ? <><span>✅</span> ¡Copiado!</> : <><Copy size={14} /> Copiar Link del Formulario</>}
          </motion.button>
          <motion.a href={formLink} target="_blank" rel="noreferrer"
            className="btn btn-ghost" whileTap={{ scale: 0.97 }}>
            <ExternalLink size={14} /> Ver Formulario
          </motion.a>
        </div>
      </motion.div>

      {/* Link box */}
      <motion.div className="link-box" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.1 }}
        style={{ background: '#f8fafc', border: '1px solid var(--card-border)' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'var(--accent)', flexShrink:0 }}>🔗 Link del cliente:</span>
        <code style={{ flex:1, fontFamily:'monospace', fontSize:12.5, color:'var(--t2)', wordBreak:'break-all' }}>{formLink}</code>
        <motion.button className="btn btn-primary" style={{ padding:'6px 13px', fontSize:12 }}
          whileTap={{ scale: 0.95 }} onClick={copyLink}>
          {copied ? '✅' : 'Copiar'}
        </motion.button>
      </motion.div>

      {/* Stats */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show">
        {STATS.map((s, i) => <StatCard key={i} {...s} />)}
      </motion.div>

      {/* Bottom */}
      <div className="dash-grid">
        {/* Feed */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.3 }}>
          <div className="card-head">
            <h3>Últimas Solicitudes</h3>
            <button className="btn btn-ghost" style={{ padding:'5px 11px', fontSize:12 }} onClick={() => navigate('/clientes')}>
              Ver todas →
            </button>
          </div>
          {clientes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <h3>Sin solicitudes aún</h3>
              <p>Comparte el link del formulario con tus clientes para empezar a recibir registros aquí.</p>
            </div>
          ) : (
            <div>
              {clientes.slice(0, 7).map((c, i) => (
                <motion.div key={c.id} className="feed-item"
                  initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.05 * i }}>
                  <div className="feed-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="feed-text">
                    <strong>{c.nombreCompleto}</strong> —{' '}
                    {c.numPersonas} per. · {c.numHabitaciones} hab.
                    {c.cashOPrograma && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>• {c.cashOPrograma}</span>}
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:700, fontSize:12, color:'var(--accent)' }}>${Number(c.ingresosMensuales||0).toLocaleString()}/mes</div>
                    <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:1 }}>{fmtDate(c.createdAt)}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick stats */}
        <motion.div className="card" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.35 }}>
          <div className="card-head"><h3>Resumen Financiero</h3><TrendingUp size={15} color="var(--t3)" /></div>
          {clientes.length === 0 ? (
            <div className="empty" style={{ padding:'40px 20px' }}>
              <div className="empty-icon" style={{ fontSize:36 }}>📊</div>
              <p>Sin datos aún</p>
            </div>
          ) : (
            <div>
              {[
                ['💵 Ingreso promedio',  `$${avgIncome.toLocaleString()}/mes`],
                ['📊 Credit Score prom', avgCredit ? String(avgCredit) : 'N/A'],
                ['📑 Con taxes',         `${clientes.filter(c => c.presentoTaxes === 'Sí').length} de ${total}`],
                ['🐾 Con mascotas',      `${clientes.filter(c => c.mascotas === 'Sí').length} de ${total}`],
                ['🪪 Con SSN/ITIN',      `${clientes.filter(c => c.tipoSocial && c.tipoSocial !== 'Ninguno').length} de ${total}`],
                ['🏦 Con banco',         `${conBanco} de ${total}`],
              ].map(([lbl, val], i) => (
                <motion.div key={i} className="rank-item"
                  initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.06 * i + 0.3 }}>
                  <div className="rank-info"><p style={{ fontSize:13 }}>{lbl}</p></div>
                  <strong style={{ fontSize:13, color:'var(--accent)' }}>{val}</strong>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
