import { NextResponse, type NextRequest } from "next/server";

import { AUTH_TOKEN_KEY } from "./lib/constants";

const publicRoutes = ["/", "/login", "/register"];
const authRoutes = ["/login", "/register"];

const isAuthRoute = (pathname: string): boolean => authRoutes.includes(pathname);
const isPublicRoute = (pathname: string): boolean => publicRoutes.includes(pathname);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  const isPublic = isPublicRoute(pathname);
  const isAuthPage = isAuthRoute(pathname);
  const isProtected = !isPublic;

  if (!token && isProtected) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
