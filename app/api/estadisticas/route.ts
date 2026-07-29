import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const anio = searchParams.get('anio') || new Date().getFullYear().toString();

  try {
    // Traer todos los siniestros del año que sean CTP
    const siniestros = await prisma.siniestro.findMany({
      where: {
        fechaPresentacion: {
          contains: `-${anio}`
        },
        ctpStp: 'CTP'
      }
    });

    // Traer maestros de homologación para los N° Trabajadores y Sectores
    const homologacion = await prisma.homologacion.findMany();

    return NextResponse.json({ siniestros, homologacion });
  } catch (error) {
    console.error('Error in /api/estadisticas:', error);
    return NextResponse.json({ message: 'Error fetching estadisticas' }, { status: 500 });
  }
}
