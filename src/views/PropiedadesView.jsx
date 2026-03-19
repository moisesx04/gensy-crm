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
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em' }}>Propiedades</h1>
          <p style={{ fontSize: 14, opacity: 0.7 }}>Portafolio exclusivo con {properties.length} unidades disponibles.</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: 14 }} onClick={() => setShowAdd(true)}>
          <Plus size={18} strokeWidth={2.5} /> Nueva Propiedad
        </button>
      </div>

      {/* Filter pills */}
      <div className="filter-pills" style={{ marginBottom: 32 }}>
        {['Todos', 'Venta', 'Alquiler'].map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`pill ${filter === f ? 'active' : ''}`}
            style={{ fontSize: 14, padding: '10px 24px' }}>
            {f}
          </button>
        ))}
      </div>

      <div className="prop-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {filtered.map((p, i) => (
          <motion.div key={p.id} layout className="p-card" style={{ 
            background: '#fff', border: '1.5px solid #eef0f7', borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.03)', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div className="p-header" style={{
              height: 140, background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{
                width: 70, height: 70, borderRadius: 20, background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 12px 24px rgba(79,110,247,0.12)', color: 'var(--accent)'
              }}>
                <Home size={34} strokeWidth={1.5} />
              </div>
              <span className="p-tag" style={{
                position: 'absolute', top: 16, right: 16,
                padding: '6px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                background: p.tag === 'Venta' ? 'rgba(79,110,247,0.1)' : 'rgba(232,79,140,0.1)',
                color: p.tag === 'Venta' ? 'var(--accent)' : 'var(--accent2)',
                backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.4)'
              }}>
                {p.tag}
              </span>
            </div>

            <div className="p-body" style={{ padding: '24px 24px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 className="p-title" style={{ fontSize: 19, fontWeight: 800, color: '#0d1630', marginBottom: 4 }}>{p.title}</h4>
                  <p className="p-loc" style={{ fontSize: 13, color: '#7e87a2', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} color="var(--accent)" /> {p.loc}
                  </p>
                </div>
                <span className="p-price" style={{ fontSize: 20, fontWeight: 900, color: 'var(--accent)' }}>{p.price}</span>
              </div>
              
              <div className="p-footer" style={{ borderTop: '1.5px solid #f8faff', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="p-feats" style={{ display: 'flex', gap: 16 }}>
                  <span className="p-feat" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#5a6480' }}>
                    <Bed size={16} strokeWidth={2} /> {p.beds} <span style={{ fontWeight: 400, opacity:0.6 }}>Hab</span>
                  </span>
                  <span className="p-feat" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#5a6480' }}>
                    <Bath size={16} strokeWidth={2} /> {p.baths} <span style={{ fontWeight: 400, opacity:0.6 }}>Baños</span>
                  </span>
                </div>
              </div>

              {p.tag === 'Alquiler' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setRentingProp(p); }}
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: 20, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 800, boxShadow: '0 4px 12px rgba(79,110,247,0.2)' }}
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
              initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
              style={{ maxWidth: 550, padding: 0 }}
            >
              <div className="modal-hdr">
                <div className="modal-av"><UserPlus size={24} /></div>
                <div>
                  <h2 className="modal-hdr-name">Rentar Propiedad</h2>
                  <p className="modal-hdr-sub">{rentingProp.title}</p>
                </div>
                <button className="modal-close" onClick={() => setRentingProp(null)}><X size={18}/></button>
              </div>
              <div style={{ padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Seleccionar Cliente Guardado</h3>
                <div className="tbl-wrap" style={{ maxHeight: 350, overflowY: 'auto', border: '1.5px solid var(--card-border)', borderRadius: 16 }}>
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
                        <tr><td colSpan="3" style={{ textAlign:'center', padding:40, color:'var(--t3)' }}>No hay clientes registrados.</td></tr>
                      ) : (
                        clientes.map((c, i) => (
                          <tr key={c.id || i}>
                            <td>
                              <div className="av-cell">
                                <div className="tbl-av" style={{ width:28, height:28, fontSize:11, background: '#4f6ef7' }}>{c.nombreCompleto.charAt(0)}</div>
                                <div>
                                  <p className="cell-n" style={{ fontSize:13 }}>{c.nombreCompleto}</p>
                                  <p className="cell-s" style={{ fontSize:11 }}>{c.lugarTrabajo}</p>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize:13, fontWeight:700 }}>${Number(c.ingresosMensuales||0).toLocaleString()}</td>
                            <td>
                              <button className="btn btn-primary" style={{ padding:'5px 12px', fontSize:11, borderRadius:8 }}
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
              initial={{ opacity:0, scale:0.9, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.9, y:20 }}
              style={{ maxWidth: 500, padding: 0 }}
            >
              <div className="modal-hdr" style={{ background: 'linear-gradient(135deg, #0d1630 0%, #1a296e 100%)' }}>
                <div className="modal-av"><Plus size={24} /></div>
                <h2 className="modal-hdr-name">Nueva Propiedad</h2>
                <button className="modal-close" onClick={() => setShowAdd(false)}><X size={18}/></button>
              </div>
              <form onSubmit={handleAdd} style={{ padding: 24 }}>
                <div className="fg">
                  <label>Título de la Propiedad</label>
                  <input required placeholder="Ej: Penthouse Luxury" value={newP.title} onChange={e => setNewP({...newP, title: e.target.value})} />
                </div>
                <div className="fg">
                  <label>Ubicación</label>
                  <input required placeholder="Ej: Piantini, SD" value={newP.loc} onChange={e => setNewP({...newP, loc: e.target.value})} />
                </div>
                <div className="fg-row">
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
                <div className="fg-row">
                  <div className="fg">
                    <label>Habitaciones</label>
                    <input type="number" required placeholder="0" value={newP.beds} onChange={e => setNewP({...newP, beds: e.target.value})} />
                  </div>
                  <div className="fg">
                    <label>Baños</label>
                    <input type="number" required placeholder="0" value={newP.baths} onChange={e => setNewP({...newP, baths: e.target.value})} />
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width:'100%', marginTop:10, padding:14, borderRadius:12 }}>
                  Guardar Propiedad
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style>{`
        .p-card:hover { transform: translateY(-8px); boxShadow: 0 20px 40px rgba(0,0,0,0.08) !important; borderColor: var(--accent) !important; }
        .p-card:hover .p-header { background: linear-gradient(135deg, #eef3ff 0%, #e0e8ff 100%) !important; }
      `}</style>
    </div>
  );
}
