import { useState, useEffect } from 'react';
import { subscribeClientes, deleteCliente } from '../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClienteModal from '../components/ClienteModal';
import { Search, Trash2, Eye, FileSpreadsheet, FileText } from 'lucide-react';
import { useSearch } from '../context/SearchContext';

const AVATAR_COLORS = ['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1'];

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [selected, setSelected] = useState(null);
  const { searchQuery: search, setSearchQuery: setSearch } = useSearch();
  const [deleting, setDeleting] = useState(null);

  // Date Filtering States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => subscribeClientes(setClientes), []);

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (c.nombreCompleto || '').toLowerCase().includes(q) ||
      (c.lugarTrabajo || '').toLowerCase().includes(q) ||
      (c.cashOPrograma || '').toLowerCase().includes(q);

    // Date range logic
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

  // ── EXCEL (Reports EVERYTHING) ────────────────────────────────
  function exportExcel() {
    const rows = filtered.map(c => ({
      'ID':                      c.id,
      'Nombre Completo':         c.nombreCompleto,
      'Teléfono':                c.telefono || '—',
      'Dirección':               c.direccion || '—',
      'Personas':                c.numPersonas,
      'Habitaciones':            c.numHabitaciones,
      'Edades':                  c.edades,
      'Mascotas':                c.mascotas,
      'Tipo de ID':              c.tipoIdentificacion + (c.tipoIdOtro ? ` (${c.tipoIdOtro})` : ''),
      'Sujeto ID':               c.numeroIdentificacion || '—',
      'ID Fiscal':               c.tipoSocial,
      'Número Fiscal':           c.numeroSocial || '—',
      'Credit Score':            c.creditScore || 'No ind.',
      'Cuenta Banco':            c.cuentaBanco,
      'Forma de Cobro':          c.formaCobro,
      'Presentó Taxes':          c.presentoTaxes,
      'Monto Taxes':             c.montoTaxes || 0,
      'Trabaja en':              c.lugarTrabajo || '—',
      'Método Pago Renta':       c.cashOPrograma,
      'Programa Asistencia':     c.programaAsistencia || '—',
      'Ingresos Mensuales ($)':  c.ingresosMensuales,
      'Fecha y Hora Registro':   c.createdAt ? new Date(c.createdAt).toLocaleString('es-DO') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Completo GENSY');
    XLSX.writeFile(wb, `GENSY_Reporte_Completo_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // ── PDF ──────────────────────────────────────────────────────
  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    doc.setFontSize(15);
    doc.setTextColor(15, 23, 42);
    doc.text('GENSY Inmobiliario — Reporte de Clientes', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Total seleccionados: ${filtered.length}  |  Generado: ${new Date().toLocaleString('es-DO')}`, 14, 21);

    autoTable(doc, {
      startY: 26,
      head: [['ID', 'Nombre', 'Teléfono', 'Personas', 'Ingresos', 'Trabajo', 'Banco', 'Taxes', 'Credit', 'Fecha']],
      body: filtered.map(c => [
        c.id,
        c.nombreCompleto,
        c.telefono || '—',
        `${c.numPersonas}p / ${c.numHabitaciones}h`,
        `$${Number(c.ingresosMensuales||0).toLocaleString()}`,
        c.lugarTrabajo?.slice(0, 15) || '—',
        c.cuentaBanco || '—',
        c.presentoTaxes || '—',
        c.creditScore || '—',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-DO') : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`GENSY_Reporte_${new Date().toISOString().slice(0,10)}.pdf`);
  }

  function handleDelete(id, nombre) {
    if (!window.confirm(`¿Eliminar el registro de "${nombre}"? Esta acción no se puede deshacer.`)) return;
    deleteCliente(id);
  }

  const badgeClass = (val) => {
    if (!val) return 'bg-gray';
    if (['Sí', 'Activo', 'Cash'].includes(val)) return 'bg-green';
    if (val === 'No') return 'bg-red';
    if (['Pendiente', 'Cheque'].includes(val)) return 'bg-yellow';
    return 'bg-blue';
  };

  return (
    <div className="page">
      <div className="pg-head">
        <div>
          <h1>Clientes</h1>
          <p>{clientes.length} registros · actualización en tiempo real</p>
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

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="search-wrap" style={{ maxWidth: 320, flex: 1 }}>
          <Search size={16} color="var(--t3)" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, trabajo..." />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginLeft: 4 }}>Desde:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13, height: 42, minWidth: 140 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', marginLeft: 4 }}>Hasta:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13, height: 42, minWidth: 140 }} />
          </div>
        </div>

        {(search || startDate || endDate) && (
          <button className="btn btn-ghost" style={{ padding: '0 16px', fontSize: 13, height: 42, color: '#ef4444' }}
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">{search ? '🔍' : '📭'}</div>
            <h3>{search ? 'Sin resultados' : 'Sin clientes aún'}</h3>
            <p>{search
              ? `No hay registros que coincidan con "${search}".`
              : 'Comparte el link /form con tus clientes.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Per./Hab.</th>
                    <th>Ingresos/mes</th>
                    <th>Pago</th>
                    <th>Banco</th>
                    <th>Taxes</th>
                    <th>Mascotas</th>
                    <th>Registro</th>
                    <th></th>
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
                            <p style={{ fontSize: 12, color: 'var(--t3)' }}>{c.lugarTrabajo || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{c.telefono || '—'}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.numPersonas} per.</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.numHabitaciones} hab.</div>
                      </td>
                      <td><strong style={{ color: 'var(--accent)' }}>${Number(c.ingresosMensuales||0).toLocaleString()}</strong></td>
                      <td><span className={`badge ${badgeClass(c.cashOPrograma)}`}>{c.cashOPrograma || '—'}</span></td>
                      <td><span className={`badge ${c.cuentaBanco === 'Sí' ? 'bg-green' : 'bg-red'}`}>{c.cuentaBanco || '—'}</span></td>
                      <td><span className={`badge ${c.presentoTaxes === 'Sí' ? 'bg-blue' : 'bg-gray'}`}>{c.presentoTaxes || '—'}</span></td>
                      <td><span className={`badge ${c.mascotas === 'Sí' ? 'bg-yellow' : 'bg-gray'}`}>{c.mascotas || '—'}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap' }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-DO') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button title="Ver detalle"
                            onClick={() => setSelected(c)}
                            className="icon-btn" style={{ width: 34, height: 34, borderRadius: 10 }}>
                            <Eye size={16} />
                          </button>
                          <button title="Eliminar"
                            onClick={() => handleDelete(c.id, c.nombreCompleto)}
                            className="icon-btn" style={{ width: 34, height: 34, borderRadius: 10, borderColor: '#fee2e2', color: '#ef4444' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
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
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>
                        ${Number(c.ingresosMensuales||0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--t3)' }}>/mes</div>
                    </div>
                  </div>
                  
                  <div className="mcard-body">
                    <div className="mcard-item">
                      <b>📞 Teléfono</b>
                      {c.telefono || '—'}
                    </div>
                    <div className="mcard-item">
                      <b>👥 Ocupantes</b>
                      {c.numPersonas} per. / {c.numHabitaciones} hab.
                    </div>
                    <div className="mcard-item">
                      <b>💳 Pago</b>
                      <span className={`badge ${badgeClass(c.cashOPrograma)}`}>{c.cashOPrograma || '—'}</span>
                    </div>
                    <div className="mcard-item">
                      <b>🏦 Banco</b>
                      <span className={`badge ${c.cuentaBanco === 'Sí' ? 'bg-green' : 'bg-red'}`}>{c.cuentaBanco || '—'}</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-DO') : '—'}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSelected(c); }}>
                        Ver Todo
                      </button>
                      <button className="icon-btn" style={{ width: 32, height: 32, borderColor: '#fee2e2', color: '#ef4444' }} 
                        onClick={(e) => { e.stopPropagation(); handleDelete(c.id, c.nombreCompleto); }}>
                        <Trash2 size={14} />
                      </button>
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
