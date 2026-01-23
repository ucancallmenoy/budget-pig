import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add the pathname to headers so it can be read in server components
  response.headers.set('x-pathname', request.nextUrl.pathname);
  
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/bills/:path*', '/debts/:path*', '/savings/:path*'],
};