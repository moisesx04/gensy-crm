import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Database, Save, LogOut, User, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { logout, updateUserProfile } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ConfiguracionView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State for profile form
  const [profile, setProfile] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Load current user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('gensy_user');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setProfile({ nombre: u.nombre || '', email: u.email || '', password: '' });
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg({ type: '', text: '' });
    
    try {
      // Solo enviar password si no está vacío
      const data = { ...profile };
      if (!data.password) delete data.password;
      
      const result = await updateUserProfile(data);
      
      // Update local storage with new info
      localStorage.setItem('gensy_user', JSON.stringify(result.user));
      setProfile(prev => ({ ...prev, password: '' }));
      setMsg({ type: 'success', text: '¡Perfil actualizado con éxito!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.message || 'Error al actualizar.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('conf_logout_confirm'))) {
      logout();
    }
  };

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      <div className="pg-head">
        <div>
          <h1>{t('conf_title')}</h1>
          <p>{t('conf_desc')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24 }}>
        
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="card-head">
            <h3><User size={16} /> Perfil de Administrador</h3>
          </div>
          <div style={{ padding: 24 }}>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><User size={14} /> Nombre</label>
                <input 
                  type="text" required placeholder="Tu nombre"
                  value={profile.nombre} onChange={e => setProfile({...profile, nombre: e.target.value})}
                  style={{ borderRadius: 12, padding: '12px 16px' }}
                />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> Email</label>
                <input 
                  type="email" required placeholder="admin@gensy.com"
                  value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
                  style={{ borderRadius: 12, padding: '12px 16px' }}
                />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Lock size={14} /> Nueva Contraseña</label>
                <input 
                  type="password" placeholder="•••••••• (dejar en blanco para no cambiar)"
                  value={profile.password} onChange={e => setProfile({...profile, password: e.target.value})}
                  style={{ borderRadius: 12, padding: '12px 16px' }}
                />
              </div>

              {msg.text && (
                <div style={{ 
                  background: msg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: msg.type === 'success' ? '#10b981' : '#ef4444',
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  border: `1px solid ${msg.type === 'success' ? '#d1fae5' : '#fee2e2'}`
                }}>
                  {msg.text}
                </div>
              )}

              <button disabled={updating} type="submit" className="btn btn-primary" style={{ width: '100%', borderRadius: 12, padding: 14 }}>
                <Save size={16} /> {updating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Security Card */}
        <div className="card">
          <div className="card-head">
            <h3><Shield size={16} /> {t('conf_sec')}</h3>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>{t('conf_sec_desc')}</p>
            <button className="btn btn-primary" style={{ width: '100%', background: '#ef4444', height: 48, borderRadius: 12 }} onClick={handleLogout}>
              <LogOut size={16} /> {t('conf_logout')}
            </button>
          </div>
        </div>

        {/* Database Card */}
        <div className="card">
          <div className="card-head">
            <h3><Database size={16} /> {t('conf_db')}</h3>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>{t('conf_db_desc')}</p>
            <div style={{ 
              background: '#ecfdf5', color: '#10b981', padding: '12px 16px', 
              borderRadius: 12, fontSize: 12, fontWeight: 700, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #d1fae5'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              {t('conf_db_status')}
            </div>
          </div>
        </div>

        {/* Dev Mode Card */}
        <div className="card">
          <div className="card-head" style={{ borderBottom: '1px solid var(--card-border)' }}>
            <h3 style={{ display:'flex', alignItems:'center', gap:8, color: '#f59e0b' }}><Settings size={16} /> {t('conf_dev')}</h3>
          </div>
          <div style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>
              {t('conf_dev_desc1')} <strong style={{ color: '#ef4444' }}>{t('conf_dev_desc2')}</strong>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{t('conf_dev_toggle')}</span>
              <label className="switch">
                <input type="checkbox" 
                  checked={localStorage.getItem('dev_mode') === 'true'}
                  onChange={e => {
                    localStorage.setItem('dev_mode', e.target.checked);
                    window.dispatchEvent(new Event('storage')); // Notify other tabs/components
                    window.location.reload(); // Simple way to force update all views
                  }} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: #e2e8f0; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--accent); }
        input:checked + .slider:before { transform: translateX(22px); }
      `}</style>
    </div>
  );
}
