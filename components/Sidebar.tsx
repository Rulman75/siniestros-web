'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { getSessionUsername } from '@/app/actions';
import Image from 'next/image';
import logoImg from '../public/logo.png';

export default function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMantenedorOpen, setIsMantenedorOpen] = useState(pathname.startsWith('/admin'));
  const [username, setUsername] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <>
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src={logoImg} alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>Siniestros</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-title">
          <Image src={logoImg} alt="Logo CMDS" className="sidebar-logo" />
          <span className="sidebar-app-name">Sistema de Siniestros</span>
          {username && (
            <div className="sidebar-user-badge">
              <span className="status-dot"></span>
              {username}
            </div>
          )}
        </div>
        
        <div className="sidebar-links">
          {isAdmin && (
            <>
              <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Inicio
              </Link>
              <Link href="/import" className={`sidebar-link ${pathname === '/import' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Importar Data
              </Link>
            </>
          )}
          
          <Link href="/accidentabilidad" className={`sidebar-link ${pathname === '/accidentabilidad' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            Accidentabilidad
          </Link>
          
          {isAdmin && (
            <>
              <Link href="/resumen" className={`sidebar-link ${pathname === '/resumen' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                Resumen
              </Link>
              <Link href="/estadisticas" className={`sidebar-link ${pathname === '/estadisticas' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
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
                  <Link href="/admin" className={`sidebar-link ${pathname === '/admin' ? 'active' : ''}`} style={{ padding: '8px 12px' }} onClick={() => setIsMobileMenuOpen(false)}>
                    Usuarios
                  </Link>
                  <Link href="/admin/homologacion" className={`sidebar-link ${pathname === '/admin/homologacion' ? 'active' : ''}`} style={{ padding: '8px 12px' }} onClick={() => setIsMobileMenuOpen(false)}>
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
      {isMobileMenuOpen && <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </>
  );
}
