import { Settings, Shield, Bell, Database, Save, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { logout } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function ConfiguracionView() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar la sesión de forma segura?')) {
      logout();
    }
  };

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      <div className="pg-head">
        <div>
          <h1>Configuración</h1>
          <p>Ajustes del sistema y preferencias de seguridad.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div className="card">
          <div className="card-head">
            <h3><Shield size={16} /> Seguridad</h3>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Gestiona el acceso administrativo al CRM.</p>
            <button className="btn btn-red" style={{ width: '100%' }} onClick={handleLogout}>
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3><Bell size={16} /> Notificaciones</h3>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>Configura alertas de nuevos registros en tiempo real.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notificar nuevos clientes</span>
              <input type="checkbox" defaultChecked />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Resumen semanal</span>
              <input type="checkbox" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3><Database size={16} /> Base de Datos (Cloud)</h3>
          </div>
          <div style={{ padding: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 20 }}>El sistema está sincronizado con Firebase Firestore.</p>
            <div style={{ 
              background: '#e6f9f2', color: '#17c98a', padding: '10px 14px', 
              borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#17c98a' }} />
              Sincronización Activa
            </div>
            <button className="btn btn-primary" style={{ width: '100%', borderRadius: 10 }}>
              <Save size={14} /> Forzar Sincronización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
