import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

// The middleware function
export default withAuth(
  async function middleware(request) {
    console.log("🚀 ~ middleware ~ Pathname:", request.nextUrl.pathname);

    // If user is not authenticated and trying to access a private route
    if (!request.nextauth?.token && isPrivateRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is authenticated and trying to access a guest route (e.g., login page)
    if (request.nextauth?.token && isGuestRoute(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/clients", request.url));
    }

    // Allow request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // You can implement custom authorization logic here
        return true;
      },
    },
  }
);

// Guest and Private Routes
const guestRoutes = ["/login"];
const privateRoutes = ["/clients", "/dashboard", "/settings"]; // Example private routes

// Check if the route is a guest route (e.g., login)
function isGuestRoute(pathname:string) {
  return guestRoutes.some((route) => pathname.includes(route));
}

// Check if the route is a private route (e.g., clients dashboard)
function isPrivateRoute(pathname:string) {
  return privateRoutes.some((route) => pathname.includes(route));
}

// Config for middleware matcher (apply middleware to all routes except static and API)
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // Add any other paths as needed (e.g., '/admin/:path*', '/user/:path*')
  ],
};
