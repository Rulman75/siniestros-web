import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import EstadisticasClient from './EstadisticasClient';

export default async function EstadisticasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? await verifyJWT(token) : null;
  const isAdmin = payload?.role === 'ADMIN';

  return (
    <div className="app-layout">
      <Sidebar isAdmin={isAdmin} />
      <div className="main-content">
        <main className="container animate-fade-in" style={{ maxWidth: '100%', padding: '2rem 3rem' }}>
          <EstadisticasClient isAdmin={isAdmin} />
        </main>
      </div>
    </div>
  );
}
