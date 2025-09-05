import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "supersecret");

const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;
  let isLoggedIn = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isLoggedIn = true;
    } catch (error) {
      console.error("JWT Verification Error: ", error);
      isLoggedIn = false;
    }
  }


  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
