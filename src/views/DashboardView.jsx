import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { subscribeClientes, subscribeTo, getProperties } from '../lib/api';
import { TrendingUp, Copy, ExternalLink, BarChart3, Users2, Building2, Handshake, Wallet, DollarSign, PieChart, Home, AlertCircle } from 'lucide-react';
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

function CircularProgress({ value, label, sub, color, delay }) {
  const radius = 36;
  const c = Math.PI * (radius * 2);
  const pct = ((100 - value) / 100) * c;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'rgba(255,255,255,0.5)', padding: '24px 16px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.02)' }}>
      <div style={{ position: 'relative', width: 90, height: 90, marginBottom: 16 }}>
        <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
          <circle r={radius} cx="45" cy="45" fill="transparent" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
          <motion.circle 
            r={radius} cx="45" cy="45" fill="transparent" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c}
            animate={{ strokeDashoffset: pct }} transition={{ duration: 1.5, delay, ease: "easeOut" }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'var(--t1)' }}>
          {value}%
        </div>
      </div>
      <h4 style={{ fontSize: 13, fontWeight: 800, color: 'var(--t2)', marginBottom: 4 }}>{label}</h4>
      <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{sub}</p>
    </div>
  );
}

export default function DashboardView() {
  const [clientes, setClientes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
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

  const processedProperties = useMemo(() => {
    return properties.map(p => {
      let fin = p.financiero;
      if (fin && typeof fin === 'string') {
        try { fin = JSON.parse(fin); } catch (e) { fin = null; }
      }
      return { ...p, financiero: fin };
    });
  }, [properties]);

  const stats = useMemo(() => {
    const total = clientes.length;
    const now = new Date();
    const nowStr = now.toDateString();
    const hoy = clientes.filter(c => new Date(c.createdAt).toDateString() === nowStr).length;
    
    const profitDaily = processedProperties.reduce((acc, p) => {
      if (p.status === 'Rentada' && p.financiero) {
        const d = new Date(p.financiero.fecha_transaccion || p.created_at);
        if (d.toDateString() === nowStr) return acc + (Number(p.financiero.ganancia_neta) || 0);
      }
      return acc;
    }, 0);

    const profitMonthly = processedProperties.reduce((acc, p) => {
      if (p.status === 'Rentada' && p.financiero) {
        const d = new Date(p.financiero.fecha_transaccion || p.created_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) 
          return acc + (Number(p.financiero.ganancia_neta) || 0);
      }
      return acc;
    }, 0);

    const availableProps = processedProperties.filter(p => p.status !== 'Rentada').length;
    const activeRents = processedProperties.filter(p => p.status === 'Rentada').length;

    return { total, hoy, profitDaily, profitMonthly, availableProps, activeRents };
  }, [clientes, processedProperties]);

  const insights = useMemo(() => {
    if (!clientes || clientes.length === 0) return null;
    const withBank = clientes.filter(c => c.cuentaBanco === 'Sí').length;
    const withProgram = clientes.filter(c => c.cashOPrograma === 'Programas de asistencia' || c.cashOPrograma === 'Ambos (Cash + Programa)').length;
    
    // Convert to number safely
    const highIncome = clientes.filter(c => {
      const inc = Number(c.ingresosMensuales);
      return !isNaN(inc) && inc > 5000;
    }).length;

    return {
      bankPct: Math.round((withBank / clientes.length) * 100),
      programPct: Math.round((withProgram / clientes.length) * 100),
      potentialsPct: Math.round((highIncome / clientes.length) * 100),
      potentials: highIncome
    };
  }, [clientes]);

  const formLink = `${window.location.origin}/form`;

  const copy = useCallback((link, setter) => {
    navigator.clipboard.writeText(link).catch(() => {});
    setter(true);
    setTimeout(() => setter(false), 2000);
  }, []);

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--t3)', fontWeight: 600 }}>Cargando Command Center...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center', padding: 20 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <AlertCircle size={30} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Vaya, algo salió mal</h2>
        <p style={{ color: 'var(--t2)', maxWidth: 400, marginBottom: 24 }}>{error}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div 
        className="pg-head" 
        initial={{ opacity:0, y:-20 }} 
        animate={{ opacity:1, y:0 }}
        style={{ marginBottom: 40 }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Panel de Control
          </h1>
          <p style={{ fontSize: 15, color: 'var(--t2)', fontWeight: 500 }}>
            Visión general de <strong>G A FRIAS REAL ESTATE</strong>
          </p>
        </div>
        <div style={{ display:'flex', gap: 12 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-ghost" onClick={() => copy(formLink, setCopied)} style={{ background: '#fff' }}>
            {copied ? '✅ Copiado' : <><Copy size={16} /> URL Formulario</>}
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-primary" onClick={() => window.open(formLink, '_blank')} style={{ boxShadow: '0 8px 16px rgba(37,99,235,0.2)' }}>
            <ExternalLink size={16} /> Abrir Registro
          </motion.button>
        </div>
      </motion.div>

      {/* Top 4 KPI Cards */}
      <motion.div 
        variants={container} initial="hidden" animate="show"
        className="stats-grid" style={{ marginBottom: 40 }}
      >
        <motion.div variants={fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#eff6ff', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={28} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ganancia Mensual</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--t1)' }}>${stats.profitMonthly.toLocaleString()}</div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#ecfdf5', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ingresos Hoy</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--t1)' }}>${stats.profitDaily.toLocaleString()}</div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef3c7', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Prospectos / Nuevos</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--t1)' }}>{stats.total}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>+{stats.hoy} hoy</span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} style={{ background: '#fff', borderRadius: 24, padding: 24, display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f3e8ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={28} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Prop. Disponibles</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--t1)' }}>{stats.availableProps}</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main SaaS Body: Two Columns */}
      <div className="dash-grid">
        
        {/* Left Column: Recent Rents */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)' }}>Rentas Recientes</h2>
              <p style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 500, marginTop: 4 }}>Últimas propiedades cerradas satisfactoriamente</p>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 13, padding: '8px 16px', background: 'var(--bg)' }} onClick={() => navigate('/propiedades')}>
              Ver Todas
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {processedProperties.filter(p => p.status === 'Rentada' && p.financiero).slice(0, 5).map((p, i) => (
              <motion.div 
                key={p.id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                  background: 'rgba(248,250,252,0.5)', borderRadius: 16,
                  border: '1px solid rgba(0,0,0,0.02)', transition: 'all 0.2s ease', cursor: 'pointer'
                }}
                whileHover={{ scale: 1.01, background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-light), #fff)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(37,99,235,0.1)' }}>
                  <Home size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)', marginBottom: 2 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}></span>
                    Cliente: {p.cliente_nombre || 'No asignado'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--success)' }}>+${p.financiero?.ganancia_neta?.toLocaleString() || '0'}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, marginTop: 4 }}>
                    {p.financiero?.fecha_transaccion ? new Date(p.financiero.fecha_transaccion).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {processedProperties.filter(p => p.status === 'Rentada' && p.financiero).length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                <Home size={40} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 600 }}>Aún no hay rentas registradas con datos financieros.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Smart Insights */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          style={{ background: 'linear-gradient(180deg, #fff, #f8fafc)', borderRadius: 24, padding: 32, boxShadow: '0 10px 30px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.02)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }}>Inteligencia CRM</h2>
              <p style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>Basado en {stats.total} clientes</p>
            </div>
          </div>

          {insights ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <CircularProgress 
                value={insights.bankPct} 
                label="Salud Bancaria" 
                sub="Poseen Cuenta Bancaria"
                color="#10b981" 
                delay={0.5} 
              />
              <CircularProgress 
                value={insights.programPct} 
                label="Programas Asistencia" 
                sub="Califican para ayuda"
                color="#3b82f6" 
                delay={0.7} 
              />
              <CircularProgress 
                value={insights.potentialsPct} 
                label="Perfiles Premium" 
                sub={`+$5,000 ingres. (${insights.potentials} prospects)`}
                color="#f59e0b" 
                delay={0.9} 
              />
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
                <p style={{ fontWeight: 600 }}>Registra clientes formales para activar la inteligencia.</p>
              </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

