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
    const mes = searchParams.get('mes');
    const anio = searchParams.get('anio');
    const tipoSiniestro = searchParams.get('tipoSiniestro');
    let establecimiento = searchParams.get('establecimiento');

    const where: any = {};
    
    // Role-based security
    if (payload.role === 'USER') {
      const allowed = (payload.establecimientos as string[]) || [];
      if (establecimiento) {
        // Must be in their allowed list
        where.estabBase = allowed.includes(establecimiento) ? establecimiento : { in: allowed };
      } else {
        where.estabBase = { in: allowed };
      }
    } else {
      // Admin
      if (establecimiento) where.estabBase = establecimiento;
    }
    if (tipoSiniestro) where.tipoSiniestroIngreso = tipoSiniestro;
    
    // For date, since we store dd-mm-yyyy, we can use contains for month and year
    // If mes is '01' and anio is '2026', we look for '-01-2026'
    if (mes && anio) {
      where.fechaPresentacion = { contains: `-${mes}-${anio}` };
    } else if (mes) {
      where.fechaPresentacion = { contains: `-${mes}-` };
    } else if (anio) {
      where.fechaPresentacion = { endsWith: `-${anio}` };
    }

    const data = await prisma.siniestro.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching data' }, { status: 500 });
  }
}
