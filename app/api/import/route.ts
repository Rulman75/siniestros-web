import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as xlsx from 'xlsx';

// Helper to format date to dd-mm-yyyy safely
function formatDate(value: any): string {
  if (!value) return '';
  if (value instanceof Date) {
    const d = value.getDate().toString().padStart(2, '0');
    const m = (value.getMonth() + 1).toString().padStart(2, '0');
    const y = value.getFullYear();
    return `${d}-${m}-${y}`;
  }
  
  const str = String(value);
  // If it's already dd-mm-yyyy or similar
  if (str.includes('-')) return str;
  if (str.includes('/')) return str.replace(/\//g, '-');
  
  // If it's an excel serial date and somehow didn't get parsed
  const num = Number(str);
  if (!isNaN(num)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + num * 86400000);
    const d = jsDate.getUTCDate().toString().padStart(2, '0');
    const m = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = jsDate.getUTCFullYear();
    return `${d}-${m}-${y}`;
  }

  return str;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Read with cellDates to automatically convert Excel serial dates to JS Dates
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data: any[] = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (data.length === 0) {
      return NextResponse.json({ message: 'El archivo Excel está vacío' }, { status: 400 });
    }

    const dict = await prisma.homologacion.findMany();
    const estabMap = new Map();
    dict.forEach(d => estabMap.set(d.establecimiento.toLowerCase(), { sector: d.sector, estabBase: d.estabBase }));

    const normalizeTipo = (val: string) => {
      const v = String(val ?? '').trim();
      if (v.toLowerCase() === 'trabajo') return 'Accidente de Trabajo';
      if (v.toLowerCase() === 'trayecto') return 'Accidente de Trayecto';
      return v;
    };

    const recordsToInsert = data.map((row) => {
      const rawEst = String(row['ESTABLECIMIENTO'] ?? '').trim();
      const mapped = estabMap.get(rawEst.toLowerCase()) || { sector: 'Sin Sector', estabBase: rawEst };

      return {
        numero: String(row['N°'] ?? ''),
        fechaPresentacion: formatDate(row['FECHA PRESENTACION']),
        tipoSiniestroIngreso: normalizeTipo(row['TIPO SINIESTRO INGRESO']),
        ctpStp: String(row['CTP/STP'] ?? ''),
        rutPaciente: String(row['RUT PACIENTE'] ?? ''),
        nombrePaciente: String(row['NOMBRE DE PACIENTE'] ?? ''),
        establecimiento: rawEst,
        estabBase: mapped.estabBase,
        sector: mapped.sector,
        numeroSiniestro: String(row['SINIESTRO'] ?? ''),
        fechaSiniestro: formatDate(row['FECHA SINIESTRO']),
        fechaInicioReposo: formatDate(row['FECHA INICIO REPOSO']),
        fechaAltaOk: formatDate(row['FECHA ALTA OK']),
        dp: String(row['DP'] ?? '0'),
        motivoAsistencia: String(row['MOTIVO DE ASISTENCIA'] ?? ''),
        tipoAlta: String(row['TIPO ALTA'] ?? ''),
        observaciones: String(row['OBSERVACIONES'] ?? ''),
      };
    });

    await prisma.siniestro.deleteMany({});
    
    await prisma.siniestro.createMany({
      data: recordsToInsert
    });

    return NextResponse.json({ message: 'Datos importados correctamente', count: recordsToInsert.length });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ message: 'Ocurrió un error al procesar el archivo' }, { status: 500 });
  }
}
