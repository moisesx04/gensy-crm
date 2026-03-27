import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bed, Bath, Plus, Home, UserPlus, Trash2, CheckCircle2, Clock, Calendar, Users, Search, Edit2, TrendingUp, Tag, FileText } from 'lucide-react';
import { getProperties, addProperty, updateProperty, subscribeTo, subscribeClientes, deleteProperty } from '../lib/api';
import { useSearch } from '../context/SearchContext';
import { useLanguage } from '../context/LanguageContext';

export default function PropiedadesView() {
  const { t } = useLanguage();
  const [properties, setProperties] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');
  const [showAdd, setShowAdd] = useState(false);
  const [rentingProp, setRentingProp] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [rentingDate, setRentingDate] = useState('');
  const [rentingTime, setRentingTime] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [commissions, setCommissions] = useState([]); // [{ name: '', amount: '' }]
  const { searchQuery } = useSearch();

  useEffect(() => {
    const unsubProps = subscribeTo(getProperties, setProperties, 15000);
    const unsubClients = subscribeClientes(data => {
      setClientes(data);
      setLoading(false);
    });
    return () => { unsubProps(); unsubClients(); };
  }, []);

  const [newP, setNewP] = useState({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '' });

  // Computed stats
  const totalProps = properties.length;
  const rentadas = properties.filter(p => p.status === 'Rentada').length;
  const disponibles = totalProps - rentadas;
  const enVenta = properties.filter(p => p.tag === 'Venta' && p.status !== 'Rentada').length;
  const enAlquiler = properties.filter(p => p.tag === 'Alquiler' && p.status !== 'Rentada').length;

  const handleDelete = async (id, title) => {
    if (!window.confirm(`${t('prop_del_confirm')} "${title}"? esta acción no se puede deshacer.`)) return;
    try {
      await deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) { alert(`${t('prop_del_error')} ` + err.message); }
  };

  const filtered = properties.filter(p => {
    const matchesFilter = filter === 'Todos' || p.tag === filter;
    const matchesSearch = !searchQuery ||
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const sanitizedP = {
        id: newP.id,
        title: newP.title || 'Propiedad sin nombre',
        loc: newP.loc || 'Sin ubicación',
        price: newP.price || 'Consultar precio',
        beds: newP.beds || 0,
        baths: newP.baths || 0,
        tag: newP.tag || 'Venta',
        description: newP.description || ''
      };

      if (newP.id) {
        const updatedProp = await updateProperty(sanitizedP);
        setProperties(prev => prev.map(p => p.id === newP.id ? { ...updatedProp, status: p.status, cliente_id: p.cliente_id } : p));
      } else {
        const savedProp = await addProperty(sanitizedP);
        setProperties(prev => [savedProp, ...prev]);
      }

      setShowAdd(false);
      setNewP({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '' });
    } catch (err) { alert('Error guardando: ' + err.message); }
  };

  const handleEditProp = (p) => {
    setNewP({
      id: p.id,
      title: p.title || '',
      loc: p.location || '',
      price: p.price || '',
      beds: p.beds || '',
      baths: p.baths || '',
      tag: p.tag || 'Venta',
      description: p.description || ''
    });
    setShowAdd(true);
  };

  const handleAssign = async () => {
    if (!selectedClient) return;
    if (!rentingDate || !rentingTime) {
      alert(t('prop_alert_datetime'));
      return;
    }
    try {
      const fecha_cita = `${rentingDate}T${rentingTime}:00Z`;
      const ganancia_total = (Number(salePrice) || 0) - (Number(costPrice) || 0);
      const total_comisiones = commissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const ganancia_neta = ganancia_total - total_comisiones;

      await updateProperty({
        id: rentingProp.id,
        status: 'Rentada',
        cliente_id: selectedClient.id,
        cliente_nombre: selectedClient.nombreCompleto,
        fecha_cita,
        financiero: {
          costo: Number(costPrice) || 0,
          venta: Number(salePrice) || 0,
          ganancia_total,
          comisiones: commissions.filter(c => c.name && c.amount),
          ganancia_neta,
          fecha_transaccion: new Date().toISOString()
        }
      });
      alert(`${t('prop_alert_success')} ${selectedClient.nombreCompleto}. ${t('prop_appointment')} ${rentingDate} ${rentingTime}`);
      setRentingProp(null);
      setSelectedClient(null);
      setRentingDate('');
      setRentingTime('');
      setCostPrice('');
      setSalePrice('');
      setCommissions([]);
    } catch (err) { alert(err.message); }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  const cardGradient = (p) => {
    if (p.status === 'Rentada') return 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)';
    if (p.tag === 'Venta') return 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)';
    return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
  };
  const cardAccent = (p) => {
    if (p.status === 'Rentada') return 'var(--success)';
    if (p.tag === 'Venta') return 'var(--accent)';
    return 'var(--info)';
  };

  const filterTabs = [
    { key: 'Todos', label: t('prop_filter_all'), count: totalProps },
    { key: 'Venta', label: t('prop_filter_sale'), count: properties.filter(p => p.tag === 'Venta').length },
    { key: 'Alquiler', label: t('prop_filter_rent'), count: properties.filter(p => p.tag === 'Alquiler').length },
  ];

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      {/* ── Header ── */}
      <div className="pg-head">
        <div>
          <h1>{t('prop_title')}</h1>
          <p>{t('prop_desc')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setNewP({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '' }); setShowAdd(true); }}>
          <Plus size={18} /> {t('prop_new')}
        </button>
      </div>

      {/* ── Stats Bar ── */}
      <div className="prop-stats-bar">
        {[
          { icon: <Home size={20} />, value: totalProps, label: 'Total', color: 'var(--accent)', bg: 'var(--accent-light)' },
          { icon: <TrendingUp size={20} />, value: disponibles, label: 'Disponibles', color: '#10b981', bg: '#ecfdf5' },
          { icon: <CheckCircle2 size={20} />, value: rentadas, label: 'Asignadas', color: '#f59e0b', bg: '#fffbeb' },
        ].map((s, i) => (
          <div key={i} className="prop-stat-card">
            <div style={{ width: 44, height: 44, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--t1)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {filterTabs.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`prop-filter-tab ${filter === f.key ? 'active' : ''}`}
          >
            {f.label}
            <span className={`prop-filter-count ${filter === f.key ? 'active' : ''}`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── Property Grid ── */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prop-empty"
        >
          <div className="prop-empty-icon">🏠</div>
          <h3>No hay propiedades{filter !== 'Todos' ? ` en "${filterTabs.find(f => f.key === filter)?.label}"` : ''}</h3>
          <p>Agrega tu primera propiedad para comenzar a gestionarla aquí.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { setNewP({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '' }); setShowAdd(true); }}>
            <Plus size={16} /> Nueva propiedad
          </button>
        </motion.div>
      ) : (
        <div className="prop-grid">
          {filtered.map((p) => (
            <motion.div key={p.id} layout className="card prop-card"
              style={{
                overflow: 'hidden',
                border: p.status === 'Rentada' ? '2px solid var(--success)' : '1px solid var(--card-border)',
                background: '#fff'
              }}>

              {/* Card Banner */}
              <div style={{
                height: 160,
                background: cardGradient(p),
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Decorative blobs */}
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', filter: 'blur(12px)' }} />
                <div style={{ position: 'absolute', bottom: -15, left: -15, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(10px)' }} />

                {/* Center icon */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  width: 68, height: 68, borderRadius: 22, background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 12px 28px -6px rgba(0,0,0,0.12)',
                  color: cardAccent(p), zIndex: 5
                }}>
                  {p.status === 'Rentada' ? <CheckCircle2 size={34} /> : <Home size={34} strokeWidth={1.5} />}
                </div>

                {/* Top-right: tag + actions */}
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, alignItems: 'center', zIndex: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: p.tag === 'Venta' ? '#eef2ff' : '#eff6ff',
                    color: p.tag === 'Venta' ? 'var(--accent)' : 'var(--info)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>{p.tag === 'Venta' ? t('prop_filter_sale') : t('prop_filter_rent')}</span>
                  <button className="btn-icon" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', width: 30, height: 30, borderRadius: '50%', color: 'var(--t2)' }}
                    onClick={e => { e.stopPropagation(); handleEditProp(p); }}>
                    <Edit2 size={13} />
                  </button>
                  <button className="btn-icon" style={{ background: 'rgba(254,226,226,0.9)', backdropFilter: 'blur(4px)', width: 30, height: 30, borderRadius: '50%', color: '#ef4444' }}
                    onClick={e => { e.stopPropagation(); handleDelete(p.id, p.title); }}>
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Rentada badge bottom-left */}
                {p.status === 'Rentada' && (
                  <div style={{ position: 'absolute', bottom: 12, left: 14, zIndex: 10 }}>
                    <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 900, background: 'var(--success)', color: '#fff', letterSpacing: '0.04em' }}>
                      ✓ {t('prop_rented')}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div style={{ padding: '22px 22px 20px' }}>
                {/* Title + Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: 17, fontWeight: 900, color: 'var(--t1)', lineHeight: 1.25, marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</h4>
                    <p style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                      <MapPin size={12} /> {p.location}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 20, fontWeight: 900,
                      background: `linear-gradient(135deg, ${cardAccent(p)}, var(--secondary))`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', lineHeight: 1
                    }}>{p.price}</span>
                  </div>
                </div>

                {/* Description */}
                {p.description && (
                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 12, borderLeft: '3px solid var(--card-border)', paddingLeft: 10 }}>
                    {p.description}
                  </p>
                )}

                {/* Beds / Baths */}
                <div style={{
                  background: '#f8fafc', padding: '12px 16px', borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                  border: '1px solid var(--card-border)', marginBottom: (p.tag === 'Alquiler' && p.status !== 'Rentada') || p.status === 'Rentada' ? 14 : 0
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <Bed size={17} color="var(--t3)" />
                    <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--t1)' }}>{p.beds}</span>
                    <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Camas</span>
                  </div>
                  <div style={{ width: 1, height: 28, background: 'var(--card-border)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <Bath size={17} color="var(--t3)" />
                    <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--t1)' }}>{p.baths}</span>
                    <span style={{ fontSize: 9, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Baños</span>
                  </div>
                </div>

                {/* Assign Button */}
                {p.tag === 'Alquiler' && p.status !== 'Rentada' && (
                  <button onClick={() => setRentingProp(p)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <UserPlus size={15} /> {t('prop_assign')}
                  </button>
                )}

                {/* Assigned client info */}
                {p.status === 'Rentada' && (
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Users size={13} color="#059669" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#065f46' }}>{p.cliente_nombre || t('prop_assigned_client')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Clock size={13} color="#059669" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#047857' }}>{formatDate(p.fecha_cita)}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Modal: Assign Client ── */}
      <AnimatePresence>
        {rentingProp && (
          <div className="modal-backdrop" onClick={() => { setRentingProp(null); setSelectedClient(null); }}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ maxWidth: 720, padding: 0 }}
            >
              <div className="modal-hdr" style={{ borderBottom: '1px solid var(--card-border)', padding: '20px 24px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
                  <UserPlus size={20} />
                </div>
                <div style={{ marginLeft: 14, flex: 1 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--t1)', margin: 0 }}>{t('prop_modal_assign')}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>Propiedad:</span>
                    <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>{rentingProp.title}</span>
                  </div>
                </div>
                <button style={{ background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16, color: 'var(--t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => { setRentingProp(null); setSelectedClient(null); setClientSearch(''); }}>✕</button>
              </div>

              <div className="modal-scr" style={{ minHeight: 400 }}>
                {/* Stepper Header */}
                <div style={{ display: 'flex', padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid var(--card-border)', gap: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: selectedClient ? 0.5 : 1 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: selectedClient ? 'var(--success)' : 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                      {selectedClient ? '✓' : '1'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Seleccionar Cliente</span>
                  </div>
                  <div style={{ flex: 1, height: 1.5, background: 'var(--card-border)', alignSelf: 'center' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: selectedClient ? 1 : 0.4 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
                      2
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Programar Cita</span>
                  </div>
                </div>

                <div className="modal-body-grid" style={{ padding: 0, gridTemplateColumns: '1fr' }}>
                  {!selectedClient ? (
                    <div style={{ padding: 24 }}>
                      <div className="search-wrap" style={{ marginBottom: 20, background: '#fff', padding: '12px 16px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <Search size={16} color="var(--t3)" />
                        <input 
                          placeholder="Buscar cliente por nombre o teléfono..." 
                          value={clientSearch} 
                          onChange={e => setClientSearch(e.target.value)} 
                          style={{ fontSize: 14, fontWeight: 500 }} 
                        />
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, maxHeight: 380, overflowY: 'auto', padding: '2px' }}>
                        {loading ? (
                          <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', color: 'var(--t3)' }}>Cargando clientes...</div>
                        ) : clientes.filter(c => (c.nombreCompleto || '').toLowerCase().includes(clientSearch.toLowerCase())).length === 0 ? (
                          <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', color: 'var(--t3)' }}>No se encontraron clientes.</div>
                        ) : (
                          clientes
                            .filter(c => (c.nombreCompleto || '').toLowerCase().includes(clientSearch.toLowerCase()))
                            .map((c) => (
                              <motion.div 
                                key={c.id} 
                                whileHover={{ scale: 1.02, y: -2 }}
                                onClick={() => setSelectedClient(c)}
                                style={{ 
                                  padding: '14px', 
                                  borderRadius: 14, 
                                  border: '1.5px solid var(--card-border)', 
                                  background: '#fff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 12,
                                  transition: 'border-color 0.2s, box-shadow 0.2s'
                                }}
                                className="client-assign-item"
                              >
                                <div style={{ 
                                  width: 40, height: 40, borderRadius: 12, 
                                  background: 'linear-gradient(135deg, var(--accent-light), #c7d2fe)', 
                                  color: 'var(--accent)', display: 'flex', alignItems: 'center', 
                                  justifyContent: 'center', fontSize: 15, fontWeight: 800 
                                }}>
                                  {(c.nombreCompleto || '?').charAt(0).toUpperCase()}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombreCompleto}</div>
                                  <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{c.telefono || 'Sin teléfono'}</div>
                                </div>
                              </motion.div>
                            ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      style={{ padding: 32 }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, maxHeight: '60vh', overflowY: 'auto', paddingRight: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div style={{ marginBottom: 0 }}>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 12 }}>Cliente Seleccionado</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: 'var(--accent-light)', borderRadius: 14, border: '1px solid var(--accent)' }}>
                              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>
                                {selectedClient.nombreCompleto.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent)' }}>{selectedClient.nombreCompleto}</div>
                                <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{selectedClient.telefono}</div>
                              </div>
                              <button 
                                onClick={() => setSelectedClient(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
                              >Cambiar</button>
                            </div>
                          </div>

                          <div style={{ height: 1.5, background: 'var(--card-border)', opacity: 0.5 }} />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="fg">
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><Calendar size={14} /> Fecha de la Cita</label>
                              <input type="date" required value={rentingDate} onChange={e => setRentingDate(e.target.value)} />
                            </div>
                            <div className="fg">
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}><Clock size={14} /> Hora de la Cita</label>
                              <input type="time" required value={rentingTime} onChange={e => setRentingTime(e.target.value)} />
                            </div>
                          </div>

                          <div style={{ height: 1.5, background: 'var(--card-border)', opacity: 0.5 }} />

                          {/* Sección Financiera */}
                          <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <TrendingUp size={14} /> {t('prop_commissions')}
                            </h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                              <div className="fg">
                                <label style={{ fontSize: 12 }}>{t('prop_cost')} ($)</label>
                                <input type="number" placeholder="1000" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={{ fontWeight: 700 }} />
                              </div>
                              <div className="fg">
                                <label style={{ fontSize: 12 }}>{t('prop_sale')} ($)</label>
                                <input type="number" placeholder="2000" value={salePrice} onChange={e => setSalePrice(e.target.value)} style={{ fontWeight: 700, color: 'var(--success)' }} />
                              </div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16, border: '1px solid var(--card-border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>Resta Comisiones</span>
                                <button 
                                  onClick={() => setCommissions([...commissions, { name: '', amount: '' }])}
                                  style={{ padding: '4px 10px', borderRadius: 8, background: '#fff', border: '1px solid var(--card-border)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--accent)' }}
                                >
                                  {t('prop_add_comm')}
                                </button>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {commissions.map((comm, idx) => (
                                  <div key={idx} style={{ display: 'flex', gap: 8 }}>
                                    <input 
                                      placeholder={t('prop_comm_name')} 
                                      value={comm.name} 
                                      onChange={e => {
                                        const newC = [...commissions];
                                        newC[idx].name = e.target.value;
                                        setCommissions(newC);
                                      }}
                                      style={{ flex: 2, padding: '8px 12px', fontSize: 12 }}
                                    />
                                    <input 
                                      type="number" 
                                      placeholder={t('prop_comm_amount')} 
                                      value={comm.amount} 
                                      onChange={e => {
                                        const newC = [...commissions];
                                        newC[idx].amount = e.target.value;
                                        setCommissions(newC);
                                      }}
                                      style={{ flex: 1, padding: '8px 12px', fontSize: 12 }}
                                    />
                                    <button 
                                      onClick={() => setCommissions(commissions.filter((_, i) => i !== idx))}
                                      style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >✕</button>
                                  </div>
                                ))}
                                {commissions.length === 0 && (
                                  <div style={{ textAlign: 'center', padding: '10px', fontSize: 11, color: 'var(--t3)', fontStyle: 'italic' }}>Sin comisiones adicionales.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Columna Derecha: Resumen Ganancia */}
                        <div style={{ background: '#f8fafc', borderRadius: 24, padding: 24, border: '1px solid var(--card-border)', display: 'flex', flexDirection: 'column', alignSelf: 'start', position: 'sticky', top: 0 }}>
                          <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--t3)', marginBottom: 20 }}>Resumen de Operación</h4>
                          
                          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                              <Home size={22} />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--t1)' }}>{rentingProp.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{rentingProp.location}</div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fff', padding: 20, borderRadius: 18, border: '1px solid var(--card-border)', marginBottom: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Costo:</span>
                              <span style={{ color: 'var(--t1)', fontWeight: 800 }}>${Number(costPrice).toLocaleString() || '0'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Venta:</span>
                              <span style={{ color: 'var(--success)', fontWeight: 800 }}>${Number(salePrice).toLocaleString() || '0'}</span>
                            </div>
                            
                            <div style={{ height: 1, background: 'var(--card-border)', margin: '4px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                              <span style={{ color: 'var(--t3)', fontWeight: 600 }}>Comisiones:</span>
                              <span style={{ color: '#ef4444', fontWeight: 800 }}>-${commissions.reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString()}</span>
                            </div>

                            <div style={{ height: 1, background: 'var(--card-border)', margin: '4px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--t1)', textTransform: 'uppercase' }}>{t('prop_net_profit')}</span>
                              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>
                                ${((Number(salePrice) || 0) - (Number(costPrice) || 0) - commissions.reduce((s, c) => s + (Number(c.amount) || 0), 0)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <button className="btn btn-primary" onClick={handleAssign} style={{ width: '100%', padding: '16px', justifyContent: 'center', fontSize: 15, borderRadius: 16, boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.3)' }}>
                            <CheckCircle2 size={18} /> Confirmar Asignación
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal: New / Edit Property ── */}
      <AnimatePresence>
        {showAdd && (
          <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ maxWidth: 540, padding: 0, borderRadius: 24 }}
            >
              <div className="modal-hdr" style={{ borderBottom: '1px solid var(--card-border)', background: '#f8fafc', padding: '22px 28px' }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: newP.id ? 'linear-gradient(135deg,#fef3c7,#fde68a)' : 'linear-gradient(135deg,var(--accent-light),#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: newP.id ? '#b45309' : 'var(--accent)' }}>
                  {newP.id ? <Edit2 size={20} /> : <Plus size={22} strokeWidth={2.5} />}
                </div>
                <div style={{ marginLeft: 14 }}>
                  <h2 style={{ fontSize: 19, fontWeight: 900, color: 'var(--t1)' }}>{newP.id ? 'Editar propiedad' : t('prop_modal_new')}</h2>
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{newP.id ? `Modificando "${newP.title}"` : 'Registra un nuevo inmueble en tu sistema.'}</p>
                </div>
                <button style={{ marginLeft: 'auto', background: '#fff', border: '1px solid var(--card-border)', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)' }}
                  onClick={() => setShowAdd(false)}>✕</button>
              </div>
              <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 80px)' }}>
                <div style={{ overflowY: 'auto', padding: '28px 28px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>

                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label>{t('prop_lbl_title')}</label>
                    <div style={{ position: 'relative' }}>
                      <Home size={17} color="var(--t3)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
                      <input placeholder={t('prop_ph_title')} value={newP.title} onChange={e => setNewP({ ...newP, title: e.target.value })} style={{ paddingLeft: 42 }} />
                    </div>
                  </div>

                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label>{t('prop_lbl_loc')}</label>
                    <div style={{ position: 'relative' }}>
                      <MapPin size={17} color="var(--t3)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
                      <input placeholder={t('prop_ph_loc')} value={newP.loc} onChange={e => setNewP({ ...newP, loc: e.target.value })} style={{ paddingLeft: 42 }} />
                    </div>
                  </div>

                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} color="var(--t3)" /> Descripción <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>(opcional)</span></label>
                    <textarea
                      placeholder="Ej: Amplio apartamento con vista al mar, recién remodelado..."
                      value={newP.description}
                      onChange={e => setNewP({ ...newP, description: e.target.value })}
                      rows={3}
                      style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 13 }}
                    />
                  </div>

                  <div style={{ height: 1, background: 'var(--card-border)', width: '100%' }} />

                  <div className="modal-form-grid" style={{ gap: 16 }}>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>{t('prop_lbl_price')}</label>
                      <input placeholder="$0.00" value={newP.price} onChange={e => setNewP({ ...newP, price: e.target.value })} style={{ fontWeight: 700, color: 'var(--accent)' }} />
                    </div>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>{t('prop_lbl_type')}</label>
                      <select value={newP.tag} onChange={e => setNewP({ ...newP, tag: e.target.value })} style={{ fontWeight: 600 }}>
                        <option value="Venta">{t('prop_filter_sale')}</option>
                        <option value="Alquiler">{t('prop_filter_rent')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-form-grid" style={{ gap: 16 }}>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>{t('prop_lbl_beds')}</label>
                      <div style={{ position: 'relative' }}>
                        <Bed size={15} color="var(--t3)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="number" min="0" value={newP.beds} onChange={e => setNewP({ ...newP, beds: e.target.value })} style={{ paddingLeft: 40 }} />
                      </div>
                    </div>
                    <div className="fg" style={{ marginBottom: 0 }}>
                      <label>{t('prop_lbl_baths')}</label>
                      <div style={{ position: 'relative' }}>
                        <Bath size={15} color="var(--t3)" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="number" min="0" value={newP.baths} onChange={e => setNewP({ ...newP, baths: e.target.value })} style={{ paddingLeft: 40 }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '20px 28px 28px', marginTop: 'auto' }}>
                  <button className="btn btn-primary" style={{
                    width: '100%', padding: '15px', justifyContent: 'center', fontSize: 15,
                    background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                    boxShadow: '0 8px 20px -4px rgba(79,70,229,0.35)'
                  }}>
                    {newP.id ? '💾 Guardar cambios' : t('prop_btn_save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .prop-stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .prop-stat-card {
          background: #fff;
          border: 1px solid var(--card-border);
          border-radius: var(--radius);
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--card-shadow);
          transition: all 0.2s;
        }
        .prop-stat-card:hover { transform: translateY(-2px); box-shadow: var(--card-shadow-lg); }

        .prop-filter-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 99px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid var(--card-border);
          background: #fff;
          color: var(--t2);
          transition: all 0.2s;
        }
        .prop-filter-tab:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
        .prop-filter-tab.active { background: var(--accent); color: #fff; border-color: var(--accent); box-shadow: 0 4px 12px rgba(79,70,229,0.2); }

        .prop-filter-count {
          background: var(--card-border);
          color: var(--t3);
          border-radius: 99px;
          font-size: 11px;
          font-weight: 800;
          padding: 1px 7px;
          transition: all 0.2s;
        }
        .prop-filter-count.active { background: rgba(255,255,255,0.25); color: #fff; }

        .prop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .prop-card {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .prop-card:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1) !important;
          border-color: var(--accent) !important;
          z-index: 10;
        }

        .prop-empty {
          text-align: center;
          padding: 60px 32px;
          border: 2px dashed var(--card-border);
          border-radius: var(--radius);
          background: #fdfdfe;
        }
        .prop-empty-icon { font-size: 52px; margin-bottom: 16px; opacity: 0.4; }
        .prop-empty h3 { font-size: 18px; font-weight: 800; color: var(--t2); margin-bottom: 8px; }
        .prop-empty p { font-size: 13px; color: var(--t3); max-width: 280px; margin: 0 auto; }

        @media (max-width: 768px) {
          .prop-stats-bar { grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .prop-stat-card { padding: 14px 12px; gap: 10px; }
          .prop-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .page { padding: 16px !important; }
          .pg-head { flex-direction: column !important; align-items: stretch !important; }
        }
        @media (max-width: 480px) {
          .prop-stats-bar { grid-template-columns: 1fr; }
        }
        .client-assign-item:hover { border-color: var(--accent) !important; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1) !important; }
      `}</style>
    </div>
  );
}
