import { MapPin, Bed, Bath, SquareIcon, Plus, Home, X, UserPlus, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeClientes } from '../lib/api';

const INITIAL_PROPS = [
  { id: 1, title: 'Luxury Villa GENSY', loc: 'Piantini, Santo Domingo', price: '$450,000', beds: 5, baths: 4, sqft: '4,200', tag: 'Venta' },
  { id: 2, title: 'Modern Loft Downtown', loc: 'Naco, Santo Domingo', price: '$280,000', beds: 2, baths: 2, sqft: '1,800', tag: 'Alquiler' },
  { id: 3, title: 'Beach House Premium', loc: 'Juan Dolio, San Pedro', price: '$650,000', beds: 6, baths: 5, sqft: '6,000', tag: 'Venta' },
  { id: 4, title: 'Garden Residence', loc: 'Los Cacicazgos, SD', price: '$320,000', beds: 4, baths: 3, sqft: '3,100', tag: 'Venta' },
  { id: 5, title: 'Skyline Apartment', loc: 'Bella Vista, SD', price: '$390,000', beds: 3, baths: 2, sqft: '2,200', tag: 'Alquiler' },
  { id: 6, title: 'Family Estate', loc: 'Arroyo Hondo, SD', price: '$580,000', beds: 7, baths: 6, sqft: '7,500', tag: 'Venta' },
];

export default function PropiedadesView() {
  const [properties, setProperties] = useState(INITIAL_PROPS);
  const [clientes, setClientes] = useState([]);
  const [filter, setFilter] = useState('Todos');
  const [showAdd, setShowAdd] = useState(false);
  const [rentingProp, setRentingProp] = useState(null);
  const { searchQuery } = useSearch();

  useEffect(() => subscribeClientes(setClientes), []);

  const [newP, setNewP] = useState({ title:'', loc:'', price:'', beds:'', baths:'', tag:'Venta' });

  const filtered = properties.filter(p => {
    const matchesFilter = filter === 'Todos' || p.tag === filter;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.loc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAdd = (e) => {
    e.preventDefault();
    const id = properties.length + 1;
    setProperties([{ ...newP, id }, ...properties]);
    setShowAdd(false);
    setNewP({ title:'', loc:'', price:'', beds:'', baths:'', tag:'Venta' });
  };

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      <div className="pg-head">
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.04em' }}>Propiedades</h1>
          <p style={{ fontSize: 14, color: 'var(--t2)' }}>Portafolio exclusivo con {properties.length} unidades disponibles.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={18} strokeWidth={2.5} /> Nueva Propiedad
        </button>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
        {['Todos', 'Venta', 'Alquiler'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13, padding: '8px 20px' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="prop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {filtered.map((p, i) => (
          <motion.div key={p.id} layout className="p-card card" style={{ 
            overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div className="p-header" style={{
              height: 140, background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              borderBottom: '1px solid var(--card-border)'
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16, background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(79, 70, 229, 0.08)', color: 'var(--accent)',
                border: '1px solid var(--card-border)'
              }}>
                <Home size={32} strokeWidth={1.5} />
              </div>
              <span className="p-tag" style={{
                position: 'absolute', top: 16, right: 16,
                padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: p.tag === 'Venta' ? '#ecfdf5' : '#eff6ff',
                color: p.tag === 'Venta' ? '#10b981' : '#3b82f6',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}>
                {p.tag}
              </span>
            </div>

            <div className="p-body" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 className="p-title" style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 4, letterSpacing: '-0.02em' }}>{p.title}</h4>
                  <p className="p-loc" style={{ fontSize: 13, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                    <MapPin size={14} color="var(--accent)" /> {p.loc}
                  </p>
                </div>
                <span className="p-price" style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em' }}>{p.price}</span>
              </div>
              
              <div className="p-footer" style={{ borderTop: '1px solid #f8fafc', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="p-feats" style={{ display: 'flex', gap: 16 }}>
                  <span className="p-feat" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
                    <Bed size={16} strokeWidth={2} /> {p.beds} <span style={{ fontWeight: 600, color: 'var(--t3)' }}>Hab</span>
                  </span>
                  <span className="p-feat" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>
                    <Bath size={16} strokeWidth={2} /> {p.baths} <span style={{ fontWeight: 600, color: 'var(--t3)' }}>Baños</span>
                  </span>
                </div>
              </div>

              {p.tag === 'Alquiler' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setRentingProp(p); }}
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
                >
                  <UserPlus size={16} /> Rentar a Cliente
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {rentingProp && (
          <div className="modal-backdrop" onClick={() => setRentingProp(null)}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()}
              initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              style={{ maxWidth: 550, padding: 0 }}
            >
              <div className="modal-hdr" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}><UserPlus size={20} /></div>
                <div style={{ marginLeft: 16 }}>
                  <h2 className="modal-hdr-name" style={{ fontSize: 20 }}>Rentar Propiedad</h2>
                  <p style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 600 }}>{rentingProp.title}</p>
                </div>
                <button 
                  style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => setRentingProp(null)}>✕</button>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 16, color: 'var(--t1)' }}>Seleccionar Cliente Guardado</h3>
                <div className="tbl-wrap" style={{ maxHeight: 350, overflowY: 'auto', border: '1px solid var(--card-border)', borderRadius: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Ingresos</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientes.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign:'center', padding:40, color:'var(--t3)', fontSize: 14 }}>No hay clientes registrados.</td></tr>
                      ) : (
                        clientes.map((c, i) => (
                          <tr key={c.id || i}>
                            <td>
                              <div className="av-cell">
                                <div className="tbl-av" style={{ width:32, height:32, fontSize:12, background: 'var(--accent)' }}>{c.nombreCompleto.charAt(0).toUpperCase()}</div>
                                <div style={{ marginLeft: 10 }}>
                                  <p className="cell-n" style={{ fontSize:13 }}>{c.nombreCompleto}</p>
                                  <p style={{ fontSize:11, color: 'var(--t3)' }}>{c.lugarTrabajo}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize:13, fontWeight:700, color: 'var(--t1)' }}>${Number(c.ingresosMensuales||0).toLocaleString()}</td>
                            <td>
                              <button className="btn btn-primary" style={{ padding:'6px 14px', fontSize:11, borderRadius:10 }}
                                onClick={() => {
                                  alert(`Asignado con éxito a ${c.nombreCompleto}`);
                                  setRentingProp(null);
                                }}>
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <div className="modal-backdrop" onClick={() => setShowAdd(false)}>
            <motion.div className="modal-box" onClick={e => e.stopPropagation()}
              initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95, y:20 }}
              style={{ maxWidth: 500, padding: 0 }}
            >
              <div className="modal-hdr" style={{ borderBottom: '1px solid var(--card-border)' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'linear-gradient(135deg, var(--accent), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}><Plus size={20} /></div>
                <h2 className="modal-hdr-name" style={{ fontSize: 20, marginLeft: 16 }}>Nueva Propiedad</h2>
                <button 
                  style={{ marginLeft: 'auto', background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 8, cursor: 'pointer' }}
                  onClick={() => setShowAdd(false)}>✕</button>
              </div>
              <form onSubmit={handleAdd} style={{ padding: 32 }}>
                <div className="fg">
                  <label>Título de la Propiedad</label>
                  <input required placeholder="Ej: Penthouse Luxury" value={newP.title} onChange={e => setNewP({...newP, title: e.target.value})} />
                </div>
                <div className="fg">
                  <label>Ubicación</label>
                  <input required placeholder="Ej: Piantini, SD" value={newP.loc} onChange={e => setNewP({...newP, loc: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="fg">
                    <label>Precio</label>
                    <input required placeholder="$0.00" value={newP.price} onChange={e => setNewP({...newP, price: e.target.value})} />
                  </div>
                  <div className="fg">
                    <label>Tipo</label>
                    <select value={newP.tag} onChange={e => setNewP({...newP, tag: e.target.value})}>
                      <option>Venta</option>
                      <option>Alquiler</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="fg">
                    <label>Habitaciones</label>
                    <input type="number" required placeholder="0" value={newP.beds} onChange={e => setNewP({...newP, beds: e.target.value})} />
                  </div>
                  <div className="fg">
                    <label>Baños</label>
                    <input type="number" required placeholder="0" value={newP.baths} onChange={e => setNewP({...newP, baths: e.target.value})} />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width:'100%', marginTop:12, padding:14, justifyContent: 'center' }}>
                  Guardar Propiedad
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .p-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important; border-color: var(--accent) !important; }
        .p-card:hover .p-header { background: linear-gradient(135deg, #eef3ff 0%, #e0e8ff 100%) !important; }
        @media (max-width: 768px) {
          .prop-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .page { padding: 16px !important; }
          .pg-head { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>
    </div>
  );
}
