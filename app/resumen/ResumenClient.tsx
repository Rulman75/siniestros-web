'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import * as xlsx from 'xlsx';

type Resumen = {
  id: number;
  estabBase: string;
  mes: string;
  anio: string;
  tipoSiniestro: string;
  cantidadSiniestros: number;
  sumaDiasReposo: number;
};

const getMonthName = (m: string) => {
  if (m === 'Todos') return m;
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[parseInt(m, 10) - 1] || m;
};

export default function ResumenClient({ isAdmin, userEstablecimientos }: { isAdmin: boolean, userEstablecimientos?: string[] }) {
  const [data, setData] = useState<Resumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [establecimientos, setEstablecimientos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Todos');
  
  const [filters, setFilters] = useState({
    anio: new Date().getFullYear().toString(),
    establecimiento: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.anio) params.append('anio', filters.anio);
    if (filters.establecimiento) params.append('establecimiento', filters.establecimiento);

    const res = await fetch(`/api/siniestros/resumen?${params.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const fetchEst = async () => {
    const res = await fetch('/api/establecimientos');
    const json = await res.json();
    setEstablecimientos(json);
  };

  useEffect(() => {
    fetchEst();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filters]);

  // Tab Filtering & Sorting logic
  const filteredData = useMemo(() => {
    let filtered = data;
    if (activeTab !== 'Todos') {
      filtered = data.filter(d => d.tipoSiniestro === activeTab);
    }
    // Sort by month ascending (01, 02, etc.)
    return [...filtered].sort((a, b) => {
      const mA = parseInt(a.mes, 10);
      const mB = parseInt(b.mes, 10);
      return mA - mB;
    });
  }, [data, activeTab]);

  const anualizada = useMemo(() => {
    const map = new Map<string, Resumen>();
    filteredData.forEach(item => {
      const key = `${item.estabBase}|${item.anio}|${item.tipoSiniestro}`;
      if (!map.has(key)) {
        map.set(key, { ...item, mes: 'Todos', id: Math.random() });
      } else {
        const curr = map.get(key)!;
        curr.cantidadSiniestros += item.cantidadSiniestros;
        curr.sumaDiasReposo += item.sumaDiasReposo;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.estabBase.localeCompare(b.estabBase));
  }, [filteredData]);

  const exportExcel = (exportData: Resumen[], fileName: string) => {
    if (exportData.length === 0) return alert('No hay datos para exportar');
    const ws = xlsx.utils.json_to_sheet(exportData.map(d => ({
      Establecimiento: d.estabBase,
      Año: d.anio,
      Mes: getMonthName(d.mes),
      'Tipo Siniestro': d.tipoSiniestro,
      'Cantidad Siniestros': d.cantidadSiniestros,
      'Suma Días Reposo': d.sumaDiasReposo
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Resumen");
    xlsx.writeFile(wb, `${fileName}.xlsx`);
  };

  const tabs = ['Todos', 'Accidente de Trabajo', 'Accidente de Trayecto', 'Enfermedad Profesional', 'Incidente sin lesión'];

  const totalMensual = filteredData.reduce((acc, curr) => ({
    cantidad: acc.cantidad + curr.cantidadSiniestros,
    dias: acc.dias + curr.sumaDiasReposo
  }), { cantidad: 0, dias: 0 });

  const totalAnual = anualizada.reduce((acc, curr) => ({
    cantidad: acc.cantidad + curr.cantidadSiniestros,
    dias: acc.dias + curr.sumaDiasReposo
  }), { cantidad: 0, dias: 0 });

  return (
    <div className="app-layout">
        <Sidebar isAdmin={isAdmin} />
        <div className="main-content">
          <main className="container animate-fade-in" style={{ maxWidth: '100%', padding: '2rem 3rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Resumen de Siniestros</h1>
        
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Año</label>
            <input type="number" className="input-field" value={filters.anio} onChange={e => setFilters({...filters, anio: e.target.value})} style={{ width: '100px' }} />
          </div>
          
          {!isAdmin && userEstablecimientos && userEstablecimientos.length > 1 && (
            <div>
              <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Mis Establecimientos</label>
              <select className="input-field" value={filters.establecimiento} onChange={e => setFilters({...filters, establecimiento: e.target.value})}>
                <option value="">Todos mis establecimientos</option>
                {userEstablecimientos.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}

          {isAdmin && (
            <div>
              <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Establecimiento</label>
              <select className="input-field" value={filters.establecimiento} onChange={e => setFilters({...filters, establecimiento: e.target.value})}>
                <option value="">Todos</option>
                {establecimientos.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Tab Bar / Botonera */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '99px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 500,
                transition: 'all 0.2s',
                background: activeTab === tab ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                color: activeTab === tab ? 'white' : 'inherit'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%' }}>
          {/* Mensual */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Agrupación Mensual {activeTab !== 'Todos' ? `(${activeTab})` : ''}</h3>
              <button onClick={() => exportExcel(filteredData, `Resumen_Mensual_${activeTab}_${filters.anio}`)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Exportar</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid var(--primary-color)', background: 'var(--bg-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Siniestros</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{totalMensual.cantidad}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid var(--secondary-color)', background: 'var(--bg-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Días Perdidos</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>{totalMensual.dias}</div>
              </div>
            </div>

            {loading ? <p>Cargando...</p> : (
              <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ minWidth: '1000px', whiteSpace: 'nowrap', width: '100%', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Mes</th>
                      <th>Establecimiento</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Días (Sum)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(d => (
                      <tr key={d.id}>
                        <td>{getMonthName(d.mes)}</td>
                        <td>{d.estabBase}</td>
                        <td>{d.tipoSiniestro}</td>
                        <td>{d.cantidadSiniestros}</td>
                        <td>{d.sumaDiasReposo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Anualizada */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Agrupación Anualizada {activeTab !== 'Todos' ? `(${activeTab})` : ''}</h3>
              <button onClick={() => exportExcel(anualizada, `Resumen_Anual_${activeTab}_${filters.anio}`)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Exportar</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid var(--primary-color)', background: 'var(--bg-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Siniestros</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{totalAnual.cantidad}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', textAlign: 'center', borderTop: '4px solid var(--secondary-color)', background: 'var(--bg-color)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Días Perdidos</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>{totalAnual.dias}</div>
              </div>
            </div>

            {loading ? <p>Cargando...</p> : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Establecimiento</th>
                      <th>Año</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Días (Sum)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anualizada.map(d => (
                      <tr key={d.id}>
                        <td>{d.estabBase}</td>
                        <td>{d.anio}</td>
                        <td>{d.tipoSiniestro}</td>
                        <td>{d.cantidadSiniestros}</td>
                        <td>{d.sumaDiasReposo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
