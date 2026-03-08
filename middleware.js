import { NextResponse } from "next/server";

export function middleware(request) {
  // Auth is handled inside each dashboard page directly
  // Middleware cannot read cookies set by the backend on a different port
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};