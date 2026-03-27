import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Decodes a JWT payload WITHOUT verifying the signature.
 * (Signature verification happens server-side on every API call)
 * Used only to check if the token has expired client-side for fast UX.
 */
function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to ms
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('gensy_token');
    const savedUser = localStorage.getItem('gensy_user');

    if (token && savedUser) {
      // Check if token has expired client-side
      const expiry = getTokenExpiry(token);
      if (expiry && Date.now() > expiry) {
        // Token expired — clear session and redirect to login
        localStorage.removeItem('gensy_token');
        localStorage.removeItem('gensy_user');
      } else {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.warn("Failed to parse user in ProtectedRoute:", e);
          localStorage.removeItem('gensy_user');
        }
      }
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
