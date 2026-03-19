import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('gensy_token');
    const savedUser = localStorage.getItem('gensy_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0d1630', color: '#fff', fontFamily: 'sans-serif' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ 
            width: 40, height: 40, border: '4px solid rgba(255,255,255,.1)', 
            borderTopColor: '#4f6ef7', borderRadius: '50%', animation: 'spin 1s linear infinite',
            marginBottom: 16
          }} />
          <p style={{ opacity: 0.6, fontSize: 14 }}>Cargando sistema...</p>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
