import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Calendar, Clock, TrendingUp, Home, CheckCircle2 } from 'lucide-react';
import { updateProperty } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

export default function PropertyAssignModal({ rentingProp, clientes, loading, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [selectedClient, setSelectedClient] = useState(null);
  const [rentingDate, setRentingDate] = useState('');
  const [rentingTime, setRentingTime] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [commissions, setCommissions] = useState([]);

  if (!rentingProp) return null;

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

      const updatedData = {
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
      };

      await updateProperty(updatedData);
      alert(`${t('prop_alert_success')} ${selectedClient.nombreCompleto}. ${t('prop_appointment')} ${rentingDate} ${rentingTime}`);
      onSuccess(updatedData);
      onClose();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
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
            onClick={onClose}>✕</button>
        </div>

        <div className="modal-scr" style={{ minHeight: 400 }}>
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
  );
}
