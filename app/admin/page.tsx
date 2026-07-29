'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

type User = { id: number; username: string; role: string; establecimientos: string | null; createdAt: string };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [establecimientosList, setEstablecimientosList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newUser, setNewUser] = useState({ 
    username: '', 
    password: '', 
    role: 'USER', 
    establecimientos: [] as string[]
  });
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  const fetchEstablecimientos = async () => {
    const res = await fetch('/api/establecimientos');
    const data = await res.json();
    setEstablecimientosList(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchEstablecimientos();
  }, []);

  const handleCheckbox = (est: string) => {
    const current = newUser.establecimientos;
    if (current.includes(est)) {
      setNewUser({ ...newUser, establecimientos: current.filter(e => e !== est) });
    } else {
      setNewUser({ ...newUser, establecimientos: [...current, est] });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.role === 'USER' && newUser.establecimientos.length === 0) {
      setMessage('Debe seleccionar al menos un establecimiento para usuarios normales');
      return;
    }
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newUser, action: 'create' })
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      setNewUser({ username: '', password: '', role: 'USER', establecimientos: [] });
      fetchUsers();
    }
  };

  const handleAction = async (userId: number, action: string) => {
    if (action === 'delete' && !confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) fetchUsers();
  };

  return (
    <div className="app-layout">
      <Sidebar isAdmin={true} />
      
      <div className="main-content">
        <main className="container animate-fade-in">
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Administración de Usuarios</h1>
        
        {message && (
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid var(--primary-color)', borderRadius: '8px', marginBottom: '2rem' }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
          {/* Create User Form */}
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Usuario</label>
                <input required type="text" className="input-field" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Contraseña</label>
                <input required type="password" className="input-field" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Rol</label>
                <select className="input-field" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value, establecimientos: []})}>
                  <option value="USER">Usuario (USER)</option>
                  <option value="ADMIN">Administrador (ADMIN)</option>
                </select>
              </div>
              
              {newUser.role === 'USER' && (
                <div className="animate-fade-in">
                  <label style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'block' }}>Establecimientos Asignados</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1rem' }}>
                    {establecimientosList.map(est => (
                      <label key={est} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={newUser.establecimientos.includes(est)}
                          onChange={() => handleCheckbox(est)}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{est}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Crear Usuario</button>
            </form>
          </div>

          {/* Users List */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Usuarios del Sistema</h3>
            {loading ? <p>Cargando...</p> : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Rol</th>
                      <th>Establecimientos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => {
                      let ests = [];
                      try { ests = u.establecimientos ? JSON.parse(u.establecimientos) : []; } catch(e){}
                      return (
                      <tr key={u.id}>
                        <td>{u.username}</td>
                        <td>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '99px', 
                            fontSize: '0.75rem',
                            background: u.role === 'ADMIN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: u.role === 'ADMIN' ? 'var(--danger-color)' : 'var(--primary-color)'
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          {ests.length === 0 ? '-' : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {ests.map((e: string) => (
                                <span key={e} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{e}</span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleAction(u.id, 'reset')} className="btn" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)' }}>
                            Reset Pwd
                          </button>
                          <button onClick={() => handleAction(u.id, 'delete')} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    )})}
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
