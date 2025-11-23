import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import type { TokenPayload } from "./lib/types";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("act")?.value;
  const { pathname } = req.nextUrl;

  if (!token && pathname !== "/login" && pathname !== "/register") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (
    (token && pathname === "/login") ||
    pathname === "/register" ||
    pathname === "/"
  ) {
    try {
      const { payload } = await jwtVerify(token!, JWT_SECRET);
      const user = payload as TokenPayload;
      return NextResponse.redirect(new URL(`/${user.role}`, req.url));
    } catch {
      return NextResponse.next();
    }
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const user = payload as TokenPayload;

      if (!pathname.startsWith(`/${user.role}`)) {
        return NextResponse.redirect(new URL(`/${user.role}`, req.url));
      }
    } catch {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("act");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/(sv|gv|bcn|pdt)/:path*"],
};
