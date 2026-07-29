'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: `${data.message}. Se cargaron ${data.count} registros.`, type: 'success' });
        setFile(null);
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Error de red al intentar subir el archivo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar isAdmin={false} />
      <div className="main-content">
        <main className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '600px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem' }}>
              Importar Planilla Excel
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Selecciona el archivo Excel (.xlsx o .xls) con la estructura definida para cargar los registros. Se limpiará la base de datos anterior.
            </p>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                border: '2px dashed var(--border-color)',
                padding: '2rem',
                borderRadius: '12px',
                textAlign: 'center',
                backgroundColor: 'rgba(255,255,255,0.02)'
              }}>
                <input 
                  type="file" 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  style={{ display: 'block', width: '100%' }}
                  required
                />
              </div>

              {message.text && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)',
                  border: `1px solid ${message.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}`
                }}>
                  {message.text}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !file}
              >
                {loading ? 'Procesando archivo...' : 'Cargar Planilla'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
