import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)?|png|jpg|jpeg|gif|svg|webp|ico|ttf|woff2?|json|xml)).*)",
    "/(api|trpc)(.*)",
  ],
}
