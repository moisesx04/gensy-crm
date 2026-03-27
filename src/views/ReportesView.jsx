import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, FileText, Download, Users, Home, Search, TrendingUp, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { subscribeClientes, subscribeTo, getProperties } from '../lib/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from '../context/LanguageContext';

export default function ReportesView() {
  const { t, language } = useLanguage();
  const [clientes, setClientes] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clientes');

  useEffect(() => {
    const unsubC = subscribeClientes(data => {
      setClientes(data);
      setLoading(false);
    });
    const unsubP = subscribeTo(getProperties, p => {
      setPropiedades(p);
    }, 20000);
    return () => { unsubC(); unsubP(); };
  }, []);

  const kpiData = useMemo(() => {
    const totalClientes = clientes.length;
    const totalPropiedades = propiedades.length;
    const propsRentadas = propiedades.filter(p => p.status === 'Rentada');
    const totalIngresosEsperados = propsRentadas.reduce((sum, p) => {
      const sal = Number(p.financiero?.salePrice) || 0;
      return sum + sal;
    }, 0);
    const ingresosClientes = clientes.reduce((sum, c) => sum + (Number(c.ingresosMensuales) || 0), 0);

    return { totalClientes, totalPropiedades, propsRentadas: propsRentadas.length, totalIngresosEsperados, ingresosClientes };
  }, [clientes, propiedades]);

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Clientes Sheet
    const clientRows = clientes.map(c => ({
      'ID': c.id,
      'Nombre Completo': c.nombreCompleto,
      'Teléfono': c.telefono || '—',
      'Dirección': c.direccion || '—',
      'Ingresos Mensuales': c.ingresosMensuales || 0,
      'Pago (Cash/Prog)': t('val_' + c.cashOPrograma, { defaultValue: c.cashOPrograma }),
      'Cuenta Banco': c.cuentaBanco,
      'Presentó Taxes': c.presentoTaxes,
      'Fecha Registro': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'
    }));
    const wsClientes = XLSX.utils.json_to_sheet(clientRows);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Clientes');

    // Propiedades Sheet
    const propRows = propiedades.map(p => ({
      'ID': p.id,
      'Título': p.title,
      'Ubicación': p.location || '—',
      'Precio Lista': p.price,
      'Hab/Baños': `${p.beds} / ${p.baths}`,
      'Tipo': p.tag,
      'Estado': p.status,
      'Cliente Asignado': p.cliente_nombre || '—',
      'Precio Venta Real': p.financiero?.salePrice || '—',
      'Costo Base': p.financiero?.costPrice || '—',
      'Ganancia Neta': (Number(p.financiero?.salePrice) || 0) - (Number(p.financiero?.costPrice) || 0) - (p.financiero?.commissions?.reduce((s,c)=>s+(Number(c.amount)||0), 0) || 0)
    }));
    const wsPropiedades = XLSX.utils.json_to_sheet(propRows);
    XLSX.utils.book_append_sheet(wb, wsPropiedades, 'Propiedades');

    XLSX.writeFile(wb, `Reporte_Consolidado_Gensy_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    
    // Title
    doc.setFontSize(18); doc.setTextColor(15, 23, 42);
    doc.text('Reporte General Consolidado', 14, 15);
    
    doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text(`Generado: ${new Date().toLocaleDateString()} - Clientes: ${clientes.length} | Propiedades: ${propiedades.length}`, 14, 21);

    // Clientes Table
    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Reporte de Clientes', 14, 30);
    
    autoTable(doc, {
      startY: 35,
      head: [['ID', 'Nombre', 'Teléfono', 'Ingresos', 'Pago', 'Banco', 'Registro']],
      body: clientes.map(c => [
        c.id.slice(0,6), c.nombreCompleto, c.telefono || '—', 
        `$${Number(c.ingresosMensuales||0).toLocaleString()}`, 
        t('val_' + c.cashOPrograma, { defaultValue: c.cashOPrograma }) || '—',
        c.cuentaBanco || '—',
        c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—',
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Propiedades Table (on new page if needed, autoTable handles pagination, but we can just use finalY)
    doc.addPage();
    doc.setFontSize(14); doc.setTextColor(15, 23, 42);
    doc.text('Reporte de Propiedades', 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['ID', 'Propiedad', 'Precio Lista', 'Hab/Baños', 'Tipo', 'Estado', 'Cliente Asignado', 'Ganancia Neta']],
      body: propiedades.map(p => {
        const ganancia = (Number(p.financiero?.salePrice) || 0) - (Number(p.financiero?.costPrice) || 0) - (p.financiero?.commissions?.reduce((s,c)=>s+(Number(c.amount)||0), 0) || 0);
        return [
          p.id.slice(0,6), p.title, p.price || '—', `${p.beds}/${p.baths}`, p.tag, p.status || 'Disponible',
          p.cliente_nombre || '—', `$${ganancia.toLocaleString()}`
        ];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Reporte_Consolidado_Gensy_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--t3)' }}>Cargando datos del reporte...</div>;

  return (
    <div className="page" style={{ animation: 'pageIn .4s ease-out' }}>
      <div className="pg-head">
        <div>
          <h1>Reportes y Analíticas</h1>
          <p>Visualiza y descarga toda la inteligencia de negocio cruzada.</p>
        </div>
        <div className="pg-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" style={{ background: '#10b981', boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.3)' }} onClick={exportExcel}>
            <FileSpreadsheet size={15} /> Exportar Excel Completo
          </button>
          <button className="btn btn-primary" style={{ background: '#ef4444', boxShadow: '0 8px 16px -4px rgba(239, 68, 68, 0.3)' }} onClick={exportPDF}>
            <FileText size={15} /> Generar PDF Consolidado
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Total Clientes</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)' }}>{kpiData.totalClientes}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Propiedades / Rentadas</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)' }}>{kpiData.totalPropiedades} <span style={{ fontSize: 16, color: 'var(--t3)' }}>/ {kpiData.propsRentadas}</span></div>
          </div>
        </div>

        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Ventas Cerradas (Valor)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)' }}>${kpiData.totalIngresosEsperados.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Ingresos Mens. Clientes</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--t1)' }}>${kpiData.ingresosClientes.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', background: '#f8fafc' }}>
          <button 
            style={{ flex: 1, padding: 16, border: 'none', background: activeTab === 'clientes' ? '#fff' : 'transparent', fontWeight: 800, color: activeTab === 'clientes' ? 'var(--accent)' : 'var(--t3)', cursor: 'pointer', borderBottom: activeTab === 'clientes' ? '2px solid var(--accent)' : '2px solid transparent' }}
            onClick={() => setActiveTab('clientes')}
          >
            📋 Base de Datos de Clientes
          </button>
          <button 
            style={{ flex: 1, padding: 16, border: 'none', background: activeTab === 'propiedades' ? '#fff' : 'transparent', fontWeight: 800, color: activeTab === 'propiedades' ? 'var(--accent)' : 'var(--t3)', cursor: 'pointer', borderBottom: activeTab === 'propiedades' ? '2px solid var(--accent)' : '2px solid transparent' }}
            onClick={() => setActiveTab('propiedades')}
          >
            🏠 Base de Datos de Inmuebles
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {activeTab === 'clientes' ? (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Ingresos</th>
                    <th>Método Pago</th>
                    <th>Banco</th>
                    <th>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.nombreCompleto}</td>
                      <td>{c.telefono || '—'}</td>
                      <td>${Number(c.ingresosMensuales||0).toLocaleString()}</td>
                      <td>{t('val_' + c.cashOPrograma, { defaultValue: c.cashOPrograma })}</td>
                      <td>{c.cuentaBanco}</td>
                      <td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                  {clientes.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Sin clientes registrados</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Propiedad</th>
                    <th>Estado</th>
                    <th>Precio Lista</th>
                    <th>Venta Final</th>
                    <th>Costo Base</th>
                    <th>Ganancia Neta</th>
                    <th>Cliente Asignado</th>
                  </tr>
                </thead>
                <tbody>
                  {propiedades.map(p => {
                    const venta = Number(p.financiero?.salePrice) || 0;
                    const costo = Number(p.financiero?.costPrice) || 0;
                    const coms = p.financiero?.commissions?.reduce((s,c)=>s+(Number(c.amount)||0), 0) || 0;
                    const ganancia = venta - costo - coms;
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.title}</td>
                        <td><span className={`badge ${p.status === 'Rentada' ? 'bg-green' : 'bg-blue'}`}>{p.status || 'Disponible'}</span></td>
                        <td>{p.price || '—'}</td>
                        <td style={{ color: p.financiero?.salePrice ? 'var(--t1)' : 'var(--t3)' }}>{p.financiero?.salePrice ? `$${venta.toLocaleString()}` : '—'}</td>
                        <td>{p.financiero?.costPrice ? `$${costo.toLocaleString()}` : '—'}</td>
                        <td style={{ fontWeight: 800, color: ganancia > 0 ? '#10b981' : (ganancia < 0 ? '#ef4444' : 'var(--t3)') }}>
                          {ganancia !== 0 ? `$${ganancia.toLocaleString()}` : '—'}
                        </td>
                        <td>{p.cliente_nombre || '—'}</td>
                      </tr>
                    );
                  })}
                  {propiedades.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}>Sin propiedades registradas</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
