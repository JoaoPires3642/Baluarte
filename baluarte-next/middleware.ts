import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher(["/admin(.*)", "/pedidos(.*)", "/checkout(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)?|png|jpg|jpeg|gif|svg|webp|ico|ttf|woff2?|json|xml)).*)",
    "/(api|trpc)(.*)",
  ],
}
