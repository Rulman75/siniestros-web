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
    const establecimiento = searchParams.get('establecimiento');

    const where: any = {};
    
    // Role-based security
    if (payload.role === 'USER') {
      const allowed = (payload.establecimientos as string[]) || [];
      if (establecimiento) {
        where.estabBase = allowed.includes(establecimiento) ? establecimiento : { in: allowed };
      } else {
        where.estabBase = { in: allowed };
      }
    } else {
      // Admin
      if (establecimiento) where.estabBase = establecimiento;
    }

    const result = await prisma.homologacion.aggregate({
      _sum: {
        cantidadTrabajadores: true
      },
      where
    });

    return NextResponse.json({ total: result._sum.cantidadTrabajadores || 0 });
  } catch (error) {
    console.error('Error fetching trabajadores:', error);
    return NextResponse.json({ message: 'Error' }, { status: 500 });
  }
}
