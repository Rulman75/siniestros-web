import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, establecimientos: true, createdAt: true }
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const { username, password, role, action, userId, establecimientos } = await request.json();

    if (action === 'reset' && userId) {
      const hashed = await hashPassword('123456'); // default reset password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashed }
      });
      return NextResponse.json({ message: 'Contraseña reseteada a: 123456' });
    }

    if (action === 'delete' && userId) {
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ message: 'Usuario eliminado' });
    }

    // Default create
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, password: hashed, role, establecimientos: role === 'USER' ? JSON.stringify(establecimientos || []) : null }
    });
    return NextResponse.json({ message: 'Usuario creado', user });
  } catch (err) {
    return NextResponse.json({ message: 'Error interno' }, { status: 500 });
  }
}
