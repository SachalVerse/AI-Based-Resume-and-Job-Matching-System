import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (token) {
      const role = token.role as string | null;

      // No role yet → send to onboarding (unless already there)
      if (!role && !pathname.startsWith("/onboarding")) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      // Recruiter accessing student routes → redirect
      if (role === "recruiter" && pathname.startsWith("/student")) {
        return NextResponse.redirect(new URL("/recruiter/dashboard", req.url));
      }

      // Student accessing recruiter routes → redirect
      if (role === "student" && pathname.startsWith("/recruiter")) {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/student/:path*", "/recruiter/:path*", "/onboarding"],
};

