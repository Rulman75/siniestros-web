import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const data = await prisma.homologacion.findMany({
    select: { estabBase: true },
    distinct: ['estabBase']
  });
  
  const establecimientos = data.map(d => d.estabBase).sort();
  return NextResponse.json(establecimientos);
}
