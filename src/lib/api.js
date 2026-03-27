// API Client for Vercel Serverless Functions

const getAuthHeaders = () => {
  const token = localStorage.getItem('gensy_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const fetchApi = async (url, options = {}) => {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('gensy_token');
        localStorage.removeItem('gensy_user');
        window.location.href = '/login';
      }
      console.error(`[API Error] ${url}:`, data.error || res.statusText);
      throw new Error(data.error || 'API Error');
    }
    return data;
  } catch (error) {
    console.error(`[Fetch Error] ${url}:`, error.message);
    throw error;
  }
};

export const login = async (email, password) => {
  const data = await fetchApi('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('gensy_token', data.token);
  localStorage.setItem('gensy_user', JSON.stringify(data.user));
  return data;
};

export const logout = () => {
  localStorage.removeItem('gensy_token');
  localStorage.removeItem('gensy_user');
  window.location.href = '/login';
};

// Clients API
export const getClientes = () => fetchApi('/api/clientes');
export const addCliente = (cliente) => fetchApi('/api/clientes', {
  method: 'POST',
  body: JSON.stringify(cliente),
});
export const updateCliente = (update) => fetchApi('/api/clientes', {
  method: 'PATCH',
  body: JSON.stringify(update),
});
export const deleteCliente = (id) => fetchApi(`/api/clientes?id=${id}`, { method: 'DELETE' });

// Properties API
export const getProperties = () => fetchApi('/api/propiedades');
export const addProperty = (prop) => fetchApi('/api/propiedades', {
  method: 'POST',
  body: JSON.stringify(prop),
});
export const updateProperty = (update) => fetchApi('/api/propiedades', {
  method: 'PATCH',
  body: JSON.stringify(update),
});
export const deleteProperty = (id) => fetchApi(`/api/propiedades?id=${id}`, { method: 'DELETE' });

// Notifications API
export const getNotifications = () => fetchApi('/api/notificaciones');
export const deleteNotification = (id) => fetchApi(`/api/notificaciones${id ? `?id=${id}` : ''}`, { method: 'DELETE' });

// Users API
export const updateUserProfile = (update) => fetchApi('/api/usuarios', {
  method: 'PATCH',
  body: JSON.stringify(update),
});

// Generic Polling Subscriber
export const subscribeTo = (fetcher, callback, intervalMs = 20000, errorCallback = null) => {
  const run = () => {
    fetcher()
      .then(callback)
      .catch(err => {
        if (errorCallback) errorCallback(err);
        else console.error(err);
      });
  };

  run();
  const interval = setInterval(run, intervalMs);
  return () => clearInterval(interval);
};

// Legacy support
export const subscribeClientes = (cb, errCb) => subscribeTo(getClientes, cb, 30000, errCb);
