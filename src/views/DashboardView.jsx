import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscribeClientes } from '../lib/api';
import { TrendingUp, Copy, ExternalLink, BarChart3, Users2, Building2, Handshake } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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

function fmtDate(iso, t) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60)    return t('dash_now');
  if (diff < 3600)  return `${Math.floor(diff / 60)} ${t('dash_min')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${t('dash_h')}`;
  return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}

const COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4'];

export default function DashboardView() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    return subscribeClientes(data => {
      setClientes(data);
      setLoading(false);
      setError(null);
    }, err => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });
  }, []);

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
    { icon:<Users2 size={24}/>, label:t('dash_stat_total'), val: stats.total, color:'var(--accent)', bg:'var(--accent-light)', sub:t('dash_stat_total_sub') },
    { icon:<BarChart3 size={24}/>, label:t('dash_stat_today'), val: stats.hoy, color:'var(--success)', bg:'#ecfdf5', sub:t('dash_stat_today_sub') },
    { icon:<Building2 size={24}/>, label:t('dash_stat_bank'), val: stats.conBanco, color:'var(--warning)', bg:'#fffbeb', sub:`${Math.round((stats.conBanco/stats.total||0)*100)}${t('dash_stat_bank_sub')}` },
    { icon:<Handshake size={24}/>, label:t('dash_stat_prog'), val: stats.programas, color:'var(--secondary)', bg:'#f5f3ff', sub:t('dash_stat_prog_sub') },
  ];

  const formLink = `${window.location.origin}/form`;
  const chatLink = `${window.location.origin}/chat`;

  function copyLink() {
    navigator.clipboard.writeText(formLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyChatLink() {
    navigator.clipboard.writeText(chatLink).catch(() => {});
    setCopiedChat(true);
    setTimeout(() => setCopiedChat(false), 2000);
  }

  return (
    <div className="page" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <motion.div className="pg-head" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <div>
          <h1>{t('dash_title')}</h1>
          <p>{t('dash_desc')}</p>
        </div>
        <div style={{ display:'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={copyLink} style={{ flex: 1, justifyContent: 'center' }}>
            {copied ? `✅ Formulario Copiado` : <><Copy size={16} /> Link Formulario</>}
          </button>
          <button className="btn btn-ghost" onClick={copyChatLink} style={{ flex: 1, justifyContent: 'center' }}>
            {copiedChat ? `✅ ChatBot Copiado` : <><Copy size={16} /> Link Chatbot</>}
          </button>
          <button className="btn btn-primary" onClick={() => window.open(formLink, '_blank')} style={{ flex: '1 1 100%', justifyContent: 'center' }}>
            <ExternalLink size={16} /> {t('dash_view_form')}
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
            <h3>{t('dash_recent')}</h3>
            <button className="btn btn-ghost" style={{ padding:'6px 14px', fontSize:12 }} onClick={() => navigate('/clientes')}>
              {t('dash_view_all')}
            </button>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)' }}>{t('cli_loading')}</div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
              <p>Error: {error}</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">📂</div>
              <h3>{t('dash_empty')}</h3>
              <p>{t('dash_empty_sub')}</p>
            </div>
          ) : (
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {clientes.slice(0, 10).map((c, i) => (
                <div key={c.id || i} className="feed-item">
                  <div className="feed-dot" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="feed-text">
                    <strong>{c.nombreCompleto}</strong> {t('dash_of')} {c.lugarTrabajo || t('dash_no_company')}<br/>
                    <span style={{ fontSize:12, color:'var(--t3)' }}>
                      {c.numPersonas} {t('dash_pers')} · {c.numHabitaciones} {t('dash_hab')} · {t('val_' + c.tipoIdentificacion, { defaultValue: c.tipoIdentificacion })}
                    </span>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:800, fontSize:14, color:'var(--accent)' }}>
                      ${Number(c.ingresosMensuales||0).toLocaleString()} <small style={{ fontSize:10, fontWeight:600 }}>{t('dash_per_month')}</small>
                    </div>
                    <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{fmtDate(c.createdAt, t)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right: Summary */}
        <motion.div className="card" initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: 0.3 }}>
          <div className="card-head">
            <h3>{t('dash_fin_profile')}</h3>
            <TrendingUp size={16} color="var(--accent)" />
          </div>
          <div style={{ padding: '8px 0' }}>
            {[
              [t('dash_avg_income'), `$${stats.avgIncome.toLocaleString()}${t('dash_per_month')}`],
              [t('dash_avg_credit'), stats.avgCredit],
              [t('dash_with_taxes'), `${stats.conTaxes} ${t('dash_of')} ${stats.total}`],
              [t('dash_with_pets'), `${stats.conMascotas} ${t('dash_of')} ${stats.total}`],
              [t('dash_with_id'), `${stats.conID} ${t('dash_of')} ${stats.total}`],
              [t('dash_with_bank'), `${stats.conBanco} ${t('dash_of')} ${stats.total}`],
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
              {t('dash_based_on')} <strong>{stats.total}</strong> {t('dash_registered')}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
