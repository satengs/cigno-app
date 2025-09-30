import { NextResponse } from 'next/server';

export async function middleware(req) {
  const url = req.nextUrl;

  // Only protect dashboard routes
  if (!url.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // For now, allow all dashboard access
  // In the future, you can add role-based access control here
  return NextResponse.next();
}

export const config = { matcher: ['/dashboard/:path*'] };


