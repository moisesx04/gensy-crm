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

export default function DashboardView() {
  const [clientes, setClientes] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

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

  // Robust cleaning of property data to prevent crashes
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

  if (loading) {
    return (
      <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--t3)', fontWeight: 600 }}>Cargando Panel Inteligente...</p>
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
    <div className="page">
      <h1>Dashboard G A FRIAS</h1>
      <p>Si ves esto, el sistema funciona. Estamos restaurando las gráficas.</p>
    </div>
  );
}
