import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Shield, AlertCircle, Globe, FileText, Home } from 'lucide-react';
import { login } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function LoginView() {
  const { t, language, setLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || t('login_error_default'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="login-card"
      >
            <div style={{ position: 'absolute', top: 20, right: 20 }}>
              <button 
                type="button"
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Globe size={14} /> {language === 'es' ? 'EN' : 'ES'}
              </button>
            </div>
            
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 70, height: 70, borderRadius: 20, 
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', color: '#fff',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
          }}>
            <Home size={34} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {t('short_brand')}
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', fontWeight: 800 }}>
            Gensy frias
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label>{t('login_email')}</label>
            <input 
              type="email" required placeholder="admin@gensy.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ padding: '14px 18px', fontSize: 15 }}
            />
          </div>

          <div className="fg" style={{ marginBottom: 0 }}>
            <label>{t('login_pass')}</label>
            <input 
              type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{ padding: '14px 18px', fontSize: 15 }}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ 
                background: '#fef2f2', border: '1px solid #fee2e2',
                padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                color: '#ef4444', fontSize: 14, fontWeight: 500
              }}
            >
              <AlertCircle size={18} /> {error}
            </motion.div>
          )}

          <motion.button 
            type="submit" disabled={loading}
            whileHover={{ scale: 1.01, translateY: -1 }} whileTap={{ scale: 0.99 }}
            className="btn btn-primary"
            style={{
              padding: '16px', fontSize: 16, width: '100%',
              justifyContent: 'center', marginTop: 8
            }}
          >
            {loading ? t('login_verifying') : <><LogIn size={20} /> {t('login_btn')}</>}
          </motion.button>
        </form>

        <div style={{ marginTop: 24 }}>
          <button type="button" onClick={() => navigate('/form')} className="btn btn-ghost" style={{ width: '100%', padding: '12px', justifyContent: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
            <FileText size={16} /> {language === 'es' ? 'Ir al Formulario Público' : 'Go to Public Form'}
          </button>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ 
            fontSize: 13, color: '#94a3b8', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
          }}>
            <Shield size={14} /> {t('login_restricted')}
          </p>
          <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 16, fontWeight: 700 }}>
            {t('developed_by_text')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
