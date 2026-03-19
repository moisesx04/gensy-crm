import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, Shield, AlertCircle } from 'lucide-react';
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
    <div style={{
      height: '100vh', width: '100%',
      background: 'radial-gradient(circle at top left, #1a2a6c, #b21f1f, #fdbb2d)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: 420,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: 32,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '48px 40px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          color: '#fff'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ 
            width: 64, height: 64, borderRadius: 20, 
            background: 'linear-gradient(135deg, #4f6ef7, #e84f8c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 32,
            boxShadow: '0 10px 25px rgba(79, 110, 247, 0.4)'
          }}>🏡</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.02em' }}>GENSY CRM</h1>
          <p style={{ fontSize: 15, opacity: 0.7 }}>Ingresa para gestionar tus clientes</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>Correo Electrónico</label>
            <input 
              type="email" required placeholder="admin@gensy.com"
              value={email} onChange={e => setEmail(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12, padding: '14px 16px', color: '#fff',
                fontSize: 15, outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f6ef7'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, opacity: 0.9 }}>Contraseña</label>
            <input 
              type="password" required placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12, padding: '14px 16px', color: '#fff',
                fontSize: 15, outline: 'none', transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#4f6ef7'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              style={{ 
                background: 'rgba(232, 79, 140, 0.15)', border: '1px solid rgba(232, 79, 140, 0.3)',
                padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
                color: '#ff8fb1', fontSize: 13
              }}
            >
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          <motion.button 
            type="submit" disabled={loading}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)',
              border: 'none', borderRadius: 14, padding: 16, color: '#fff',
              fontSize: 16, fontWeight: 800, cursor: 'pointer', marginTop: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 10px 25px rgba(79, 110, 247, 0.3)',
              disabled: { opacity: 0.6, cursor: 'not-allowed' }
            }}
          >
            {loading ? 'Verificando...' : <><LogIn size={18} /> Iniciar Sesión</>}
          </motion.button>
        </form>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 12, opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Shield size={12} /> Acceso Restringido · GENSY Security
          </p>
        </div>
      </motion.div>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
