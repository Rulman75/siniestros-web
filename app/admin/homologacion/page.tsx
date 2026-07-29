'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

type Homologacion = { 
  id: number; 
  establecimiento: string; 
  estabBase: string; 
  sector: string; 
  cantidadTrabajadores: number 
};

export default function HomologacionPage() {
  const [data, setData] = useState<Homologacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({ 
    id: 0,
    establecimiento: '', 
    estabBase: '', 
    sector: '', 
    cantidadTrabajadores: 0
  });
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    const res = await fetch('/api/admin/homologacion');
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/admin/homologacion/import', { method: 'POST', body: form });
    const resData = await res.json();
    setMessage(resData.message);
    setUploading(false);
    if (res.ok) {
      setFile(null);
      fetchData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = isEditing ? 'update' : 'create';
    const res = await fetch('/api/admin/homologacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, action })
    });
    const resData = await res.json();
    setMessage(resData.message);
    if (res.ok) {
      setFormData({ id: 0, establecimiento: '', estabBase: '', sector: '', cantidadTrabajadores: 0 });
      setIsEditing(false);
      fetchData();
    }
  };

  const handleEdit = (h: Homologacion) => {
    setFormData(h);
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    const res = await fetch('/api/admin/homologacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'delete' })
    });
    const resData = await res.json();
    setMessage(resData.message);
    if (res.ok) fetchData();
  };

  return (
    <div className="app-layout">
      <Sidebar isAdmin={true} />
      
      <div className="main-content">
        <main className="container animate-fade-in">
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Mantenedor de Homologación</h1>
        
        {message && (
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--primary-color)', borderRadius: '8px', marginBottom: '2rem' }}>
            {message}
          </div>
        )}

        {/* Upload Excel */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Carga Masiva desde Excel</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Selecciona un archivo con columnas SECTOR, ESTAB_BASE, ESTABLECIMIENTO y CANT_TRAB para reemplazar la tabla completa.</p>
          </div>
          <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="input-field" style={{ width: 'auto' }} />
          <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-primary">
            {uploading ? 'Cargando...' : 'Importar Excel'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Create/Edit Form */}
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Editar Registro' : 'Nuevo Registro'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Establecimiento (Nombre Original)</label>
                <input required type="text" className="input-field" value={formData.establecimiento} onChange={e => setFormData({...formData, establecimiento: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Establecimiento Base (Agrupación)</label>
                <input required type="text" className="input-field" value={formData.estabBase} onChange={e => setFormData({...formData, estabBase: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Sector</label>
                <input required type="text" className="input-field" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Cantidad de Trabajadores</label>
                <input required type="number" className="input-field" value={formData.cantidadTrabajadores} onChange={e => setFormData({...formData, cantidadTrabajadores: parseInt(e.target.value, 10)})} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Actualizar' : 'Crear'}</button>
                {isEditing && (
                  <button type="button" className="btn" onClick={() => {setIsEditing(false); setFormData({id: 0, establecimiento: '', estabBase: '', sector: '', cantidadTrabajadores: 0})}}>Cancelar</button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Diccionario Actual</h3>
            {loading ? <p>Cargando...</p> : (
              <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bg-secondary)' }}>
                    <tr>
                      <th>Establecimiento Original</th>
                      <th>Estab. Base</th>
                      <th>Sector</th>
                      <th>Trabajadores</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(h => (
                      <tr key={h.id}>
                        <td style={{ fontSize: '0.875rem' }}>{h.establecimiento}</td>
                        <td style={{ fontSize: '0.875rem' }}>{h.estabBase}</td>
                        <td style={{ fontSize: '0.875rem' }}>{h.sector}</td>
                        <td>{h.cantidadTrabajadores}</td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEdit(h)} className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)' }}>Edit</button>
                          <button onClick={() => handleDelete(h.id)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Del</button>
                        </td>
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
