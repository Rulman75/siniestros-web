'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import * as xlsx from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';

type Siniestro = {
  fechaPresentacion: string;
  tipoSiniestroIngreso: string;
  dp: string;
  estabBase: string;
  establecimiento: string;
};

type Homologacion = {
  estabBase: string;
  establecimiento: string;
  cantidadTrabajadores: number;
  sector: string;
};

const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const chartConfigs = [
  { id: 'tacc', title: 'Indicadores Accidentabilidad (TACC)', dataKey: 'TACC', color: '#F7A517', name: 'Tasa de Accidentabilidad' },
  { id: 'acc', title: 'Número de Accidentes (ACC)', dataKey: 'ACC', color: '#39BABD', name: 'Cantidad Accidentes (CTP)' },
  { id: 'tsin', title: 'Indicadores Siniestralidad (TSIN)', dataKey: 'TSIN', color: '#EB567F', name: 'Tasa de Siniestralidad' },
  { id: 'dp', title: 'Días de Ausentismo (DP)', dataKey: 'DP', color: '#016098', name: 'Total Días Perdidos' },
];

export default function EstadisticasClient({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<{ siniestros: Siniestro[], homologacion: Homologacion[] }>({ siniestros: [], homologacion: [] });
  const [loading, setLoading] = useState(true);
  const [anio, setAnio] = useState(new Date().getFullYear().toString());
  const [activeTab, setActiveTab] = useState('Accidente de Trabajo');
  const [chartSector, setChartSector] = useState('Todos');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  const toggleRow = (estabBase: string) => {
    setExpandedRows(prev => ({ ...prev, [estabBase]: !prev[estabBase] }));
  };
  
  const tabs = ['Accidente de Trabajo', 'Enfermedad Profesional', 'Accidente de Trayecto'];

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/estadisticas?anio=${anio}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [anio]);

  const uniqueSectors = useMemo(() => {
    const s = new Set<string>();
    data.homologacion.forEach(h => s.add(h.sector));
    return Array.from(s).sort();
  }, [data.homologacion]);

  const groupedData = useMemo(() => {
    if (!data.homologacion) return [];
    const map = new Map();

    data.homologacion.forEach(h => {
      if (!map.has(h.estabBase)) {
        map.set(h.estabBase, {
          estabBase: h.estabBase,
          sector: h.sector,
          trabajadores: 0,
          meses: Array.from({ length: 12 }, () => ({ acc: 0, dp: 0 })),
          total: { acc: 0, dp: 0 },
          subRows: new Map()
        });
      }
      const estab = map.get(h.estabBase);
      estab.trabajadores += h.cantidadTrabajadores;
      estab.subRows.set(h.establecimiento, {
        establecimiento: h.establecimiento,
        trabajadores: h.cantidadTrabajadores,
        meses: Array.from({ length: 12 }, () => ({ acc: 0, dp: 0 })),
        total: { acc: 0, dp: 0 }
      });
    });

    const filtered = data.siniestros.filter(s => s.tipoSiniestroIngreso === activeTab);
    
    filtered.forEach(s => {
      const estab = map.get(s.estabBase);
      if (!estab) return;

      const sub = estab.subRows.get(s.establecimiento);

      const parts = s.fechaPresentacion.split('-');
      if (parts.length >= 2) {
        const mIdx = parseInt(parts[1], 10) - 1;
        if (mIdx >= 0 && mIdx <= 11) {
          estab.meses[mIdx].acc += 1;
          const dpVal = parseInt(s.dp, 10);
          if (!isNaN(dpVal) && dpVal > 0) {
            estab.meses[mIdx].dp += dpVal;
          }

          estab.total.acc += 1;
          if (!isNaN(dpVal) && dpVal > 0) {
            estab.total.dp += dpVal;
          }

          if (sub) {
            sub.meses[mIdx].acc += 1;
            if (!isNaN(dpVal) && dpVal > 0) {
              sub.meses[mIdx].dp += dpVal;
            }
            sub.total.acc += 1;
            if (!isNaN(dpVal) && dpVal > 0) {
              sub.total.dp += dpVal;
            }
          }
        }
      }
    });

    const result = Array.from(map.values()).map((estab: any) => {
      const calc = (acc: number, dp: number, trab: number) => {
        const tacc = trab > 0 ? (acc / trab) : 0;
        const tsin = trab > 0 ? (dp * 100 / trab) : 0;
        return { tacc: tacc.toFixed(2), tsin: tsin.toFixed(2) };
      };

      const mesesCalculados = estab.meses.map((m: any) => ({ ...m, ...calc(m.acc, m.dp, estab.trabajadores) }));
      const totalCalculado = { ...estab.total, ...calc(estab.total.acc, estab.total.dp, estab.trabajadores) };
      
      const subRowsList = Array.from(estab.subRows.values()).map((sub: any) => {
        const subMeses = sub.meses.map((m: any) => ({ ...m, ...calc(m.acc, m.dp, sub.trabajadores) }));
        const subTotal = { ...sub.total, ...calc(sub.total.acc, sub.total.dp, sub.trabajadores) };
        return { ...sub, meses: subMeses, total: subTotal };
      }).sort((a: any, b: any) => a.establecimiento.localeCompare(b.establecimiento));

      return { ...estab, meses: mesesCalculados, total: totalCalculado, subRows: subRowsList };
    });

    return result.sort((a, b) => {
      const sectorCompare = a.sector.localeCompare(b.sector);
      if (sectorCompare !== 0) return sectorCompare;
      return a.estabBase.localeCompare(b.estabBase);
    });
  }, [data, activeTab]);

  const exportExcel = () => {
    if (groupedData.length === 0) return alert('No hay datos para exportar');
    
    const rows: any[] = [];
    groupedData.forEach(d => {
      const row: any = {
        'UNIDADES': d.estabBase,
        'SECTOR': d.sector,
        'N TRAB': d.trabajadores
      };
      
      d.meses.forEach((m: any, idx: number) => {
        const prefix = meses[idx];
        row[`${prefix} ACC`] = m.acc;
        row[`${prefix} DP`] = m.dp;
        row[`${prefix} TACC`] = Number(m.tacc);
        row[`${prefix} TSIN`] = Number(m.tsin);
      });

      row['TOTAL ACC'] = d.total.acc;
      row['TOTAL DP'] = d.total.dp;
      row['TOTAL TACC'] = Number(d.total.tacc);
      row['TOTAL TSIN'] = Number(d.total.tsin);

      rows.push(row);

      if (d.subRows && d.subRows.length > 1) {
        d.subRows.forEach((sub: any) => {
          const subRow: any = {
            'UNIDADES': `  ↳ ${sub.establecimiento}`,
            'SECTOR': '',
            'N TRAB': sub.trabajadores
          };
          sub.meses.forEach((m: any, idx: number) => {
            const prefix = meses[idx];
            subRow[`${prefix} ACC`] = m.acc;
            subRow[`${prefix} DP`] = m.dp;
            subRow[`${prefix} TACC`] = Number(m.tacc);
            subRow[`${prefix} TSIN`] = Number(m.tsin);
          });
          subRow['TOTAL ACC'] = sub.total.acc;
          subRow['TOTAL DP'] = sub.total.dp;
          subRow['TOTAL TACC'] = Number(sub.total.tacc);
          subRow['TOTAL TSIN'] = Number(sub.total.tsin);
          rows.push(subRow);
        });
      }
    });

    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, activeTab.substring(0, 31)); 
    xlsx.writeFile(wb, `Estadisticas_${activeTab}_${anio}.xlsx`);
  };

  const chartData = useMemo(() => {
    let f = groupedData;
    if (chartSector !== 'Todos') {
      f = f.filter(d => d.sector === chartSector);
    }
    return f.map(d => ({
      name: d.estabBase,
      TACC: Number(d.total.tacc),
      TSIN: Number(d.total.tsin),
      ACC: d.total.acc,
      DP: d.total.dp
    }));
  }, [groupedData, chartSector]);

  const downloadChart = async (chartId: string) => {
    const element = document.getElementById(`expanded-chart-container-${chartId}`);
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
      const dataURL = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `grafico_${chartId}_${activeTab}_${anio}.png`;
      a.click();
    } catch (e) {
      console.error('Error downloading chart', e);
      alert('Error al generar la imagen');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0 }}>Estadísticas Anuales</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Año a Consultar</label>
            <input type="number" className="input-field" value={anio} onChange={e => setAnio(e.target.value)} style={{ width: '120px' }} />
          </div>
          <button onClick={exportExcel} className="btn btn-primary">Exportar Tabla a Excel</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: activeTab === tab ? 'none' : '1px solid var(--border-color)',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              background: activeTab === tab ? 'var(--primary-color)' : 'white',
              color: activeTab === tab ? 'white' : 'var(--text-primary)',
              boxShadow: activeTab === tab ? '0 4px 10px rgba(1,96,152,0.3)' : 'none'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando matriz anual...</div>
      ) : (
        <>
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: '#f8fafc' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Filtro de Gráficos</h3>
             <select className="input-field" value={chartSector} onChange={e => setChartSector(e.target.value)} style={{ maxWidth: '300px' }}>
                <option value="Todos">Todos los Sectores</option>
                {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '2rem', marginBottom: '3rem' }}>
            {chartConfigs.map(config => (
              <div 
                key={config.id} 
                className="glass-panel" 
                style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative', transition: 'transform 0.2s' }}
                onClick={() => setExpandedChart(config.id)}
                title="Click para ampliar y descargar"
              >
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.5 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                </div>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', paddingRight: '2rem' }}>
                  {config.title} {chartSector !== 'Todos' ? `- ${chartSector}` : ''}
                </h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ bottom: 120, right: 10, left: 10, top: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey={config.dataKey} fill={config.color} name={config.name} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>Matriz de Datos: {activeTab}</h3>
            <table style={{ borderCollapse: 'collapse', minWidth: '3500px', fontSize: '0.8rem', textAlign: 'center' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ background: '#f8fafc', position: 'sticky', left: 0, zIndex: 2, minWidth: '150px', borderBottom: '2px solid #cbd5e1' }}>Sector</th>
                  <th rowSpan={2} style={{ background: '#f8fafc', position: 'sticky', left: '150px', zIndex: 2, minWidth: '80px', borderRight: '2px solid #cbd5e1', borderBottom: '2px solid #cbd5e1' }}>Unidad</th>
                  <th rowSpan={2} style={{ background: '#f8fafc', borderRight: '2px solid #cbd5e1', minWidth: '80px', borderBottom: '2px solid #cbd5e1' }}>N° Trab</th>
                  
                  {meses.map(m => (
                    <th key={m} colSpan={4} style={{ borderRight: '1px solid #cbd5e1', borderBottom: '1px solid white', background: 'var(--primary-color)', color: 'white', padding: '8px' }}>{m}</th>
                  ))}
                  <th colSpan={4} style={{ background: '#0f172a', color: 'white', padding: '8px', borderBottom: '1px solid white' }}>TOTAL AÑO</th>
                </tr>
                <tr>
                  {meses.map(m => (
                    <Fragment key={`sub-${m}`}>
                      <th style={{ minWidth: '55px', padding: '6px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>ACC</th>
                      <th style={{ minWidth: '55px', padding: '6px', background: '#fef08a', color: '#854d0e', fontWeight: 600 }}>DP</th>
                      <th style={{ minWidth: '55px', padding: '6px', background: '#fce7f3', color: '#be185d', fontWeight: 600 }}>TACC</th>
                      <th style={{ minWidth: '55px', padding: '6px', background: '#dcfce7', color: '#166534', fontWeight: 600, borderRight: '1px solid #cbd5e1' }}>TSIN</th>
                    </Fragment>
                  ))}
                  <th style={{ minWidth: '60px', padding: '6px', background: '#1e293b', color: 'white', fontWeight: 600 }}>ACC</th>
                  <th style={{ minWidth: '60px', padding: '6px', background: '#334155', color: 'white', fontWeight: 600 }}>DP</th>
                  <th style={{ minWidth: '60px', padding: '6px', background: '#475569', color: 'white', fontWeight: 600 }}>TACC</th>
                  <th style={{ minWidth: '60px', padding: '6px', background: '#64748b', color: 'white', fontWeight: 600 }}>TSIN</th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map(d => (
                  <Fragment key={d.estabBase}>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: expandedRows[d.estabBase] ? '#f8fafc' : 'white' }}>
                      <td style={{ background: 'inherit', position: 'sticky', left: 0, zIndex: 1, padding: '10px 4px' }}>{d.sector}</td>
                      <td style={{ background: 'inherit', position: 'sticky', left: '150px', zIndex: 1, borderRight: '2px solid #cbd5e1', fontWeight: 'bold', padding: '10px 4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                          {d.subRows && d.subRows.length > 1 && (
                            <button onClick={() => toggleRow(d.estabBase)} style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem', color: 'white', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {expandedRows[d.estabBase] ? '−' : '+'}
                            </button>
                          )}
                          {d.estabBase}
                        </div>
                      </td>
                      <td style={{ borderRight: '2px solid #cbd5e1', fontWeight: 'bold', padding: '10px 4px' }}>{d.trabajadores}</td>
                      
                      {d.meses.map((m: any, idx: number) => (
                        <Fragment key={idx}>
                          <td style={{ padding: '10px 4px' }}>{m.acc}</td>
                          <td style={{ padding: '10px 4px' }}>{m.dp}</td>
                          <td style={{ padding: '10px 4px' }}>{m.tacc}</td>
                          <td style={{ padding: '10px 4px', borderRight: '1px solid #cbd5e1' }}>{m.tsin}</td>
                        </Fragment>
                      ))}

                      <td style={{ padding: '10px 4px', background: '#f8fafc', fontWeight: 'bold', color: '#0369a1' }}>{d.total.acc}</td>
                      <td style={{ padding: '10px 4px', background: '#f8fafc', fontWeight: 'bold', color: '#854d0e' }}>{d.total.dp}</td>
                      <td style={{ padding: '10px 4px', background: '#f8fafc', fontWeight: 'bold', color: '#be185d' }}>{d.total.tacc}</td>
                      <td style={{ padding: '10px 4px', background: '#f8fafc', fontWeight: 'bold', color: '#166534' }}>{d.total.tsin}</td>
                    </tr>
                    
                    {expandedRows[d.estabBase] && d.subRows && d.subRows.length > 1 && d.subRows.map((sub: any) => (
                      <tr key={sub.establecimiento} style={{ borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', fontSize: '0.75rem' }}>
                        <td style={{ background: 'inherit', position: 'sticky', left: 0, zIndex: 1, padding: '8px 4px', color: '#64748b' }}></td>
                        <td style={{ background: 'inherit', position: 'sticky', left: '150px', zIndex: 1, borderRight: '2px solid #cbd5e1', padding: '8px 4px', color: '#334155', textAlign: 'left', paddingLeft: '1.5rem' }}>
                          ↳ {sub.establecimiento}
                        </td>
                        <td style={{ borderRight: '2px solid #cbd5e1', padding: '8px 4px', color: '#334155' }}>{sub.trabajadores}</td>
                        
                        {sub.meses.map((m: any, idx: number) => (
                          <Fragment key={`sub-${idx}`}>
                            <td style={{ padding: '8px 4px', color: '#475569' }}>{m.acc}</td>
                            <td style={{ padding: '8px 4px', color: '#475569' }}>{m.dp}</td>
                            <td style={{ padding: '8px 4px', color: '#475569' }}>{m.tacc}</td>
                            <td style={{ padding: '8px 4px', borderRight: '1px solid #cbd5e1', color: '#475569' }}>{m.tsin}</td>
                          </Fragment>
                        ))}

                        <td style={{ padding: '8px 4px', background: '#e2e8f0', color: '#0369a1' }}>{sub.total.acc}</td>
                        <td style={{ padding: '8px 4px', background: '#e2e8f0', color: '#854d0e' }}>{sub.total.dp}</td>
                        <td style={{ padding: '8px 4px', background: '#e2e8f0', color: '#be185d' }}>{sub.total.tacc}</td>
                        <td style={{ padding: '8px 4px', background: '#e2e8f0', color: '#166534' }}>{sub.total.tsin}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODAL PARA GRÁFICO EXPANDIDO */}
      {expandedChart && (() => {
        const config = chartConfigs.find(c => c.id === expandedChart)!;
        return (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
          }}>
            <div style={{ background: 'white', borderRadius: '12px', width: '100%', maxWidth: '1300px', padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <h2 style={{ color: 'var(--primary-color)', margin: 0, fontSize: '1.5rem' }}>
                   Vista Ampliada y Descarga
                 </h2>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                   <button onClick={() => downloadChart(config.id)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                     Descargar PNG
                   </button>
                   <button onClick={() => setExpandedChart(null)} className="btn" style={{ background: '#e2e8f0', color: '#1e293b' }}>Cerrar</button>
                 </div>
              </div>

              {/* El contenedor que se fotografiará con html2canvas */}
              <div id={`expanded-chart-container-${config.id}`} style={{ padding: '2rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h2 style={{ textAlign: 'center', color: '#334155', marginBottom: '2rem', marginTop: 0 }}>
                  {config.title} {chartSector !== 'Todos' ? `- ${chartSector}` : ''} ({anio})
                </h2>
                <div style={{ height: '550px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 30, right: 30, left: 20, bottom: 120 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 13 }} interval={0} angle={-45} textAnchor="end" />
                      <YAxis tick={{ fontSize: 14 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }} />
                      <Bar dataKey={config.dataKey} fill={config.color} name={config.name} radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#64748b', fontSize: 12 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
