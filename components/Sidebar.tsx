'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSessionUsername } from '@/app/actions';

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMantenedorOpen, setIsMantenedorOpen] = useState(pathname.startsWith('/admin'));
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    getSessionUsername().then(u => setUsername(u));
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setIsMantenedorOpen(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <img src="/logo.png" alt="Logo CMDS" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', marginBottom: '0.5rem' }} />
        <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600 }}>Sistema de Siniestros</span>
        {username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--primary-color)', background: '#e0f2fe', padding: '4px 12px', borderRadius: '12px', marginTop: '0.25rem' }}>
            <span style={{ width: '6px', height: '6px', background: 'var(--success-color)', borderRadius: '50%' }}></span>
            {username}
          </div>
        )}
      </div>
      
      <div className="sidebar-links">
        {isAdmin && (
          <>
            <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}>
              Inicio
            </Link>
            <Link href="/import" className={`sidebar-link ${pathname === '/import' ? 'active' : ''}`}>
              Importar Data
            </Link>
          </>
        )}
        
        <Link href="/accidentabilidad" className={`sidebar-link ${pathname === '/accidentabilidad' ? 'active' : ''}`}>
          Accidentabilidad
        </Link>
        
        {isAdmin && (
          <>
            <Link href="/resumen" className={`sidebar-link ${pathname === '/resumen' ? 'active' : ''}`}>
              Resumen
            </Link>
            <Link href="/estadisticas" className={`sidebar-link ${pathname === '/estadisticas' ? 'active' : ''}`}>
              Estadísticas
            </Link>
          </>
        )}
        
        {isAdmin && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => setIsMantenedorOpen(!isMantenedorOpen)}
              className="sidebar-link"
              style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', fontSize: '1rem', cursor: 'pointer' }}
            >
              Mantenedor
              <span style={{ transform: isMantenedorOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.6rem' }}>▼</span>
            </button>
            
            {isMantenedorOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--border-color)', marginLeft: '1rem' }}>
                <Link href="/admin" className={`sidebar-link ${pathname === '/admin' ? 'active' : ''}`} style={{ padding: '8px 12px' }}>
                  Usuarios
                </Link>
                <Link href="/admin/homologacion" className={`sidebar-link ${pathname === '/admin/homologacion' ? 'active' : ''}`} style={{ padding: '8px 12px' }}>
                  Establecimientos
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
        <button onClick={handleLogout} className="btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)' }}>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
