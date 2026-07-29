import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  const payload = token ? await verifyJWT(token) : null;
  const isAdmin = payload?.role === 'ADMIN';
  const userEstablecimientos = payload?.establecimientos as string[] | undefined;

  return (
    <div className="app-layout">
      <Sidebar isAdmin={isAdmin} />
      <div className="main-content">
        <main className="container" style={{ maxWidth: '100%', padding: '2rem 3rem' }}>
          <Dashboard isAdmin={isAdmin} userEstablecimientos={userEstablecimientos} />
        </main>
      </div>
    </div>
  );
}
