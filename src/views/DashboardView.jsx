import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscribeClientes } from '../lib/api';
import { TrendingUp, Copy, ExternalLink, BarChart3, Users2, Building2, Handshake } from 'lucide-react';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 15 },
  show:    { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function StatCard({ icon, label, val, color, bg, sub }) {
  return (
    <motion.div className="stat-card" variants={fadeUp} whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(13,22,48,.08)' }}>
      <div className="stat-icon" style={{ background: bg, fontSize: 22 }}>{icon}</div>
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
  if (diff < 60)    return 'Ahora';
  if (diff < 3600)  return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}

const COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function DashboardView() {
  const [clientes, setClientes] = useState([]);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => subscribeClientes(setClientes), []);

  // Performance Optimization: Memoized Stats
  const stats = useMemo(() => {
    const total = clientes.length;
    const now = new Date();
    const hoy = clientes.filter(c => new Date(c.createdAt).toDateString() === now.toDateString()).length;
    const conBanco = clientes.filter(c => c.cuentaBanco === 'Sí').length;
    
    // Improved programs logic - matching varied response strings
    const programas = clientes.filter(c => {
      const val = (c.cashOPrograma || '').toLowerCase();
      return val.includes('programa') || val.includes('ambos');
    }).length;

    const avgIncome = total > 0
      ? Math.round(clientes.reduce((a, c) => a + Number(c.ingresosMensuales || 0), 0) / total)
      : 0;

    const credits = clientes.filter(c => c.creditScore && !isNaN(c.creditScore));
    const avgCredit = credits.length > 0
      ? Math.round(credits.reduce((a, c) => a + Number(c.creditScore), 0) / credits.length)
      : '—';

    const conTaxes = clientes.filter(c => c.presentoTaxes === 'Sí').length;
    const conMascotas = clientes.filter(c => c.mascotas === 'Sí').length;
    const conID = clientes.filter(c => c.tipoSocial && c.tipoSocial !== 'Ninguno').length;

    return { total, hoy, conBanco, programas, avgIncome, avgCredit, conTaxes, conMascotas, conID };
  }, [clientes]);

  const STAT_CARDS = [
    { icon:<Users2 size={24}/>, label:'Solicitudes Totales', val: stats.total, color:'var(--accent)', bg:'var(--accent-light)', sub:'Total acumulado' },
    { icon:<BarChart3 size={24}/>, label:'Registros Hoy', val: stats.hoy, color:'var(--success)', bg:'#ecfdf5', sub:'Nuevos prospectos' },
    { icon:<Building2 size={24}/>, label:'Con Banco', val: stats.conBanco, color:'var(--warning)', bg:'#fffbeb', sub:`${Math.round((stats.conBanco/stats.total||0)*100)}% del total` },
    { icon:<Handshake size={24}/>, label:'Programas', val: stats.programas, color:'var(--secondary)', bg:'#f5f3ff', sub:'Asistencia activa' },
  ];

  const formLink = `${window.location.origin}/form`;

  function copyLink() {
    navigator.clipboard.writeText(formLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <motion.div className="pg-head" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <div>
          <h1>Dashboard</h1>
          <p>Gestión inteligente y métricas de tus prospectos GENSY.</p>
        </div>
        <div style={{ display:'flex', gap: 12 }}>
          <button className="btn btn-ghost hidden-mobile" onClick={copyLink}>
            {copied ? '✅ Copiado' : <><Copy size={16} /> Link</>}
          </button>
          <button className="btn btn-primary" onClick={() => window.open(formLink, '_blank')}>
            <ExternalLink size={16} /> Ver Formulario
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div className="stats-grid" variants={container} initial="hidden" animate="show">
        {STAT_CARDS.map((s, i) => <StatCard key={i} {...s} />)}
      </motion.div>

      <div className="dash-grid">
        {/* Left: Feed */}
        <motion.div className="card" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.2 }}>
          <div className="card-head">
            <h3>Últimas Solicitudes</h3>
            <button className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:12 }} onClick={() => navigate('/clientes')}>
              Ver todas
            </button>
          </div>
          {clientes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📂</div>
              <h3>Sin solicitudes todavía</h3>
              <p>Las nuevas solicitudes aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {clientes.slice(0, 10).map((c, i) => (
                <div key={c.id || i} className="feed-item">
                  <div className="feed-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="feed-text">
                    <strong>{c.nombreCompleto}</strong> de {c.lugarTrabajo || 'Empresa no ind.'}<br/>
                    <span style={{ fontSize:12, color:'var(--t3)' }}>
                      {c.numPersonas} pers · {c.numHabitaciones} hab · {c.tipoIdentificacion}
                    </span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:'var(--accent)' }}>
                      ${Number(c.ingresosMensuales||0).toLocaleString()} <small style={{ fontSize:10, fontWeight:600 }}>/mes</small>
                    </div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{fmtDate(c.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right: Summary */}
        <motion.div className="card" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.3 }}>
          <div className="card-head">
            <h3>Perfil Financiero</h3>
            <TrendingUp size={16} color="var(--accent)" />
          </div>
          <div style={{ padding: '8px 0' }}>
            {[
              ['Ingreso mensual promedio', `$${stats.avgIncome.toLocaleString()}/mes`],
              ['Puntaje de Crédito prom.', stats.avgCredit],
              ['Con declaración de taxes', `${stats.conTaxes} de ${stats.total}`],
              ['Con mascotas en hogar', `${stats.conMascotas} de ${stats.total}`],
              ['Con SSN o ITIN válido', `${stats.conID} de ${stats.total}`],
              ['Con cuenta bancaria', `${stats.conBanco} de ${stats.total}`],
            ].map(([lbl, val], i) => (
              <div key={i} className="rank-item">
                <div className="rank-info">
                  <p style={{ fontSize:13, fontWeight:600, color:'var(--t2)' }}>{lbl}</p>
                </div>
                <strong style={{ fontSize:14 }}>{val}</strong>
              </div>
            ))}
          </div>
          <div style={{ padding:24, background:'#f8fafc', borderTop:'1px solid var(--card-border)', textAlign:'center' }}>
            <p style={{ fontSize:12, color:'var(--t3)', lineHeight:1.5 }}>
              Basado en el análisis de <strong>{stats.total}</strong> prospectos registrados.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
