import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Shield, AlertCircle, Home } from 'lucide-react';
import { login } from '../lib/api';

export default function LoginView() {
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
      setError(err.message || 'Credenciales inválidas. Verifica tu correo y contraseña.');
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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 70, height: 70, borderRadius: 20, 
            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 32, color: '#fff',
            boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)'
          }}>
            <Home size={34} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.04em' }}>
            GENSY CRM
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>
            Ingresa para gestionar tus clientes
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label>Correo Electrónico</label>
            <input 
              type="email" required placeholder="admin@gensy.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{ padding: '14px 18px', fontSize: 15 }}
            />
          </div>

          <div className="fg" style={{ marginBottom: 0 }}>
            <label>Contraseña</label>
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
            {loading ? 'Verificando...' : <><LogIn size={20} /> Iniciar Sesión</>}
          </motion.button>
        </form>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <p style={{ 
            fontSize: 13, color: '#94a3b8', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 
          }}>
            <Shield size={14} /> Acceso Restringido · GENSY Security
          </p>
        </div>
      </motion.div>
    </div>
  );
}
