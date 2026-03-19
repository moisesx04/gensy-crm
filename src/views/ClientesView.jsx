import { useState, useEffect } from 'react';
import { subscribeClientes, deleteCliente } from '../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClienteModal from '../components/ClienteModal';
import { Search, Trash2, Eye, FileSpreadsheet, FileText } from 'lucide-react';
import { useSearch } from '../context/SearchContext';

const AVATAR_COLORS = ['#4f6ef7','#17c98a','#e84f8c','#f5a623','#a78bfa','#06b6d4','#f97316','#84cc16'];

export default function ClientesView() {
  const [clientes, setClientes] = useState([]);
  const [selected, setSelected] = useState(null);
  const { searchQuery: search, setSearchQuery: setSearch } = useSearch();
  const [deleting, setDeleting] = useState(null);

  useEffect(() => subscribeClientes(setClientes), []);

  const filtered = clientes.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      (c.nombreCompleto || '').toLowerCase().includes(q) ||
      (c.lugarTrabajo || '').toLowerCase().includes(q) ||
      (c.cashOPrograma || '').toLowerCase().includes(q);
  });

  // ── EXCEL ────────────────────────────────────────────────────
  function exportExcel() {
    const rows = clientes.map(c => ({
      'Nombre Completo':       c.nombreCompleto,
      'Personas':              c.numPersonas,
      'Habitaciones':          c.numHabitaciones,
      'Edades':                c.edades,
      'Credit Score':          c.creditScore || '',
      'Cuenta de Banco':       c.cuentaBanco,
      'Cobra':                 c.formaCobro,
      'Presentó Taxes':        c.presentoTaxes,
      'Monto Taxes ($)':       c.montoTaxes || 0,
      'Mascotas':              c.mascotas,
      'Identificación':        c.tipoIdentificacion + (c.tipoIdOtro ? ` (${c.tipoIdOtro})` : ''),
      'No. Fiscal':            c.tipoSocial,
      'Trabaja en':            c.lugarTrabajo,
      'Forma de Pago':         c.cashOPrograma,
      'Programa Asistencia':   c.programaAsistencia || '',
      'Ingresos Mensuales ($)': c.ingresosMensuales,
      'Fecha de Registro':     c.createdAt ? new Date(c.createdAt).toLocaleString('es-DO') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes GENSY');
    XLSX.writeFile(wb, `GENSY_Clientes_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  // ── PDF ──────────────────────────────────────────────────────
  function exportPDF() {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    doc.setFontSize(15);
    doc.setTextColor(13, 22, 48);
    doc.text('GENSY Inmobiliario — Registro de Clientes', 14, 15);
    doc.setFontSize(9);
    doc.setTextColor(107, 119, 150);
    doc.text(`Total: ${clientes.length} registros  |  Generado el ${new Date().toLocaleDateString('es-DO')}`, 14, 21);
    autoTable(doc, {
      startY: 26,
      head: [['Nombre', 'Personas', 'Hab.', 'Ingresos/mes', 'Trabaja en', 'Pago', 'Banco', 'Taxes', 'Mascotas', 'ID', 'No. Fiscal', 'Fecha']],
      body: clientes.map(c => [
        c.nombreCompleto,
        c.numPersonas,
        c.numHabitaciones,
        `$${Number(c.ingresosMensuales||0).toLocaleString()}`,
        c.lugarTrabajo || '—',
        c.cashOPrograma || '—',
        c.cuentaBanco || '—',
        c.presentoTaxes === 'Sí' ? `Sí ($${Number(c.montoTaxes||0).toLocaleString()})` : 'No',
        c.mascotas || '—',
        c.tipoIdentificacion || '—',
        c.tipoSocial || '—',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-DO') : '—',
      ]),
      styles: { fontSize: 7.5, cellPadding: 3 },
      headStyles: { fillColor: [79,110,247], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [247,249,255] },
      margin: { left: 14, right: 14 },
    });
    doc.save(`GENSY_Clientes_${new Date().toISOString().slice(0,10)}.pdf`);
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
        <div className="pg-actions">
          <button className="btn btn-green" onClick={exportExcel}>
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button className="btn btn-red" onClick={exportPDF}>
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ maxWidth: 360, border: '1.5px solid var(--card-border)' }}>
          <Search size={14} color="var(--t3)" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, trabajo o pago..." />
        </div>
        {search && (
          <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 12.5 }}
            onClick={() => setSearch('')}>Limpiar</button>
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
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Personas</th>
                  <th>Hab.</th>
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
                  <tr key={c.id || i} onClick={() => setSelected(c)}>
                    <td>
                      <div className="av-cell">
                        <div className="tbl-av" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                          {(c.nombreCompleto || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="cell-n">{c.nombreCompleto}</p>
                          <p className="cell-s">{c.lugarTrabajo || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td>{c.numPersonas}</td>
                    <td>{c.numHabitaciones}</td>
                    <td><strong style={{ color: '#4f6ef7' }}>${Number(c.ingresosMensuales||0).toLocaleString()}</strong></td>
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
                          className="icon-btn" style={{ width: 30, height: 30, borderRadius: 7 }}>
                          <Eye size={14} />
                        </button>
                        <button title="Eliminar"
                          onClick={() => handleDelete(c.id, c.nombreCompleto)}
                          className="icon-btn" style={{ width: 30, height: 30, borderRadius: 7, borderColor: '#fdedf4', color: '#e84f8c' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <ClienteModal cliente={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
