'use server';

import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';

export async function getSessionUsername() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  
  const payload = await verifyJWT(token);
  return (payload?.username as string) || null;
}
