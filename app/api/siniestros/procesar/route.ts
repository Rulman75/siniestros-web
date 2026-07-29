import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const payload = await verifyJWT(token);
    if (payload?.role !== 'ADMIN') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    // 1. Clear existing summary data
    await prisma.resumenSiniestro.deleteMany({});

    // 2. Fetch all siniestros
    const siniestros = await prisma.siniestro.findMany();

    // 3. Aggregate in memory
    const aggMap = new Map<string, any>();

    for (const s of siniestros) {
      if (!s.estabBase) continue;

      let dateStr = s.fechaPresentacion;
      if (!dateStr || dateStr === '-') continue; // Cannot determine month

      // Parse dd-mm-yyyy
      const parts = dateStr.split('-');
      if (parts.length !== 3) continue;

      const mes = parts[1];
      const anio = parts[2];

      let rawTipo = s.tipoSiniestroIngreso || 'Sin Clasificar';
      if (rawTipo.toLowerCase() === 'trabajo') rawTipo = 'Accidente de Trabajo';
      if (rawTipo.toLowerCase() === 'trayecto') rawTipo = 'Accidente de Trayecto';
      const tipo = rawTipo;
      
      const dp = parseInt(s.dp || '0', 10) || 0;

      const key = `${s.estabBase}|${mes}|${anio}|${tipo}`;

      if (!aggMap.has(key)) {
        aggMap.set(key, {
          estabBase: s.estabBase,
          mes,
          anio,
          tipoSiniestro: tipo,
          cantidadSiniestros: 0,
          sumaDiasReposo: 0
        });
      }

      const current = aggMap.get(key);
      current.cantidadSiniestros += 1;
      current.sumaDiasReposo += dp;
    }

    // 4. Insert aggregated data
    const recordsToInsert = Array.from(aggMap.values());
    if (recordsToInsert.length > 0) {
      await prisma.resumenSiniestro.createMany({
        data: recordsToInsert
      });
    }

    return NextResponse.json({ message: 'Data procesada correctamente', count: recordsToInsert.length });
  } catch (error) {
    console.error('Procesar error:', error);
    return NextResponse.json({ message: 'Ocurrió un error al procesar' }, { status: 500 });
  }
}
