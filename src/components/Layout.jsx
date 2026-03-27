import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, Home, Search, Bell, Menu, X, Settings, LogOut, Check, Calendar, Trash2, Globe, FileSpreadsheet, Moon, Sun } from 'lucide-react';
import { subscribeClientes, logout, getNotifications, deleteNotification, subscribeTo } from '../lib/api';
import { useSearch } from '../context/SearchContext';
import { useLanguage } from '../context/LanguageContext';

const NAV = [
  { to: '/', label: 'nav_dashboard', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'nav_clientes', icon: Users },
  { to: '/propiedades', label: 'nav_propiedades', icon: Home },
  { to: '/reportes', label: 'nav_reportes', icon: FileSpreadsheet },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [clientCount, setClientCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('gensy_theme') || 'light');
  const { searchQuery, setSearchQuery } = useSearch();
  const navigate = useNavigate();
  
  // Robust user data parsing to prevent blank screens
  let storedUser = { email: "admin", nombre: "Admin" };
  try {
    const rawUser = localStorage.getItem('gensy_user');
    if (rawUser && rawUser !== 'undefined' && rawUser !== 'null') {
      storedUser = JSON.parse(rawUser);
    }
  } catch (e) {
    console.warn("Failed to parse user data from localStorage:", e);
  }

  const userInitial = (storedUser?.nombre || storedUser?.email || 'A').charAt(0).toUpperCase();
  const userName = storedUser?.nombre || storedUser?.email || 'Admin';

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
    const unsubC = subscribeClientes(c => setClientCount(c.length));
    const unsubN = subscribeTo(getNotifications, setNotifications, 15000);
    return () => { unsubC(); unsubN(); };
  }, []);

  useEffect(() => {
    if (theme === 'dark') document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    localStorage.setItem('gensy_theme', theme);
  }, [theme]);

  const unreadCount = notifications.filter(n => !n.leida).length;

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
              background: 'rgba(15, 23, 42, 0.1)', backdropFilter: 'blur(8px)',
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
          <motion.div className="sb-icon" whileHover={{ scale: 1.05 }}>
            <Home size={22} />
          </motion.div>
          <div>
            <h1 style={{ fontSize: 14, lineHeight: 1.2 }}>{t('short_brand')}</h1>
            <span style={{ fontSize: 12, fontWeight: 800 }}>G A FRIAS REAL ESTATE</span>
          </div>
        </div>

        <p className="sb-label">{t('nav_main')}</p>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => isMobile && setOpen(false)}
          >
            <motion.span className="icon" whileHover={{ scale: 1.1 }}><Icon size={18} /></motion.span>
            {t(label)}
            {label === 'nav_clientes' && clientCount > 0 && (
              <span className="count-badge">{clientCount}</span>
            )}
          </NavLink>
        ))}

        <p className="sb-label" style={{ marginTop: 24 }}>{t('nav_system')}</p>
        <button className="nav-btn" onClick={() => navigate('/configuracion')}>
          <span className="icon"><Settings size={18} /></span>
          {t('nav_config')}
        </button>

        <div className="sb-footer">
          <motion.button 
            className="btn btn-primary" 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ width: '100%', background: '#ef4444', border: 'none', display: 'flex', gap: 8, justifyContent: 'center' }}
            onClick={async () => {
              if (window.confirm(t('logout_confirm'))) {
                logout();
              }
            }}
          >
            <LogOut size={16} />
            <span style={{ fontWeight: 700 }}>{t('conf_logout')}</span>
          </motion.button>
          <div style={{ padding: '16px', fontSize: 10, color: 'var(--t3)', textAlign: 'center', opacity: 0.6, fontWeight: 700, letterSpacing: '0.02em' }}>
            Powered by Moises Cuevas
          </div>
        </div>
      </motion.aside>

      <main
        className="main"
        style={{ 
          flex: 1, 
          minHeight: '100dvh',
          display: 'flex', 
          flexDirection: 'column',
          marginLeft: open && !isMobile ? 'var(--sidebar-w)' : 0,
          width: open && !isMobile ? 'calc(100% - var(--sidebar-w))' : '100%',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden'
        }}
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
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          {location.pathname !== '/propiedades' && (
            <div className="search-wrap hidden-mobile">
              <Search size={16} color="var(--t3)" />
              <input 
                placeholder={t('search_placeholder')} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          <div className="hdr-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
            <motion.button 
              className="icon-btn" 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              style={{ background: theme === 'dark' ? '#1e293b' : '#f8fafc', border: '1px solid var(--card-border)' }}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#f8fafc" />}
            </motion.button>
            <button 
              type="button"
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0',
                background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
            </button>
            <motion.button className="icon-btn" 
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotif(!showNotif)}
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="ndot" style={{ width: 8, height: 8, top: 10, right: 10 }} />}
            </motion.button>

            <AnimatePresence>
              {showNotif && (
                <>
                  <div style={{ position:'fixed', inset:0, zIndex:998 }} onClick={() => setShowNotif(false)} />
                  <motion.div 
                    initial={{ opacity:0, y:10, scale:0.95 }}
                    animate={{ opacity:1, y:0, scale:1 }}
                    exit={{ opacity:0, y:10, scale:0.95 }}
                    style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: 12,
                      width: 320, background: '#fff', borderRadius: 16, border: '1px solid var(--card-border)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.12)', zIndex: 999, overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{t('notifications')}</span>
                      <button style={{ border:'none', background:'none', color:'var(--accent)', fontSize:11, fontWeight:700, cursor:'pointer' }}
                        onClick={() => deleteNotification().then(() => setNotifications([]))}>{t('clear')}</button>
                    </div>
                    <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding:40, textAlign:'center', color:'var(--t3)', fontSize:13 }}>{t('no_notifications')}</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} style={{ padding: '12px 20px', borderBottom: '1px solid #f8fafc', position:'relative' }}>
                            <div style={{ display:'flex', gap:10 }}>
                              <div style={{ width:32, height:32, borderRadius:8, background: n.tipo === 'cita' ? '#ecfdf5' : '#eff6ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                {n.tipo === 'cita' ? <Calendar size={16} color="#059669" /> : <Bell size={16} color="#3b82f6" />}
                              </div>
                              <div style={{ flex:1 }}>
                                <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{n.titulo}</p>
                                <p style={{ fontSize:12, color:'var(--t2)', marginTop:2 }}>{n.mensaje}</p>
                                <p style={{ fontSize:10, color:'var(--t3)', marginTop:4 }}>{new Date(n.created_at).toLocaleDateString()}</p>
                              </div>
                              <button style={{ border:'none', background:'none', padding:4, opacity:0.4, cursor:'pointer' }}
                                onClick={() => deleteNotification(n.id).then(() => setNotifications(prev => prev.filter(x => x.id !== n.id)))}>
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <div className="hidden-desktop" style={{ fontWeight: 800, fontSize: 13, color: 'var(--accent)', marginRight: 'auto', lineHeight: 1.2 }}>
              {t('brand_name')}
            </div>
            <motion.div className="hdr-av" whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/configuracion')}
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: '#fff',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)', cursor: 'pointer'
              }}
            >{userInitial}</motion.div>
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1 }}>{children}</div>
        
        {/* Persistent Footer */}
        <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid var(--card-border)', background: '#fff' }}>
          <p style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>
            {t('developed_by_text')}
          </p>
        </footer>
      </main>
      
      <style>{`
        .count-badge {
          margin-left: auto;
          font-size: 11px;
          font-weight: 800;
          background: var(--accent);
          color: #fff;
          padding: 2px 8px;
          border-radius: 99px;
          min-width: 20px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(79, 70, 229, 0.2);
        }
      `}</style>
    </div>
  );
}
