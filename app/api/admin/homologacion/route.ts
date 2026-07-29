import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  const payload = await verifyJWT(token);
  return payload?.role === 'ADMIN';
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  
  const data = await prisma.homologacion.findMany({
    orderBy: { establecimiento: 'asc' }
  });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { action, id, establecimiento, estabBase, sector, cantidadTrabajadores } = body;

    if (action === 'create') {
      await prisma.homologacion.create({
        data: {
          establecimiento: establecimiento.trim(),
          estabBase: estabBase.trim(),
          sector: sector.trim(),
          cantidadTrabajadores: parseInt(cantidadTrabajadores, 10) || 0
        }
      });
      return NextResponse.json({ message: 'Registro creado correctamente' });
    }

    if (action === 'update') {
      await prisma.homologacion.update({
        where: { id },
        data: {
          establecimiento: establecimiento.trim(),
          estabBase: estabBase.trim(),
          sector: sector.trim(),
          cantidadTrabajadores: parseInt(cantidadTrabajadores, 10) || 0
        }
      });
      return NextResponse.json({ message: 'Registro actualizado correctamente' });
    }

    if (action === 'delete') {
      await prisma.homologacion.delete({ where: { id } });
      return NextResponse.json({ message: 'Registro eliminado correctamente' });
    }

    return NextResponse.json({ message: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Ya existe este Establecimiento' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
