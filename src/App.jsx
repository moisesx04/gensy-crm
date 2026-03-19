import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardView from './views/DashboardView';
import ClientesView from './views/ClientesView';
import PropiedadesView from './views/PropiedadesView';
import ConfiguracionView from './views/ConfiguracionView';
import FormView from './views/FormView';
import FormSuccess from './views/FormSuccess';
import LoginView from './views/LoginView';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/form" element={<FormView />} />
      <Route path="/form/gracias" element={<FormSuccess />} />
      
      {/* Administrador - Protegido */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route index element={<DashboardView />} />
              <Route path="clientes" element={<ClientesView />} />
              <Route path="propiedades" element={<PropiedadesView />} />
              <Route path="configuracion" element={<ConfiguracionView />} />
              {/* Redirigir cualquier sub-ruta no encontrada dentro del layout al dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      {/* Redirigir cualquier otra ruta no encontrada a login o form */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
