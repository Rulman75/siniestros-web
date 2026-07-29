import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const anio = searchParams.get('anio');
    let establecimiento = searchParams.get('establecimiento');

    const where: any = {};
    
    if (payload.role === 'USER') {
      const allowed = (payload.establecimientos as string[]) || [];
      if (establecimiento) {
        where.estabBase = allowed.includes(establecimiento) ? establecimiento : { in: allowed };
      } else {
        where.estabBase = { in: allowed };
      }
    } else {
      if (establecimiento) where.estabBase = establecimiento;
    }
    
    if (anio) where.anio = anio;

    const data = await prisma.resumenSiniestro.findMany({
      where,
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' },
        { estabBase: 'asc' }
      ]
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching data' }, { status: 500 });
  }
}
