'use client';

import { useState, useEffect } from 'react';
import * as xlsx from 'xlsx';

type Props = { isAdmin: boolean; userEstablecimientos?: string[]; isAccidentabilidad?: boolean };
type Siniestro = {
  id: number;
  numero: string;
  fechaPresentacion: string;
  tipoSiniestroIngreso: string;
  rutPaciente: string;
  nombrePaciente: string;
  establecimiento: string;
  estabBase?: string;
  sector?: string;
  numeroSiniestro: string;
  ctpStp: string;
  fechaSiniestro: string;
  fechaInicioReposo: string;
  fechaAltaOk: string;
  motivoAsistencia: string;
  tipoAlta: string;
  observaciones: string;
  dp: string;
};

const getMonthName = (m: string) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[parseInt(m, 10) - 1] || m;
};

export default function Dashboard({ isAdmin, userEstablecimientos, isAccidentabilidad }: Props) {
  const [data, setData] = useState<Siniestro[]>([]);
  const [dataAcumulada, setDataAcumulada] = useState<Siniestro[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [establecimientos, setEstablecimientos] = useState<string[]>([]);
  const [totalTrabajadores, setTotalTrabajadores] = useState(0);
  
  const [filters, setFilters] = useState({
    mes: '',
    anio: new Date().getFullYear().toString(),
    tipoSiniestro: '',
    establecimiento: ''
  });

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.mes) params.append('mes', filters.mes);
    if (filters.anio) params.append('anio', filters.anio);
    if (filters.tipoSiniestro) params.append('tipoSiniestro', filters.tipoSiniestro);
    if (filters.establecimiento) params.append('establecimiento', filters.establecimiento);

    const res = await fetch(`/api/siniestros?${params.toString()}`);
    const json = await res.json();
    setData(json);

    if (filters.mes && isAccidentabilidad) {
        const paramsAcum = new URLSearchParams(params.toString());
        paramsAcum.delete('mes');
        paramsAcum.append('mesAcumulado', filters.mes);
        const resAcum = await fetch(`/api/siniestros?${paramsAcum.toString()}`);
        const jsonAcum = await resAcum.json();
        setDataAcumulada(jsonAcum);
    } else {
        setDataAcumulada(json);
    }

    // Get total workers
    const resTrab = await fetch(`/api/trabajadores?${params.toString()}`);
    const jsonTrab = await resTrab.json();
    setTotalTrabajadores(jsonTrab.total || 0);

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

  const handleProcesar = async () => {
    if (!confirm('Esto actualizará el resumen con los datos actuales. ¿Continuar?')) return;
    setProcesando(true);
    const res = await fetch('/api/siniestros/procesar', { method: 'POST' });
    const json = await res.json();
    alert(json.message);
    setProcesando(false);
  };

  const exportExcel = () => {
    if (data.length === 0) return alert('No hay datos para exportar');
    const ws = xlsx.utils.json_to_sheet(data.map(s => {
      const row: any = {
        'N°': s.numero,
        'Fecha Presentación': s.fechaPresentacion,
        'Tipo Siniestro': s.tipoSiniestroIngreso,
        'CTP/STP': s.ctpStp,
        'RUT Paciente': s.rutPaciente,
        'Nombre Paciente': s.nombrePaciente,
      };
      if (!isAccidentabilidad) {
        row['Sector'] = s.sector;
        row['Estab. Base'] = s.estabBase;
      }
      row['Establecimiento Original'] = s.establecimiento;
      row['N° Siniestro'] = s.numeroSiniestro;
      row['Fecha Siniestro'] = s.fechaSiniestro;
      row['Fecha Inicio Reposo'] = s.fechaInicioReposo;
      row['Fecha Alta OK'] = s.fechaAltaOk;
      row['DP (Días)'] = s.dp;
      row['Motivo Asistencia'] = s.motivoAsistencia;
      row['Tipo Alta'] = s.tipoAlta;
      row['Observaciones'] = s.observaciones;
      return row;
    }));
    const wb = xlsx.utils.book_new();

    if (isAccidentabilidad && filters.mes) {
      const kpiData = [
        { 'Métrica': 'FRECUENCIA', 'Valor': Number(kpis.frecuencia.toFixed(2)) },
        { 'Métrica': 'GRAVEDAD', 'Valor': Number(kpis.gravedad.toFixed(2)) },
        { 'Métrica': 'ACCIDENTABILIDAD', 'Valor': Number(kpis.accidentabilidad.toFixed(2)) },
        { 'Métrica': 'SINIESTRALIDAD', 'Valor': Number(kpis.siniestralidad.toFixed(2)) },
        { 'Métrica': 'TRABAJADORES (Total)', 'Valor': totalTrabajadores }
      ];
      const wsKpi = xlsx.utils.json_to_sheet(kpiData);
      xlsx.utils.book_append_sheet(wb, wsKpi, "KPIs");
    }

    xlsx.utils.book_append_sheet(wb, ws, "Siniestros");
    xlsx.writeFile(wb, `Siniestros_${filters.mes ? getMonthName(filters.mes) : 'Todos'}_${filters.anio}.xlsx`);
  };

  const calcKPIs = (dataset: Siniestro[]) => {
    if (totalTrabajadores === 0) return { frecuencia: 0, gravedad: 0, accidentabilidad: 0, siniestralidad: 0 };
    
    let ctpCount = 0;
    let diasPerdidos = 0;
    let accTrabajoCount = 0;
    let accTrayectoCount = 0;

    dataset.forEach(s => {
      const dp = parseInt(s.dp, 10);
      const isDpValido = !isNaN(dp);
      
      if (s.ctpStp === 'CTP' && isDpValido && dp > 0) {
        ctpCount++;
      }
      
      if (isDpValido) {
        diasPerdidos += dp;
      }
      
      if (s.tipoSiniestroIngreso === 'Accidente de Trabajo') accTrabajoCount++;
      if (s.tipoSiniestroIngreso === 'Accidente de Trayecto') accTrayectoCount++;
    });

    return {
      frecuencia: (ctpCount * 100) / totalTrabajadores,
      gravedad: (diasPerdidos * 100) / totalTrabajadores,
      accidentabilidad: dataset.length / totalTrabajadores,
      siniestralidad: (accTrabajoCount + accTrayectoCount) / totalTrabajadores
    };
  };

  const kpis = calcKPIs(data);
  const kpisAcumulada = calcKPIs(dataAcumulada);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>
            {isAccidentabilidad ? 'Accidentabilidad' : 'Datos Cargados'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {isAccidentabilidad ? 'Registro detallado de accidentabilidad por establecimiento' : 'Visualiza e inspecciona la información importada'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={exportExcel} className="btn" style={{ background: 'var(--success-color)', color: 'white' }}>
            Descargar Excel
          </button>
          {isAdmin && !isAccidentabilidad && (
            <button onClick={handleProcesar} disabled={procesando} className="btn btn-primary">
              {procesando ? 'Procesando...' : 'Procesar data'}
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Mes</label>
          <select className="input-field" value={filters.mes} onChange={e => setFilters({...filters, mes: e.target.value})}>
            <option value="">Todos</option>
            {Array.from({length: 12}, (_, i) => {
              const m = (i + 1).toString().padStart(2, '0');
              return <option key={m} value={m}>{getMonthName(m)}</option>
            })}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Año</label>
          <input type="number" className="input-field" value={filters.anio} onChange={e => setFilters({...filters, anio: e.target.value})} style={{ width: '100px' }} />
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Tipo Siniestro</label>
          <select className="input-field" value={filters.tipoSiniestro} onChange={e => setFilters({...filters, tipoSiniestro: e.target.value})}>
            <option value="">Todos</option>
            <option value="Accidente de Trabajo">Accidente de Trabajo</option>
            <option value="Accidente de Trayecto">Accidente de Trayecto</option>
            <option value="Enfermedad Profesional">Enfermedad Profesional</option>
            <option value="Incidente sin lesión">Incidente sin lesión</option>
          </select>
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

      {isAccidentabilidad && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #016098' }}>
              <h4 style={{ color: '#016098', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{filters.mes ? 'FRECUENCIA MENSUAL' : 'FRECUENCIA'}</h4>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpis.frecuencia.toFixed(2)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #39BABD' }}>
              <h4 style={{ color: '#39BABD', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{filters.mes ? 'GRAVEDAD MENSUAL' : 'GRAVEDAD'}</h4>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpis.gravedad.toFixed(2)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #F7A517' }}>
              <h4 style={{ color: '#F7A517', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{filters.mes ? 'ACCIDENTABILIDAD MENSUAL' : 'ACCIDENTABILIDAD'}</h4>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpis.accidentabilidad.toFixed(2)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #EB567F' }}>
              <h4 style={{ color: '#EB567F', marginBottom: '0.5rem', fontSize: '0.875rem' }}>{filters.mes ? 'SINIESTRALIDAD MENSUAL' : 'SINIESTRALIDAD'}</h4>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpis.siniestralidad.toFixed(2)}</div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', background: '#016098', color: 'white', borderTop: '4px solid #014d7a' }}>
              <h4 style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>TRABAJADORES (Total)</h4>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{totalTrabajadores}</div>
            </div>
          </div>
          
          {filters.mes && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #016098' }}>
                <h4 style={{ color: '#016098', marginBottom: '0.5rem', fontSize: '0.875rem' }}>FRECUENCIA ACUMULADA</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpisAcumulada.frecuencia.toFixed(2)}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #39BABD' }}>
                <h4 style={{ color: '#39BABD', marginBottom: '0.5rem', fontSize: '0.875rem' }}>GRAVEDAD ACUMULADA</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpisAcumulada.gravedad.toFixed(2)}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #F7A517' }}>
                <h4 style={{ color: '#F7A517', marginBottom: '0.5rem', fontSize: '0.875rem' }}>ACCIDENTABILIDAD ACUMULADA</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpisAcumulada.accidentabilidad.toFixed(2)}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', borderTop: '4px solid #EB567F' }}>
                <h4 style={{ color: '#EB567F', marginBottom: '0.5rem', fontSize: '0.875rem' }}>SINIESTRALIDAD ACUMULADA</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1e293b' }}>{kpisAcumulada.siniestralidad.toFixed(2)}</div>
              </div>
              <div style={{ opacity: 0, pointerEvents: 'none', padding: '1.5rem' }}>
                 {/* Empty space to align with the 5-column grid above if needed, or simply let it flow */}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Cargando datos...</p>
      ) : data.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>No se encontraron registros</h3>
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: '2200px', whiteSpace: 'nowrap', width: '100%', fontSize: '0.9rem' }}>
            <thead>
              <tr>
                <th>N°</th>
                <th>Fecha Presentación</th>
                <th>Tipo Siniestro</th>
                <th>CTP/STP</th>
                <th>RUT Paciente</th>
                <th>Nombre Paciente</th>
                {!isAccidentabilidad && <th>Estab. Base</th>}
                {!isAccidentabilidad && <th>Sector</th>}
                <th>Establecimiento Original</th>
                <th>N° Siniestro</th>
                <th>Fecha Siniestro</th>
                <th>Fecha Inicio Reposo</th>
                <th>Fecha Alta OK</th>
                <th>DP (Días)</th>
                <th>Motivo Asistencia</th>
                <th>Tipo Alta</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td>{s.numero}</td>
                  <td>{s.fechaPresentacion}</td>
                  <td>{s.tipoSiniestroIngreso}</td>
                  <td>{s.ctpStp}</td>
                  <td>{s.rutPaciente}</td>
                  <td>{s.nombrePaciente}</td>
                  {!isAccidentabilidad && <td>{s.estabBase || '-'}</td>}
                  {!isAccidentabilidad && <td>{s.sector || '-'}</td>}
                  <td>{s.establecimiento}</td>
                  <td>{s.numeroSiniestro}</td>
                  <td>{s.fechaSiniestro}</td>
                  <td>{s.fechaInicioReposo}</td>
                  <td>{s.fechaAltaOk}</td>
                  <td>{s.dp}</td>
                  <td>{s.motivoAsistencia}</td>
                  <td>{s.tipoAlta}</td>
                  <td>{s.observaciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
