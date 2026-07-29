import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import * as xlsx from 'xlsx';

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return false;
  const payload = await verifyJWT(token);
  return payload?.role === 'ADMIN';
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ message: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) return NextResponse.json({ message: 'El archivo Excel está vacío' }, { status: 400 });

    const uniqueRecords = new Map();
    data.forEach((row) => {
      const est = String(row['ESTABLECIMIENTO'] ?? '').trim();
      if (est && !uniqueRecords.has(est)) {
        uniqueRecords.set(est, {
          sector: String(row['SECTOR'] ?? '').trim(),
          estabBase: String(row['ESTAB_BASE'] ?? '').trim(),
          establecimiento: est,
          cantidadTrabajadores: parseInt(String(row['CANT_TRAB'] ?? '0'), 10) || 0
        });
      }
    });

    const recordsToInsert = Array.from(uniqueRecords.values());

    // Borrar y recrear
    await prisma.homologacion.deleteMany({});
    await prisma.homologacion.createMany({
      data: recordsToInsert
    });

    return NextResponse.json({ message: 'Diccionario importado correctamente', count: recordsToInsert.length });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ message: 'Ocurrió un error al procesar el archivo' }, { status: 500 });
  }
}
