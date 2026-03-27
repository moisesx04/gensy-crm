import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscribeClientes, subscribeTo, getProperties } from '../lib/api';
import { TrendingUp, Copy, ExternalLink, BarChart3, Users2, Building2, Handshake, Wallet, DollarSign, PieChart, Home } from 'lucide-react';
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

const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#06b6d4'];

export default function DashboardView() {
  const [clientes, setClientes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const unsubClients = subscribeClientes(data => {
      setClientes(data);
      setLoading(false);
      setError(null);
    }, err => {
      console.error(err);
      setError(err.message);
      setLoading(false);
    });

    const unsubProps = subscribeTo(getProperties, data => {
      setProperties(data);
    });

    return () => {
      unsubClients();
      unsubProps();
    };
  }, []);

  const stats = useMemo(() => {
    const total = clientes.length;
    const now = new Date();
    const nowStr = now.toDateString();
    const hoy = clientes.filter(c => new Date(c.createdAt).toDateString() === nowStr).length;
    
    const profitDaily = properties.reduce((acc, p) => {
      if (p.status === 'Rentada' && p.financiero) {
        const d = new Date(p.financiero.fecha_transaccion || p.created_at);
        if (d.toDateString() === nowStr) return acc + (Number(p.financiero.ganancia_neta) || 0);
      }
      return acc;
    }, 0);

    const profitMonthly = properties.reduce((acc, p) => {
      if (p.status === 'Rentada' && p.financiero) {
        const d = new Date(p.financiero.fecha_transaccion || p.created_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) 
          return acc + (Number(p.financiero.ganancia_neta) || 0);
      }
      return acc;
    }, 0);

    const availableProps = properties.filter(p => p.status !== 'Rentada').length;
    const activeRents = properties.filter(p => p.status === 'Rentada').length;

    return { total, hoy, profitDaily, profitMonthly, availableProps, activeRents };
  }, [clientes, properties]);

  const formLink = `${window.location.origin}/form`;
  const chatLink = `${window.location.origin}/chat`;

  const copy = useCallback((link, setter) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setter(true);
    setTimeout(() => setter(false), 2000);
  }, []);

  return (
    <div className="page" style={{ maxWidth: 1400, margin: '0 auto' }}>
      <motion.div 
        className="pg-head" 
        initial={{ opacity:0, y:-20 }} 
        animate={{ opacity:1, y:0 }}
        style={{ marginBottom: 40 }}
      >
        <div>
          <h1 style={{ fontSize: 34, background: 'linear-gradient(135deg, var(--t1), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t('dash_title')}
          </h1>
          <p style={{ fontSize: 16 }}>Bienvenido de nuevo al panel interactivo de GENSY.</p>
        </div>
        <div style={{ display:'flex', gap: 12 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-ghost" onClick={() => copy(formLink, setCopied)}>
            {copied ? '✅ Formulario Copiado' : <><Copy size={16} /> Enlace Formulario</>}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn btn-primary" onClick={() => window.open(formLink, '_blank')}>
            <ExternalLink size={16} /> Abrir Registro
          </motion.button>
        </div>
      </motion.div>

      {/* Main Bento Layout */}
      <motion.div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(12, 1fr)', 
          gridAutoRows: 'minmax(160px, auto)',
          gap: 24 
        }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Row 1: Net Profit Focus (Large Card) */}
        <motion.div className="card" variants={fadeUp} style={{ gridColumn: 'span 8', gridRow: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 40, background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(59, 130, 246, 0.02))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: 14, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Ganancia Neta Mensual</h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 48, fontWeight: 900, color: 'var(--t1)' }}>${stats.profitMonthly.toLocaleString()}</span>
                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <TrendingUp size={16} /> +12% vs mes anterior
                </span>
              </div>
            </div>
            <div className="stat-icon" style={{ background: 'var(--accent)', color: '#fff', width: 64, height: 64 }}>
              <Wallet size={32} />
            </div>
          </div>
          <div style={{ marginTop: 40, height: 120, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            {/* Mock Chart Visualization */}
            {[40, 60, 45, 70, 85, 65, 90, 80, 75, 95].map((h, i) => (
              <motion.div 
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: 0.5 + (i * 0.1), duration: 0.8 }}
                style={{ flex: 1, background: i === 9 ? 'var(--accent)' : 'var(--accent-light)', borderRadius: '4px 4px 0 0' }}
              />
            ))}
          </div>
        </motion.div>

        {/* Profit Daily Card */}
        <motion.div className="card" variants={fadeUp} style={{ gridColumn: 'span 4', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.05)' }}>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: 'var(--success)', marginBottom: 16 }}>
             <DollarSign size={24} />
          </div>
          <h3 style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700 }}>HOY</h3>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)' }}>+${stats.profitDaily.toLocaleString()}</div>
        </motion.div>

        {/* Mini Stats Bento Elements */}
        <motion.div className="card" variants={fadeUp} style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 16, padding: '24px 32px' }}>
          <div className="stat-icon" style={{ background: '#eff6ff', color: 'var(--info)' }}><Building2 size={24} /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{stats.availableProps}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>DISPONIBLES</div>
          </div>
        </motion.div>

        {/* Activity Summary Column */}
        <motion.div className="card" variants={fadeUp} style={{ gridColumn: 'span 4', gridRow: 'span 2' }}>
          <div className="card-head" style={{ padding: '20px 24px' }}>
            <h3>Rentas Recientes</h3>
            <PieChart size={18} color="var(--accent)" />
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {properties.filter(p => p.status === 'Rentada' && p.financiero).slice(0, 4).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', gap: 12, padding: '16px 0', borderBottom: i < 3 ? '1px solid var(--bg)' : 'none' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Home size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{p.cliente_nombre || 'Renta exitosa'}</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)', fontSize: 13 }}>
                  +${p.financiero.ganancia_neta?.toLocaleString()}
                </div>
              </div>
            ))}
            {properties.filter(p => p.status === 'Rentada' && p.financiero).length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--t3)', fontSize: 12 }}>Sin transacciones hoy.</div>
            )}
          </div>
        </motion.div>

        {/* Prospectos Bento */}
        <motion.div className="card" variants={fadeUp} style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 16, padding: '24px 32px' }}>
          <div className="stat-icon" style={{ background: '#fffbeb', color: 'var(--warning)' }}><Users2 size={24} /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{stats.total}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>PROSPECTOS</div>
          </div>
        </motion.div>

        {/* Today's Registrations Bento */}
        <motion.div className="card" variants={fadeUp} style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 16, padding: '24px 32px' }}>
          <div className="stat-icon" style={{ background: '#f5f3ff', color: 'var(--secondary)' }}><Handshake size={24} /></div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{stats.hoy}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t3)' }}>NUEVOS HOY</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer / More Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} style={{ marginTop: 40, textAlign: 'center' }}>
         <button className="btn btn-ghost" onClick={() => navigate('/clientes')} style={{ borderRadius: 99, padding: '12px 32px' }}>
           Ver Informe Detallado <ExternalLink size={16} />
         </button>
      </motion.div>
    </div>
  );
}
