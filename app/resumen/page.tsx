import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import ResumenClient from './ResumenClient';
import { redirect } from 'next/navigation';

export default async function ResumenServerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  
  const payload = await verifyJWT(token);
  if (!payload) redirect('/login');

  const isAdmin = payload.role === 'ADMIN';
  const userEstablecimientos = payload.establecimientos as string[] | undefined;

  return <ResumenClient isAdmin={isAdmin} userEstablecimientos={userEstablecimientos} />;
}
