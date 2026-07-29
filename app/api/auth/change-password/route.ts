import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ message: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 });
    }

    const hashed = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: payload.id as number },
      data: {
        password: hashed,
        mustChangePassword: false
      }
    });

    const newToken = await signJWT({
      ...payload,
      mustChangePassword: false
    });

    const response = NextResponse.json({ message: 'Contraseña actualizada correctamente' });
    response.cookies.set({
      name: 'token',
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
