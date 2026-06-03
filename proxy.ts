import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/pedidos(.*)", "/checkout(.*)", "/conta(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/admin(.*)",
    "/checkout(.*)",
    "/conta(.*)",
    "/pedidos(.*)",
    "/api/admin(.*)",
    "/api/orders(.*)",
    "/api/payment(.*)",
    "/api/profile(.*)",
  ],
}
