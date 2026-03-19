// API Client for Vercel Serverless Functions

const getAuthHeaders = () => {
  const token = localStorage.getItem('gensy_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const login = async (email, password) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
  
  localStorage.setItem('gensy_token', data.token);
  localStorage.setItem('gensy_user', JSON.stringify(data.user));
  return data;
};

export const logout = () => {
  localStorage.removeItem('gensy_token');
  localStorage.removeItem('gensy_user');
  window.location.href = '/login';
};

export const addCliente = async (cliente) => {
  const res = await fetch('/api/clientes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cliente),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar cliente');
  return data;
};

export const getClientes = async () => {
  const res = await fetch('/api/clientes', {
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al obtener clientes');
  return data;
};

export const deleteCliente = async (id) => {
  const res = await fetch(`/api/clientes?id=${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeaders() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar cliente');
  return data;
};

// Mock para mantener compatibilidad si se usa suscripción (cambiado a polling simple o manual)
export const subscribeClientes = (callback) => {
  getClientes().then(callback).catch(console.error);
  // Podríamos implementar un setInterval aquí si se desea tiempo real simulado
  const interval = setInterval(() => {
    getClientes().then(callback).catch(console.error);
  }, 30000); // Cada 30 seg
  return () => clearInterval(interval);
};
