import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

const publicRoutes = ['/login', '/api/auth/login', '/api/auth/setup'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    const payload = await verifyJWT(token);
    
    if (!payload && !isPublicRoute) {
      // Token is invalid
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    if (payload) {
      // Check for mandatory password change
      if (payload.mustChangePassword === true && request.nextUrl.pathname !== '/change-password' && request.nextUrl.pathname !== '/api/auth/change-password' && !isPublicRoute) {
        return NextResponse.redirect(new URL('/change-password', request.url));
      }
      // If user is trying to access login page while authenticated
      if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // Admin protection for /admin routes
      if (request.nextUrl.pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
