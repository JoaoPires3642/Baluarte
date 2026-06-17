import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname
      const isProtected = ["/admin", "/pedidos", "/checkout", "/conta"].some(
        (prefix) => path === prefix || path.startsWith(prefix + "/")
      )
      const isApiProtected = ["/api/admin", "/api/orders", "/api/payment", "/api/profile"].some(
        (prefix) => path === prefix || path.startsWith(prefix + "/")
      )
      if (isProtected || isApiProtected) {
        return !!token
      }
      return true
    },
  },
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
