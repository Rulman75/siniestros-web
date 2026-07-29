import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePasswords, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      establecimientos: user.establecimientos ? JSON.parse(user.establecimientos) : [],
      mustChangePassword: user.mustChangePassword
    });

    const response = NextResponse.json({ 
      message: 'Login successful',
      mustChangePassword: user.mustChangePassword
    });
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: 'Internal error' }, { status: 500 });
  }
}
