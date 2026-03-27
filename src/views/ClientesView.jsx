import { useState, useEffect, useMemo } from 'react';
import { Search, Download, FileText, Filter, Calendar, Users, ChevronRight, UserPlus, Trash2, FileSpreadsheet, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { subscribeClientes, deleteCliente } from '../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClienteModal from '../components/ClienteModal';
import { useLanguage } from '../context/LanguageContext';

const AVATAR_COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#06b6d4', '#f97316', '#22c55e'];

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  const isDev = localStorage.getItem('dev_mode') === 'true';

  useEffect(() => {
    return subscribeClientes(data => {
      setClientes(data);
      setLoading(false);
      setError(null);
    }, err => {
      console.error('Error fetching clients:', err);
      setError(err.message);
      setLoading(false);
    });
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`${t('cli_del_confirm')} "${name}"?`)) return;
    try {
      await deleteCliente(id);
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      alert(`${t('cli_del_error')} ` + err.message);
    }
  };

  const filtered = useMemo(() => {
    return clientes.filter(c => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        (c.nombreCompleto || '').toLowerCase().includes(q) ||
        (c.lugarTrabajo || '').toLowerCase().includes(q) ||
        (c.cashOPrograma || '').toLowerCase().includes(q);

      let matchesDate = true;
      if (c.createdAt) {
        const d = new Date(c.createdAt).getTime();
        if (startDate) {
          const start = new Date(startDate).setHours(0,0,0,0);
          if (d < start) matchesDate = false;
        }
        if (endDate) {
          const end = new Date(endDate).setHours(23,59,59,999);
          if (d > end) matchesDate = false;
        }
      } else if (startDate || endDate) {
        matchesDate = false;
      }
      return matchesSearch && matchesDate;
    });
  }, [clientes, search, startDate, endDate]);

  function exportExcel() {
    const rows = filtered.map(c => ({
      'ID':                      c.id,
      'Nombre Completo':         c.nombreCompleto,
      'Teléfono':                c.telefono || '—',
      'Dirección':               c.direccion || '—',
      'Personas':                c.numPersonas,
      'Habitaciones':            c.numHabitaciones,
      'Edades':                  c.edades,
      'Mascotas':                t('val_' + c.mascotas, { defaultValue: c.mascotas }),
      'Tipo de ID':              t('val_' + c.tipoIdentificacion, { defaultValue: c.tipoIdentificacion }) + (c.tipoIdOtro ? ` (${c.tipoIdOtro})` : ''),
      'Sujeto ID':               c.numeroIdentificacion || '—',
      'ID Fiscal':               t('val_' + c.tipoSocial, { defaultValue: c.tipoSocial }),
      'Número Fiscal':           c.numeroSocial || '—',
      'Credit Score':            c.creditScore || '—',
      'Cuenta Banco':            t('val_' + c.cuentaBanco, { defaultValue: c.cuentaBanco }),
      'Forma de Cobro':          t('val_' + c.formaCobro, { defaultValue: c.formaCobro }),
      'Presentó Taxes':          t('val_' + c.presentoTaxes, { defaultValue: c.presentoTaxes }),
      'Monto Taxes':             c.montoTaxes || 0,
      'Trabaja en':              c.lugarTrabajo || '—',
      'Método Pago Renta':       t('val_' + c.cashOPrograma, { defaultValue: c.cashOPrograma }),
      'Programa Asistencia':     t('val_' + c.programaAsistencia, { defaultValue: c.programaAsistencia }) || '—',
      'Ingresos Mensuales ($)':  c.ingresosMensuales,
      'Fecha y Hora Registro':   c.createdAt ? new Date(c.createdAt).toLocaleString(language === 'en' ? 'en-US' : 'es-DO') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t('cli_export_excel'));
    XLSX.writeFile(wb, `MyAgenda_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    doc.setFontSize(15); doc.setTextColor(15, 23, 42);
    doc.text(t('cli_export_pdf'), 14, 15);
    doc.setFontSize(9); doc.setTextColor(100, 116, 139);
    doc.text(`${t('cli_total_sel')}: ${filtered.length}`, 14, 21);

    autoTable(doc, {
      startY: 26,
      head: [['ID', t('cli_th_client'), t('cli_th_phone'), 'Pers/Hab', t('cli_th_income'), t('dash_no_company'), t('cli_th_bank'), t('cli_th_taxes'), 'Credit', t('cli_th_date')]],
      body: filtered.map(c => [
        c.id.slice(0,6), c.nombreCompleto, c.telefono || '—', `${c.numPersonas} / ${c.numHabitaciones}`,
        `$${Number(c.ingresosMensuales||0).toLocaleString()}`, c.lugarTrabajo?.slice(0,15) || '—',
        t('val_' + c.cuentaBanco, { defaultValue: c.cuentaBanco }) || '—', 
        t('val_' + c.presentoTaxes, { defaultValue: c.presentoTaxes }) || '—', 
        c.creditScore || '—',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`MyAgenda_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  const badgeClass = (val) => {
    if (!val) return 'bg-gray';
    if (['Sí', 'Activo', 'Cash'].includes(val)) return 'bg-green';
    if (val === 'No') return 'bg-red';
    if (['Pendiente', 'Cheque'].includes(val)) return 'bg-yellow';
    return 'bg-blue';
  };

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      <div className="pg-head">
        <div>
          <h1>{t('cli_title')}</h1>
          <p>{clientes.length} {t('cli_subtitle')}</p>
        </div>
        <div className="pg-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ background: '#10b981' }} onClick={exportExcel}>
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-primary" style={{ background: '#ef4444' }} onClick={exportPDF}>
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="search-wrap" style={{ maxWidth: 320, flex: 1 }}>
          <Search size={16} color="var(--t3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('cli_search')} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 10, marginBottom: 2 }}>{t('cli_from')}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13, height: 42 }} />
          </div>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: 10, marginBottom: 2 }}>{t('cli_to')}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13, height: 42 }} />
          </div>
        </div>
        {(search || startDate || endDate) && (
          <button className="btn btn-ghost" style={{ height: 42, color: '#ef4444' }} onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}>{t('cli_clear')}</button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>{t('cli_loading')}</div>
        ) : error ? (
          <div className="empty" style={{ padding: 60, color: '#ef4444' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2>Error de conexión</h2>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>Reintentar</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty" style={{ padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>{search ? '🔍' : '📭'}</div>
            <h2>{t('cli_no_results')}</h2>
            <p>{t('cli_no_results_sub')}</p>
          </div>
        ) : (
          <>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('cli_th_client')}</th>
                    <th>{t('cli_th_phone')}</th>
                    <th>{t('cli_th_income')}</th>
                    <th>{t('cli_th_payment')}</th>
                    <th>{t('cli_th_bank')}</th>
                    <th>{t('cli_th_taxes')}</th>
                    <th>{t('cli_th_pets')}</th>
                    <th>{t('cli_th_date')}</th>
                    <th>{t('cli_th_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id || i} onClick={() => setSelected(c)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="av-cell">
                          <div className="tbl-av" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                            {(c.nombreCompleto || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="cell-n">{c.nombreCompleto}</p>
                            <p style={{ fontSize: 11, color: 'var(--t3)' }}>{c.lugarTrabajo || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{c.telefono || '—'}</td>
                      <td><strong style={{ color: 'var(--accent)' }}>${Number(c.ingresosMensuales||0).toLocaleString()}</strong></td>
                      <td><span className={`badge ${badgeClass(c.cashOPrograma)}`}>{t('val_' + c.cashOPrograma, { defaultValue: c.cashOPrograma }) || '—'}</span></td>
                      <td><span className={`badge ${c.cuentaBanco === 'Sí' ? 'bg-green' : 'bg-red'}`}>{t('val_' + c.cuentaBanco, { defaultValue: c.cuentaBanco }) || '—'}</span></td>
                      <td><span className={`badge ${c.presentoTaxes === 'Sí' ? 'bg-blue' : 'bg-gray'}`}>{t('val_' + c.presentoTaxes, { defaultValue: c.presentoTaxes }) || '—'}</span></td>
                      <td><span className={`badge ${c.mascotas === 'Sí' ? 'bg-yellow' : 'bg-gray'}`}>{t('val_' + c.mascotas, { defaultValue: c.mascotas }) || '—'}</span></td>
                      <td style={{ fontSize: 11, color: 'var(--t3)' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : '—'}</td>
                      <td>
                        <div style={{ display:'flex', gap:8 }} onClick={e => e.stopPropagation()}>
                          <button className="btn-icon" style={{ color: 'var(--t2)', background: '#f1f5f9' }} onClick={() => navigate('/form', { state: { editDato: c, isAdminEdit: true } })}><Edit2 size={16} /></button>
                          {isDev && (
                            <button className="btn-icon" style={{ color: '#ef4444', background: '#fee2e2' }} onClick={() => handleDelete(c.id, c.nombreCompleto)}><Trash2 size={16} /></button>
                          )}
                          <button className="btn-icon" onClick={() => setSelected(c)}><ChevronRight size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-cards">
              {filtered.map((c, i) => (
                <div key={c.id || i} className="mobile-card" onClick={() => setSelected(c)}>
                  <div className="mcard-head">
                    <div className="tbl-av" style={{ width: 44, height: 44, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {(c.nombreCompleto || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p className="cell-n" style={{ fontSize: 16 }}>{c.nombreCompleto}</p>
                      <p style={{ fontSize: 12, color: 'var(--t3)' }}>{c.lugarTrabajo || '—'}</p>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-icon" style={{ color: 'var(--t2)', background: '#f1f5f9', width: 28, height: 28 }} onClick={() => navigate('/form', { state: { editDato: c, isAdminEdit: true } })}><Edit2 size={14} /></button>
                        <button className="btn-icon" style={{ color: '#ef4444', background: '#fee2e2', width: 28, height: 28 }} onClick={() => handleDelete(c.id, c.nombreCompleto)}><Trash2 size={14} /></button>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>${Number(c.ingresosMensuales||0).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mcard-body" style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ fontSize:12 }}><b style={{ color:'var(--t3)', display:'block', fontSize:10 }}>{t('cli_th_phone').toUpperCase()}</b> {c.telefono || '—'}</div>
                    <div style={{ fontSize:12 }}><b style={{ color:'var(--t3)', display:'block', fontSize:10 }}>ID</b> {c.numeroIdentificacion || '—'}</div>
                    <div style={{ fontSize:12 }}><b style={{ color:'var(--t3)', display:'block', fontSize:10 }}>{t('cli_th_payment').toUpperCase()}</b> <span className={`badge ${badgeClass(c.cashOPrograma)}`}>{t('val_' + c.cashOPrograma, { defaultValue: c.cashOPrograma })}</span></div>
                    <div style={{ fontSize:12 }}><b style={{ color:'var(--t3)', display:'block', fontSize:10 }}>{t('cli_th_bank').toUpperCase()}</b> <span className={`badge ${c.cuentaBanco === 'Sí' ? 'bg-green' : 'bg-red'}`}>{t('val_' + c.cuentaBanco, { defaultValue: c.cuentaBanco })}</span></div>
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.createdAt ? new Date(c.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-DO') : '—'}</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSelected(c); }}>{t('cli_view_details')}</button>
                      {isDev && (
                        <button className="btn-icon" style={{ color: '#ef4444' }} onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.nombreCompleto); }}><Trash2 size={16} /></button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {selected && <ClienteModal cliente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
