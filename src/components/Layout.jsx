import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Home, Search, Bell, Menu, X, Settings, LogOut, ChevronRight } from 'lucide-react';
import { subscribeClientes, logout } from '../lib/api';
import { useSearch } from '../context/SearchContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/propiedades', label: 'Propiedades', icon: Home },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [clientCount, setClientCount] = useState(0);
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile) setOpen(false);
      else setOpen(true);
    };
    window.addEventListener('resize', fn);
    fn();
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    return subscribeClientes(c => setClientCount(c.length));
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', position: 'relative' }}>

      {/* Mobile overlay */}
      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 190,
              background: 'rgba(10,15,46,.55)', backdropFilter: 'blur(3px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className="sidebar"
        initial={false}
        animate={{ x: open ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ position: 'fixed', transformOrigin: 'left' }}
      >
        <div className="sb-logo">
          <motion.div className="sb-icon" whileHover={{ scale: 1.05 }}>🏡</motion.div>
          <div>
            <h1>GENSY</h1>
            <span>CRM Inmobiliario</span>
          </div>
        </div>

        <p className="sb-label">Principal</p>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => isMobile && setOpen(false)}
          >
            <motion.span className="icon" whileHover={{ scale: 1.1 }}><Icon size={16} /></motion.span>
            {label}
            {label === 'Clientes' && clientCount > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                background: '#4f6ef7', color: '#fff', padding: '1px 7px',
                borderRadius: 99, minWidth: 20, textAlign: 'center',
              }}>{clientCount}</span>
            )}
          </NavLink>
        ))}

        <p className="sb-label" style={{ marginTop: 12 }}>Sistema</p>
        <button className="nav-btn" onClick={() => navigate('/configuracion')}>
          <span className="icon"><Settings size={16} /></span>
          Configuración
        </button>

        <div className="sb-footer">
          <motion.div 
            className="user-pill" 
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
            onClick={async () => {
              if (window.confirm('¿Cerrar sesión?')) {
                logout();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="ua">G</div>
            <div style={{ flex: 1 }}>
              <p>GENSY Admin</p>
              <span>Administrador</span>
            </div>
            <LogOut size={14} style={{ color: '#4a5578' }} />
          </motion.div>
        </div>
      </motion.aside>

      {/* Main */}
      <motion.main
        className="main"
        animate={{ marginLeft: open && !isMobile ? 'var(--sidebar-w)' : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <header className="header">
          <motion.button
            className="toggle-btn"
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(!open)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={open ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {open ? <X size={19} /> : <Menu size={19} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <div className="search-wrap">
            <Search size={15} color="var(--t3)" />
            <input 
              placeholder="Buscar..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hdr-actions">
            <motion.button className="icon-btn" whileTap={{ scale: 0.9 }}>
              <Bell size={17} />
              {clientCount > 0 && <span className="ndot" />}
            </motion.button>
            <motion.div className="hdr-av" whileHover={{ scale: 1.05 }}>G</motion.div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </motion.main>
    </div>
  );
}
