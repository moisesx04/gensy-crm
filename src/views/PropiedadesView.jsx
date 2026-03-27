import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, Bed, Bath, Plus, Home, UserPlus, Trash2, CheckCircle2, Clock, Calendar, Users, Search, Edit2, TrendingUp, Tag, FileText, Upload, X, Image as ImageIcon } from 'lucide-react';
import { getProperties, addProperty, updateProperty, subscribeTo, subscribeClientes, deleteProperty } from '../lib/api';
import { useSearch } from '../context/SearchContext';
import { useLanguage } from '../context/LanguageContext';
import * as XLSX from 'xlsx';

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
  const [mapViews, setMapViews] = useState({});
  const { searchQuery } = useSearch();

  useEffect(() => {
    const unsubProps = subscribeTo(getProperties, setProperties, 15000);
    const unsubClients = subscribeClientes(data => {
      setClientes(data);
      setLoading(false);
    });
    return () => { unsubProps(); unsubClients(); };
  }, []);

  const [newP, setNewP] = useState({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '', image_url: '', image_urls: [] });


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
        description: newP.description || '',
        image_url: newP.image_url || '',
        image_urls: newP.image_urls || []
      };

      if (newP.id) {
        const updatedProp = await updateProperty(sanitizedP);
        setProperties(prev => prev.map(p => p.id === newP.id ? { ...updatedProp, status: p.status, cliente_id: p.cliente_id } : p));
      } else {
        const savedProp = await addProperty(sanitizedP);
        setProperties(prev => [savedProp, ...prev]);
      }

      setShowAdd(false);
      setNewP({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '', image_url: '' });
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
      description: p.description || '',
      image_url: p.image_url || '',
      image_urls: p.image_urls || []
    });
    setShowAdd(true);
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // Compression bounds
          const MAX_SIZE = 800;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Check if limits exceeded
    if ((newP.image_urls?.length || 0) + files.length > 3) {
      alert('Solo puedes subir hasta 3 fotos para no llenar el almacenamiento.');
      return;
    }

    try {
      const compressedImages = await Promise.all(files.map(compressImage));
      setNewP(prev => ({ ...prev, image_urls: [...(prev.image_urls || []), ...compressedImages] }));
    } catch (err) {
      alert("Error al comprimir las imágenes.");
    }
    e.target.value = null; // reset
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
    if (p.tag === 'Venta') return 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
    return 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)';
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

  const exportExcel = () => {
    const rows = properties.map(p => ({
      'ID': p.id,
      'Título': p.title,
      'Ubicación': p.location || '—',
      'Precio Publicado': p.price,
      'Habitaciones': p.beds,
      'Baños': p.baths,
      'Tipo': p.tag,
      'Estado': p.status || 'Disponible',
      'Cliente Asignado': p.cliente_nombre || '—',
      'Precio Venta Real': p.financiero?.salePrice || '—',
      'Costo Base': p.financiero?.costPrice || '—',
      'Comisiones Descontadas': p.financiero?.commissions?.reduce((s,c)=>s+(Number(c.amount)||0), 0) || 0,
      'Ganancia Neta': (Number(p.financiero?.salePrice) || 0) - (Number(p.financiero?.costPrice) || 0) - (p.financiero?.commissions?.reduce((s,c)=>s+(Number(c.amount)||0), 0) || 0),
      'Fecha Cita': p.fecha_cita ? new Date(p.fecha_cita).toLocaleString() : '—'
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Propiedades');
    XLSX.writeFile(wb, `Mis_Propiedades_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      {/* ── Header ── */}
      <div className="pg-head">
        <div>
          <h1>{t('prop_title')}</h1>
          <p>{t('prop_desc')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ background: '#10b981', boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.3)' }} onClick={exportExcel}>
            <FileText size={15} /> Excel
          </button>
          <button className="btn btn-primary" onClick={() => { setNewP({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '', image_url: '', image_urls: [] }); setShowAdd(true); }}>
            <Plus size={18} /> {t('prop_new')}
          </button>
        </div>
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
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => { setNewP({ title: '', loc: '', price: '', beds: '', baths: '', tag: 'Venta', description: '', image_url: '', image_urls: [] }); setShowAdd(true); }}>
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
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', filter: 'blur(12px)', pointerEvents: 'none', zIndex: 1 }} />
                <div style={{ position: 'absolute', bottom: -15, left: -15, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', filter: 'blur(10px)', pointerEvents: 'none', zIndex: 1 }} />

                {/* Center / Full image or Map */}
                <AnimatePresence mode="wait">
                  {mapViews[p.id] ? (
                    <motion.div
                      key="map"
                      initial={{ opacity: 0, rotateY: 90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: -90 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 5 }}
                    >
                      <iframe 
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(p.location || p.title)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0 }} 
                        loading="lazy"
                        title={`Mapa de ${p.title}`}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="img"
                      initial={{ opacity: 0, rotateY: -90 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: 90 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                    >
                      {p.image_urls?.length > 0 || p.image_url ? (
                        <>
                          <img src={p.image_urls?.length > 0 ? p.image_urls[0] : p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 60%, rgba(0,0,0,0.1) 100%)' }} />
                          {p.image_urls?.length > 1 && (
                            <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12 }}>
                              + {p.image_urls.length - 1} fotos
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{
                          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                          width: 68, height: 68, borderRadius: 22, background: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 12px 28px -6px rgba(0,0,0,0.12)',
                          color: cardAccent(p), zIndex: 5
                        }}>
                          {p.status === 'Rentada' ? <CheckCircle2 size={34} /> : <Home size={34} strokeWidth={1.5} />}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Map Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMapViews(prev => ({ ...prev, [p.id]: !prev[p.id] })); }}
                  style={{
                    position: 'absolute', top: 12, left: 12, width: 34, height: 34, borderRadius: '50%',
                    background: mapViews[p.id] ? 'var(--accent)' : 'rgba(255,255,255,0.9)',
                    color: mapViews[p.id] ? '#fff' : 'var(--t2)',
                    border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
                    transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                  }}
                >
                  {mapViews[p.id] ? <ImageIcon size={16} /> : <Map size={16} />}
                </button>

                {/* Top-right: tag + actions */}
                <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6, alignItems: 'center', zIndex: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <span style={{
                    padding: '5px 12px', borderRadius: 99, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: p.tag === 'Venta' ? '#eff6ff' : '#f0f9ff',
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
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
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
                      key="step2"
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      style={{ padding: 40 }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, maxHeight: '65vh', overflowY: 'auto', paddingRight: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                          <div style={{ marginBottom: 0 }}>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--t3)', marginBottom: 16, fontWeight: 800 }}>Cliente Seleccionado</h4>
                            <motion.div 
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, background: 'rgba(79, 70, 229, 0.05)', borderRadius: 18, border: '1px solid rgba(79, 70, 229, 0.2)' }}
                            >
                              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.3)' }}>
                                {selectedClient.nombreCompleto.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--t1)' }}>{selectedClient.nombreCompleto}</div>
                                <div style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>{selectedClient.telefono}</div>
                              </div>
                              <button 
                                onClick={() => setSelectedClient(null)}
                                style={{ background: 'white', border: '1px solid var(--card-border)', color: 'var(--accent)', padding: '6px 12px', borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                              >Cambiar</button>
                            </motion.div>
                          </div>

                          <div style={{ height: 1.5, background: 'var(--card-border)', opacity: 0.3 }} />

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="fg" style={{ marginBottom: 0 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}><Calendar size={14} /> Fecha de la Cita</label>
                              <input type="date" required value={rentingDate} onChange={e => setRentingDate(e.target.value)} />
                            </div>
                            <div className="fg" style={{ marginBottom: 0 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}><Clock size={14} /> Hora de la Cita</label>
                              <input type="time" required value={rentingTime} onChange={e => setRentingTime(e.target.value)} />
                            </div>
                          </div>

                          <div style={{ height: 1.5, background: 'var(--card-border)', opacity: 0.3 }} />

                          <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--t3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800 }}>
                              <TrendingUp size={16} /> Distribución Financiera
                            </h4>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                              <div className="fg" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 13, fontWeight: 700 }}>{t('prop_cost')} ($)</label>
                                <input type="number" placeholder="1000" value={costPrice} onChange={e => setCostPrice(e.target.value)} style={{ fontWeight: 800, fontSize: 16 }} />
                              </div>
                              <div className="fg" style={{ marginBottom: 0 }}>
                                <label style={{ fontSize: 13, fontWeight: 700 }}>{t('prop_sale')} ($)</label>
                                <input type="number" placeholder="2000" value={salePrice} onChange={e => setSalePrice(e.target.value)} style={{ fontWeight: 800, color: 'var(--success)', fontSize: 16 }} />
                              </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: 20, borderRadius: 20, border: '1px solid var(--card-border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t2)' }}>Comisiones Adicionales</span>
                                <motion.button 
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  type="button"
                                  onClick={() => setCommissions([...commissions, { name: '', amount: '' }])}
                                  style={{ padding: '8px 16px', borderRadius: 10, background: '#fff', border: '1px solid var(--accent)', fontSize: 12, fontWeight: 800, cursor: 'pointer', color: 'var(--accent)' }}
                                >
                                  + {t('prop_add_comm')}
                                </motion.button>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {commissions.map((comm, idx) => (
                                  <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx} 
                                    style={{ display: 'flex', gap: 10 }}
                                  >
                                    <input 
                                      placeholder={t('prop_comm_name')} 
                                      value={comm.name} 
                                      onChange={e => {
                                        const newC = [...commissions];
                                        newC[idx].name = e.target.value;
                                        setCommissions(newC);
                                      }}
                                      style={{ flex: 2, padding: '12px 16px', fontSize: 14, borderRadius: 12 }}
                                    />
                                    <input 
                                      type="number" 
                                      placeholder="$" 
                                      value={comm.amount} 
                                      onChange={e => {
                                        const newC = [...commissions];
                                        newC[idx].amount = e.target.value;
                                        setCommissions(newC);
                                      }}
                                      style={{ flex: 1, padding: '12px 16px', fontSize: 14, borderRadius: 12, fontWeight: 700, color: 'var(--danger)' }}
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => setCommissions(commissions.filter((_, i) => i !== idx))}
                                      style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 12, width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                    >✕</button>
                                  </motion.div>
                                ))}
                                {commissions.length === 0 && (
                                  <div style={{ textAlign: 'center', padding: '16px', fontSize: 13, color: 'var(--t3)', fontStyle: 'italic', background: '#fff', borderRadius: 12, border: '1px dashed var(--card-border)' }}>
                                    No hay comisiones añadidas todavía.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Summary Column - Fixed/Sticky */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'sticky', top: 0, alignSelf: 'start' }}>
                          <div className="card" style={{ background: 'var(--accent)', color: '#fff', border: 'none', padding: 32, boxShadow: '0 20px 40px -12px rgba(37, 99, 235, 0.4)', borderRadius: 24 }}>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)', marginBottom: 24, fontWeight: 800 }}>Resumen Financiero</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>Total Venta</span>
                                <span style={{ fontSize: 18, fontWeight: 900 }}>${Number(salePrice).toLocaleString() || '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>Costo Base</span>
                                <span style={{ fontSize: 18, fontWeight: 900 }}>-${Number(costPrice).toLocaleString() || '0'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ opacity: 0.8, fontSize: 13, fontWeight: 600 }}>Comisiones</span>
                                <span style={{ fontSize: 18, fontWeight: 900 }}>-${commissions.reduce((s, c) => s + (Number(c.amount) || 0), 0).toLocaleString()}</span>
                              </div>
                              
                              <div style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '8px 0' }} />
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ganancia Neta</span>
                                <motion.span 
                                  key={salePrice + costPrice + commissions.length}
                                  initial={{ scale: 1.2, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  style={{ fontSize: 32, fontWeight: 900 }}
                                >
                                  ${((Number(salePrice) || 0) - (Number(costPrice) || 0) - commissions.reduce((s, c) => s + (Number(c.amount) || 0), 0)).toLocaleString()}
                                </motion.span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="card" style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', borderRadius: 20 }}>
                            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f8fafc', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                              <Home size={24} />
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--t1)' }}>{rentingProp.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600 }}>{rentingProp.location}</div>
                            </div>
                          </div>

                          <motion.button 
                            whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -12px rgba(79, 70, 229, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            className="btn btn-primary" 
                            type="button"
                            onClick={handleAssign} 
                            style={{ width: '100%', padding: '20px', justifyContent: 'center', fontSize: 16, borderRadius: 20, boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.2)' }}
                          >
                            <CheckCircle2 size={20} /> {t('prop_confirm_assign')}
                          </motion.button>
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ImageIcon size={14} color="var(--t3)" /> Fotos de la propiedad</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>{(newP.image_urls?.length || 0)} / 3</span>
                    </label>
                    
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                      {(newP.image_urls || []).map((url, idx) => (
                        <div key={idx} style={{ position: 'relative', width: 72, height: 72, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                          <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Upload preview" />
                          <button type="button" onClick={() => setNewP(p => ({ ...p, image_urls: p.image_urls.filter((_, i) => i !== idx) }))} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <X size={12} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                      
                      {(newP.image_urls?.length || 0) < 3 && (
                        <label style={{ width: 72, height: 72, borderRadius: 12, border: '2px dashed var(--card-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', color: 'var(--t3)' }}>
                          <Upload size={18} style={{ marginBottom: 4 }} />
                          <span style={{ fontSize: 10, fontWeight: 700 }}>Subir</span>
                          <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="fg" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={13} color="var(--t3)" /> URL Analógica <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>(opcional)</span></label>
                    <input 
                      placeholder="https://images.unsplash.com/photo..." 
                      value={newP.image_url} 
                      onChange={e => setNewP({ ...newP, image_url: e.target.value })} 
                    />
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
                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.35)'
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
